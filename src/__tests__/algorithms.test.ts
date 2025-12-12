import { describe, expect, it } from 'vitest';
import { createAlgorithm } from '../algorithms';
import { SortingAlgorithmType } from '../types';
import {
  N_LOG_N_THRESHOLD,
  QUADRATIC_THRESHOLD,
} from '../utils/constants';
import { exceedsThreshold } from '../utils/benchmark';

const algorithmList: SortingAlgorithmType[] = [
  SortingAlgorithmType.Bubble,
  SortingAlgorithmType.Selection,
  SortingAlgorithmType.Insertion,
  SortingAlgorithmType.Quick,
  SortingAlgorithmType.Merge,
  SortingAlgorithmType.Heap,
  SortingAlgorithmType.ExternalMerge,
];

const sampleData = [5, 0, 9, -3, 8, 4, 7];

describe('sorting algorithms', () => {
  algorithmList.forEach((algorithmType) => {
    it(`${algorithmType} run(true) 与 run(false) 结果一致`, () => {
      const expected = [...sampleData].sort((a, b) => a - b);

      const recorder = createAlgorithm(algorithmType, sampleData);
      recorder.run(true);
      const recordedResult = (recorder as any).array as number[];

      const fast = createAlgorithm(algorithmType, sampleData);
      fast.run(false);
      const fastResult = (fast as any).array as number[];

      expect(recordedResult).toEqual(expected);
      expect(fastResult).toEqual(expected);
    });
  });

  it('BubbleSort 在记录步骤时会触发步骤上限保护', () => {
    const size = 650; // 约 211k+ 比较，超过 MAX_STEPS=200000
    const data = Array.from({ length: size }, (_, index) => size - index);
    const sorter = createAlgorithm(SortingAlgorithmType.Bubble, data);
    expect(() => sorter.run(true)).toThrow(/步骤数量超过限制/);
  });

  it('ExternalSort 支持多块数据并保持排序正确', () => {
    const data = Array.from({ length: 23 }, (_, index) => (index % 5) - 2);
    const sorter = createAlgorithm(SortingAlgorithmType.ExternalMerge, data);
    sorter.run(false);
    const result = (sorter as any).array as number[];
    expect(result).toEqual([...data].sort((a, b) => a - b));
  });
});

describe('threshold guardrails', () => {
  it('O(n²) 与 O(n log n) 阈值校验正常工作', () => {
    expect(
      exceedsThreshold(
        SortingAlgorithmType.Bubble,
        QUADRATIC_THRESHOLD + 1,
      ),
    ).toBe(true);
    expect(
      exceedsThreshold(
        SortingAlgorithmType.Merge,
        N_LOG_N_THRESHOLD + 1,
      ),
    ).toBe(true);
    expect(
      exceedsThreshold(SortingAlgorithmType.Heap, N_LOG_N_THRESHOLD - 1),
    ).toBe(false);
  });
});
