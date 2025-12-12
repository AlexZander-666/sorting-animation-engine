import { useEffect, useMemo, useRef, useState } from 'react';
import { createAlgorithm } from '../algorithms';
import { useSortingContext } from '../context/SortingContext';
import { useVisualizerContext } from '../context/VisualizerContext';
import {
  exceedsThreshold,
  generateAICommentary,
} from '../utils/benchmark';
import {
  SortingAlgorithmType,
  type SortingStats,
} from '../types';

interface BenchmarkRow extends SortingStats {
  algorithmType: SortingAlgorithmType;
}

const algorithmDisplayName: Record<SortingAlgorithmType, string> = {
  [SortingAlgorithmType.Bubble]: 'BubbleSort',
  [SortingAlgorithmType.Selection]: 'SelectionSort',
  [SortingAlgorithmType.Insertion]: 'InsertionSort',
  [SortingAlgorithmType.Quick]: 'QuickSort',
  [SortingAlgorithmType.Merge]: 'MergeSort',
  [SortingAlgorithmType.Heap]: 'HeapSort',
  [SortingAlgorithmType.ExternalMerge]: 'ExternalSort',
};

const BenchmarkReport = () => {
  const { data, isWorkerSupported } = useSortingContext();
  const { setVisualizerState, pause } = useVisualizerContext();
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [commentary, setCommentary] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const pendingJobRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/benchmarkWorker.ts', import.meta.url),
        { type: 'module' },
      );
    } catch {
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

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
      try {
        const sorter = createAlgorithm(algorithmType, data);
        sorter.run(false);
        return {
          ...sorter.getStats(),
          algorithmType,
        };
      } catch (error) {
        return {
          algorithmName: algorithmDisplayName[algorithmType],
          comparisons: 0,
          swaps: 0,
          executionTime: 0,
          memoryUsage: 0,
          algorithmType,
          error: error instanceof Error ? error.message : '执行失败',
          skipped: true,
        };
      }
    });

  const handleBenchmark = () => {
    if (!data.length) {
      setError('请先提供数据集。');
      return;
    }

    pause();
    setLoading(true);
    setError(undefined);
    setCommentary('');
    setVisualizerState({ status: 'paused' });

    const skippedAlgorithms = algorithms.filter((algorithmType) =>
      exceedsThreshold(algorithmType, data.length),
    );
    setSkipped(skippedAlgorithms);
    const executableAlgorithms = algorithms.filter(
      (item) => !skippedAlgorithms.includes(item),
    );

    if (!executableAlgorithms.length) {
      setRows(
        skippedAlgorithms.map((algorithmType) => ({
          algorithmType,
          algorithmName: algorithmDisplayName[algorithmType],
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

    if (workerRef.current) {
      const jobId = crypto.randomUUID();
      pendingJobRef.current = jobId;
      workerRef.current.onmessage = (event: MessageEvent<any>) => {
        if (event.data.jobId !== pendingJobRef.current) return;
        const combined = [
          ...event.data.results,
          ...skippedAlgorithms.map((algorithmType) => ({
            algorithmType,
            algorithmName: algorithmDisplayName[algorithmType],
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
      };

      workerRef.current.postMessage({
        jobId,
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
        algorithmName: algorithmDisplayName[algorithmType],
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
        <button type="button" onClick={handleBenchmark} disabled={loading}>
          {loading ? '运行中...' : '运行对比'}
        </button>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>算法</th>
              <th>耗时 (ms)</th>
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
                <td>{row.executionTime.toFixed(2)}</td>
                <td>{row.comparisons}</td>
                <td>{row.swaps}</td>
                <td>{row.memoryUsage}</td>
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
