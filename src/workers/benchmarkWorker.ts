/// <reference lib="webworker" />
import { createAlgorithm } from '../algorithms';
import type { BenchmarkJobPayload, BenchmarkResult } from '../types';

interface WorkerRequest {
  jobId: string;
  jobs: BenchmarkJobPayload[];
}

interface WorkerResponse {
  jobId: string;
  results: BenchmarkResult[];
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { jobId, jobs } = event.data;
  const results: BenchmarkResult[] = jobs.map((job) => {
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
  });

  const response: WorkerResponse = { jobId, results };
  self.postMessage(response);
};
