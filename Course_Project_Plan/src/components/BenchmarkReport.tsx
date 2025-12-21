import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAlgorithm } from '../algorithms';
import { useSortingContext } from '../context/SortingContext';
import { useVisualizerContext } from '../context/VisualizerContext';
import {
  exceedsThreshold,
  generateAICommentary,
} from '../utils/benchmark';
import { getAlgorithmLabel } from '../utils/labels';
import {
  SortingAlgorithmType,
  type SortingStats,
  type BenchmarkResult,
} from '../types';

interface BenchmarkRow extends SortingStats {
  algorithmType: SortingAlgorithmType;
}

const BenchmarkReport = () => {
  const { data, isWorkerSupported } = useSortingContext();
  const { setVisualizerState, pause } = useVisualizerContext();
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [commentary, setCommentary] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number }>(
    { current: 0, total: 0 },
  );
  const [hasWorker, setHasWorker] = useState(false);
  const [runCount, setRunCount] = useState(3);
  const workerRef = useRef<Worker | null>(null);
  const pendingJobRef = useRef<string | null>(null);
  const resultsRef = useRef<BenchmarkRow[]>([]);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    try {
      workerRef.current = new Worker(
        new URL('../workers/benchmarkWorker.ts', import.meta.url),
        { type: 'module' },
      );
      setHasWorker(true);
    } catch {
      workerRef.current = null;
      setHasWorker(false);
    }
    return workerRef.current;
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  const algorithms = useMemo(
    () =>
      [
        SortingAlgorithmType.Bubble,
        SortingAlgorithmType.Selection,
        SortingAlgorithmType.Insertion,
        SortingAlgorithmType.Quick,
        SortingAlgorithmType.Merge,
        SortingAlgorithmType.Heap,
        SortingAlgorithmType.ExternalMerge,
      ] as SortingAlgorithmType[],
    [],
  );

  const runLocally = (algorithmsToRun: SortingAlgorithmType[]) =>
    algorithmsToRun.map((algorithmType) => {
      const singleRuns: BenchmarkRow[] = [];
      for (let index = 0; index < runCount; index += 1) {
        try {
          const sorter = createAlgorithm(algorithmType, data);
          sorter.run(false);
          singleRuns.push({
            ...sorter.getStats(),
            algorithmName: getAlgorithmLabel(algorithmType),
            algorithmType,
          });
        } catch (error) {
          return {
            algorithmName: getAlgorithmLabel(algorithmType),
            comparisons: 0,
            swaps: 0,
            executionTime: 0,
            executionTimeAverage: 0,
            executionTimeMedian: 0,
            memoryUsage: 0,
            algorithmType,
            runs: runCount,
            error: error instanceof Error ? error.message : '执行失败',
            skipped: true,
          };
        }
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
      const times = singleRuns.map((item) => item.executionTime);
      const comparisons = singleRuns.map((item) => item.comparisons);
      const swaps = singleRuns.map((item) => item.swaps);
      const memory = singleRuns.map((item) => item.memoryUsage);
      return {
        algorithmName: getAlgorithmLabel(algorithmType),
        comparisons: avg(comparisons),
        swaps: avg(swaps),
        executionTime: avg(times),
        executionTimeAverage: avg(times),
        executionTimeMedian: median(times),
        memoryUsage: Math.max(...memory),
        algorithmType,
        runs: runCount,
      };
    });

  const cancelBenchmark = () => {
    pendingJobRef.current = null;
    resultsRef.current = [];
    setLoading(false);
    setProgress({ current: 0, total: 0 });
    setCommentary('Benchmark 已取消');
    workerRef.current?.terminate();
    workerRef.current = null;
    setHasWorker(false);
  };

  const handleBenchmark = () => {
    if (loading && workerRef.current) {
      cancelBenchmark();
      return;
    }

    if (!data.length) {
      setError('请先提供数据集。');
      return;
    }

    pause();
    setLoading(true);
    setError(undefined);
    setCommentary('');
    setProgress({ current: 0, total: 0 });
    setRows([]);
    resultsRef.current = [];
    setHasWorker(!!workerRef.current);
    setVisualizerState({ status: 'paused' });

    const skippedAlgorithms = algorithms.filter((algorithmType) =>
      exceedsThreshold(algorithmType, data.length),
    );
    setSkipped(skippedAlgorithms);
    const executableAlgorithms = algorithms.filter(
      (item) => !skippedAlgorithms.includes(item),
    );
    setProgress({
      current: 0,
      total: executableAlgorithms.length,
    });

    if (!executableAlgorithms.length) {
      setRows(
        skippedAlgorithms.map((algorithmType) => ({
          algorithmType,
          algorithmName: getAlgorithmLabel(algorithmType),
          comparisons: 0,
          swaps: 0,
          executionTime: 0,
          memoryUsage: 0,
          skipped: true,
          error: '已被阈值保护逻辑跳过',
        })),
      );
      setCommentary(
        '所有算法都被输入规模保护机制跳过，请尝试更小的数据量。',
      );
      setLoading(false);
      return;
    }

    const worker = ensureWorker();
    if (worker) {
      const jobId = crypto.randomUUID();
      pendingJobRef.current = jobId;
      worker.onmessage = (
        event: MessageEvent<
          | {
              jobId: string;
              type: 'progress';
              progress: number;
              total: number;
              result: BenchmarkResult;
            }
          | {
              jobId: string;
              type: 'complete';
              results: BenchmarkResult[];
            }
        >,
      ) => {
        if (event.data.jobId !== pendingJobRef.current) return;
        if (event.data.type === 'progress') {
          const normalizedResult: BenchmarkRow = {
            ...event.data.result,
            algorithmName: getAlgorithmLabel(event.data.result.algorithmType),
          };
          resultsRef.current = [...resultsRef.current, normalizedResult];
          setProgress({
            current: event.data.progress,
            total: event.data.total,
          });
          setRows([
            ...resultsRef.current,
            ...skippedAlgorithms.map((algorithmType) => ({
              algorithmType,
              algorithmName: getAlgorithmLabel(algorithmType),
              comparisons: 0,
              swaps: 0,
              executionTime: 0,
              memoryUsage: 0,
              skipped: true,
              error: '已被阈值保护逻辑跳过',
            })),
          ]);
          return;
        }

        // complete
        const normalizedResults = event.data.results.map(
          (item: BenchmarkRow) => ({
            ...item,
            algorithmName: getAlgorithmLabel(item.algorithmType),
          }),
        );
        resultsRef.current = normalizedResults;
        const combined = [
          ...normalizedResults,
          ...skippedAlgorithms.map((algorithmType) => ({
            algorithmType,
            algorithmName: getAlgorithmLabel(algorithmType),
            comparisons: 0,
            swaps: 0,
            executionTime: 0,
            memoryUsage: 0,
            skipped: true,
            error: '已被阈值保护逻辑跳过',
          })),
        ];
        setRows(combined);
        setCommentary(
          generateAICommentary(combined, data.length, skippedAlgorithms),
        );
        setLoading(false);
        setProgress({
          current: normalizedResults.length,
          total: executableAlgorithms.length,
        });
        pendingJobRef.current = null;
      };

      worker.postMessage({
        jobId,
        runCount,
        jobs: executableAlgorithms.map((algorithmType) => ({
          algorithm: algorithmType,
          data,
        })),
      });
      return;
    }

    const localResults = runLocally(executableAlgorithms);
    const merged = [
      ...localResults,
      ...skippedAlgorithms.map((algorithmType) => ({
        algorithmType,
        algorithmName: getAlgorithmLabel(algorithmType),
        comparisons: 0,
        swaps: 0,
        executionTime: 0,
        memoryUsage: 0,
        skipped: true,
        error: '已被阈值保护逻辑跳过',
      })),
    ];
    setRows(merged);
    setCommentary(generateAICommentary(merged, data.length, skippedAlgorithms));
    setLoading(false);
    setProgress({
      current: localResults.length,
      total: executableAlgorithms.length,
    });
  };

  return (
    <section className="benchmark-panel">
      <header>
        <h2>横向对比 (Benchmark)</h2>
        <p>
          在后台以最快速度运行所有算法。若数据量过大，将自动跳过
          O(n²) 算法以保护页面响应。
        </p>
        {!isWorkerSupported ? (
          <p className="warning-text">
            当前环境不支持 Web Worker，Benchmark 将在主线程运行并依赖阈值保护。
          </p>
        ) : null}
        <div className="benchmark-controls">
          <label>
            运行次数：
            <select
              value={runCount}
              disabled={loading}
              onChange={(event) => setRunCount(Number(event.target.value))}
              aria-label="benchmark-run-count"
            >
              {[1, 3, 5].map((count) => (
                <option key={count} value={count}>
                  {count} 次
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading && progress.total ? (
          <div className="progress-inline" aria-label="benchmark-progress">
            <div className="progress-inline__bar">
              <div
                className="progress-inline__value"
                style={{
                  width: `${Math.min(
                    100,
                    (progress.current / progress.total) * 100 || 0,
                  )}%`,
                }}
              />
            </div>
            <span>
              进度：{progress.current}/{progress.total}，每算法运行 {runCount} 次（取中位/均值）
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleBenchmark}
          disabled={loading && !hasWorker}
        >
          {loading && hasWorker
            ? '取消运行'
            : loading
              ? '运行中...'
              : '运行对比'}
        </button>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>算法</th>
              <th>耗时 (ms，中位/均值)</th>
              <th>比较次数</th>
              <th>交换/写入次数</th>
              <th>内存估算 (B)</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.algorithmType}>
                <td>{row.algorithmName}</td>
                <td>
                  {row.executionTimeMedian?.toFixed(2) ??
                    row.executionTime.toFixed(2)}
                  {' / '}
                  {row.executionTimeAverage?.toFixed(2) ??
                    row.executionTime.toFixed(2)}
                </td>
                <td>{Math.round(row.comparisons)}</td>
                <td>{Math.round(row.swaps)}</td>
                <td>{Math.round(row.memoryUsage)}</td>
                <td>
                  {row.skipped
                    ? '已跳过'
                    : row.error
                      ? row.error
                      : '完成'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {commentary ? (
        <div className="commentary">
          <h3>AI 评点</h3>
          <p>{commentary}</p>
        </div>
      ) : null}
      {skipped.length ? (
        <p className="warning-text">
          以下算法被自动跳过：{skipped.join(', ')}。如需观察其表现，请减小数据规模。
        </p>
      ) : null}
    </section>
  );
};

export default BenchmarkReport;
