import { SortingAlgorithmType } from '../types';

export const algorithmLabels: Record<SortingAlgorithmType, string> = {
  [SortingAlgorithmType.Bubble]: '冒泡排序 (Bubble Sort)',
  [SortingAlgorithmType.Selection]: '选择排序 (Selection Sort)',
  [SortingAlgorithmType.Insertion]: '插入排序 (Insertion Sort)',
  [SortingAlgorithmType.Quick]: '快速排序 (Quick Sort)',
  [SortingAlgorithmType.Merge]: '归并排序 (Merge Sort)',
  [SortingAlgorithmType.Heap]: '堆排序 (Heap Sort)',
  [SortingAlgorithmType.ExternalMerge]: '外部归并 (External Merge)',
};

export const getAlgorithmLabel = (type: SortingAlgorithmType) =>
  algorithmLabels[type] ?? type;
