import { SortingAlgorithmType } from '../types';
import { BubbleSort } from './BubbleSort';
import { ExternalSort } from './ExternalSort';
import { HeapSort } from './HeapSort';
import { InsertionSort } from './InsertionSort';
import { MergeSort } from './MergeSort';
import { QuickSort } from './QuickSort';
import { SelectionSort } from './SelectionSort';
import { SortAlgorithm } from './SortAlgorithm';

export const createAlgorithm = (
  algorithm: SortingAlgorithmType,
  data: number[],
): SortAlgorithm => {
  switch (algorithm) {
    case SortingAlgorithmType.Bubble:
      return new BubbleSort(data);
    case SortingAlgorithmType.Selection:
      return new SelectionSort(data);
    case SortingAlgorithmType.Insertion:
      return new InsertionSort(data);
    case SortingAlgorithmType.Quick:
      return new QuickSort(data);
    case SortingAlgorithmType.Merge:
      return new MergeSort(data);
    case SortingAlgorithmType.Heap:
      return new HeapSort(data);
    case SortingAlgorithmType.ExternalMerge:
    default:
      return new ExternalSort(data);
  }
};

export {
  BubbleSort,
  ExternalSort,
  HeapSort,
  InsertionSort,
  MergeSort,
  QuickSort,
  SelectionSort,
  SortAlgorithm,
};
