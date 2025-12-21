/// <reference lib="webworker" />
import { createAlgorithm } from '../algorithms';
import type { BenchmarkJobPayload, BenchmarkResult } from '../types';

interface WorkerRequest {
  jobId: string;
  jobs: BenchmarkJobPayload[];
  runCount?: number;
}

interface WorkerProgress {
  jobId: string;
  type: 'progress';
  progress: number;
  total: number;
  result: BenchmarkResult;
}

interface WorkerComplete {
  jobId: string;
  type: 'complete';
  results: BenchmarkResult[];
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { jobId, jobs, runCount = 3 } = event.data;
  const results: BenchmarkResult[] = [];

  jobs.forEach((job, index) => {
    const singleRuns: BenchmarkResult[] = [];
    for (let run = 0; run < runCount; run += 1) {
      const result: BenchmarkResult = (() => {
        try {
          const sorter = createAlgorithm(job.algorithm, job.data);
          sorter.run(false);
          const stats = sorter.getStats();
          return {
            ...stats,
            algorithmType: job.algorithm,
          };
        } catch (error) {
          return {
            algorithmName: job.algorithm,
            comparisons: 0,
            swaps: 0,
            executionTime: 0,
            memoryUsage: 0,
            algorithmType: job.algorithm,
            error: error instanceof Error ? error.message : '未知错误',
            skipped: true,
          };
        }
      })();
      singleRuns.push(result);
    }

    const avg = (arr: number[]) =>
      arr.reduce((sum, value) => sum + value, 0) / arr.length;
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
      }
      return sorted[mid];
    };

    const aggregated: BenchmarkResult = (() => {
      const hasError = singleRuns.some((item) => item.error);
      if (hasError) {
        const firstError = singleRuns.find((item) => item.error);
        return {
          algorithmName: job.algorithm,
          comparisons: 0,
          swaps: 0,
          executionTime: 0,
          executionTimeAverage: 0,
          executionTimeMedian: 0,
          memoryUsage: 0,
          algorithmType: job.algorithm,
          runs: runCount,
          error: firstError?.error ?? '未知错误',
          skipped: true,
        };
      }
      const times = singleRuns.map((item) => item.executionTime);
      const comparisons = singleRuns.map((item) => item.comparisons);
      const swaps = singleRuns.map((item) => item.swaps);
      const memory = singleRuns.map((item) => item.memoryUsage);
      const averageTime = avg(times);
      const medianTime = median(times);

      return {
        algorithmName: job.algorithm,
        comparisons: avg(comparisons),
        swaps: avg(swaps),
        executionTime: averageTime,
        executionTimeAverage: averageTime,
        executionTimeMedian: medianTime,
        memoryUsage: Math.max(...memory),
        algorithmType: job.algorithm,
        runs: runCount,
      };
    })();

    results.push(aggregated);
    const progressPayload: WorkerProgress = {
      jobId,
      type: 'progress',
      progress: index + 1,
      total: jobs.length,
      result: aggregated,
    };
    self.postMessage(progressPayload);
  });

  const response: WorkerComplete = { jobId, type: 'complete', results };
  self.postMessage(response);
};
