export const SortingAlgorithmType = {
  Bubble: 'bubble',
  Selection: 'selection',
  Insertion: 'insertion',
  Quick: 'quick',
  Merge: 'merge',
  Heap: 'heap',
  ExternalMerge: 'externalMerge',
} as const;

export type SortingAlgorithmType =
  (typeof SortingAlgorithmType)[keyof typeof SortingAlgorithmType];

export type SortStep =
  | { type: 'compare'; indices: [number, number] }
  | { type: 'swap'; indices: [number, number] }
  | { type: 'overwrite'; index: number; value: number }
  | { type: 'splitToChunks'; chunks: number[][] }
  | { type: 'loadChunkToMemory'; chunkId: number; data: number[] }
  | { type: 'writeToDisk'; chunkId: number; index: number; value: number }
  | { type: 'comparisonDetails'; indices: number[]; winnerIndex: number };

export interface SortingStats {
  algorithmName: string;
  comparisons: number;
  swaps: number;
  executionTime: number;
  memoryUsage: number;
  runs?: number;
  executionTimeMedian?: number;
  executionTimeAverage?: number;
  skipped?: boolean;
  error?: string;
}

export interface BenchmarkResult extends SortingStats {
  algorithmType: SortingAlgorithmType;
}

export interface SortingConfig {
  algorithm: SortingAlgorithmType;
  speed: number;
  datasetSize: number;
  data: number[];
}

export interface SortingContextValue extends SortingConfig {
  isWorkerSupported: boolean;
  setData: (data: number[]) => void;
  setAlgorithm: (algorithm: SortingAlgorithmType) => void;
  setSpeed: (speed: number) => void;
  setDatasetSize: (size: number) => void;
}

export interface BenchmarkJobPayload {
  algorithm: SortingAlgorithmType;
  data: number[];
}
