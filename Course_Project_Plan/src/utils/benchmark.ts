import type { SortingStats } from '../types';
import { SortingAlgorithmType } from '../types';
import {
  N_LOG_N_THRESHOLD,
  QUADRATIC_THRESHOLD,
} from './constants';

const thresholdMap: Record<SortingAlgorithmType, number> = {
  [SortingAlgorithmType.Bubble]: QUADRATIC_THRESHOLD,
  [SortingAlgorithmType.Selection]: QUADRATIC_THRESHOLD,
  [SortingAlgorithmType.Insertion]: QUADRATIC_THRESHOLD,
  [SortingAlgorithmType.Quick]: N_LOG_N_THRESHOLD,
  [SortingAlgorithmType.Merge]: N_LOG_N_THRESHOLD,
  [SortingAlgorithmType.Heap]: N_LOG_N_THRESHOLD,
  [SortingAlgorithmType.ExternalMerge]: N_LOG_N_THRESHOLD,
};

export const exceedsThreshold = (
  algorithm: SortingAlgorithmType,
  size: number,
): boolean => {
  return size > thresholdMap[algorithm];
};

export const generateAICommentary = (
  stats: SortingStats[],
  dataSize: number,
  skipped: string[],
): string => {
  if (!stats.length) {
    return '暂无可用数据，请调整输入后重新运行。';
  }

  const validStats = stats.filter((item) => !item.error && !item.skipped);
  if (!validStats.length) {
    return '所有算法均被跳过或执行失败，请尝试更小的数据规模。';
  }

  const sortedByTime = [...validStats].sort(
    (a, b) => a.executionTime - b.executionTime,
  );
  const winner = sortedByTime[0];
  const loser = sortedByTime[sortedByTime.length - 1];
  const swappedMost = [...validStats].sort(
    (a, b) => b.swaps - a.swaps,
  )[0];

  const commentary: string[] = [
    `数据规模：${dataSize}。最佳表现：${winner.algorithmName} 用时 ${winner.executionTime.toFixed(2)}ms。`,
  ];

  if (winner.algorithmName.includes('Quick') && dataSize > 100) {
    commentary.push('在当前随机度下，快速排序的 O(n log n) 优势十分明显。');
  }

  if (winner.algorithmName.includes('Bubble') && dataSize < 30) {
    commentary.push('小规模数据下，简单算法的常数优势仍然可观。');
  }

  commentary.push(
    `${loser.algorithmName} 耗时相对较长，适合配合更小数据集或作为教学对照。`,
  );

  commentary.push(
    `${swappedMost.algorithmName} 写入次数最多 (${swappedMost.swaps})，当写操作昂贵时可考虑其他算法。`,
  );

  if (skipped.length) {
    commentary.push(
      `为保护浏览器响应能力，以下算法被自动跳过：${skipped.join(', ')}。`,
    );
  }

  return commentary.join(' ');
};
