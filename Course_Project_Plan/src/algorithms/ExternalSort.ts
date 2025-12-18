import { MEMORY_LIMIT } from '../utils/constants';
import { SortAlgorithm } from './SortAlgorithm';

export class ExternalSort extends SortAlgorithm {
  private readonly MEMORY_CAPACITY = MEMORY_LIMIT;

  protected sort(recordSteps: boolean): void {
    if (this.array.length === 0) {
      return;
    }

    const chunkSize = this.MEMORY_CAPACITY;
    const chunks: number[][] = [];

    for (let start = 0; start < this.array.length; start += chunkSize) {
      const chunk = this.array.slice(start, start + chunkSize);
      this.ensureMemoryCapacity(chunk.length);
      chunks.push(chunk);
    }

    this.auxiliarySpace = Math.max(
      this.auxiliarySpace,
      this.MEMORY_CAPACITY * 8,
    );

    this.pushStep(
      {
        type: 'splitToChunks',
        chunks: chunks.map((chunk) => [...chunk]),
      },
      recordSteps,
    );

    const sortedChunks = chunks.map((chunk, index) => {
      this.pushStep(
        {
          type: 'loadChunkToMemory',
          chunkId: index,
          data: [...chunk],
        },
        recordSteps,
      );
      const sorted = [...chunk].sort((a, b) => {
        this.comparisons++;
        return a - b;
      });
      this.ensureMemoryCapacity(sorted.length);
      sorted.forEach((value, writeIndex) => {
        this.pushStep(
          {
            type: 'writeToDisk',
            chunkId: index,
            index: writeIndex,
            value,
          },
          recordSteps,
        );
      });
      return sorted;
    });

    this.multiWayMerge(sortedChunks, recordSteps);
  }

  private ensureMemoryCapacity(size: number) {
    if (size > this.MEMORY_CAPACITY) {
      throw new Error(
        `单个数据块大小 (${size}) 超出内存缓冲区上限 ${this.MEMORY_CAPACITY}，请减少输入规模。`,
      );
    }
  }

  private multiWayMerge(
    chunks: number[][],
    recordSteps: boolean,
  ): void {
    const positions = new Array(chunks.length).fill(0);
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const outputChunkId = chunks.length;

    for (let writeIndex = 0; writeIndex < totalLength; writeIndex += 1) {
      let winnerChunk = -1;
      let winnerValue = Infinity;
      const candidateChunks: number[] = [];

      chunks.forEach((chunk, chunkId) => {
        if (positions[chunkId] < chunk.length) {
          const candidate = chunk[positions[chunkId]];
          candidateChunks.push(chunkId);
          this.comparisons++;
          if (candidate < winnerValue) {
            winnerValue = candidate;
            winnerChunk = chunkId;
          }
        }
      });

      if (winnerChunk === -1) {
        break;
      }

      this.pushStep(
        {
          type: 'loadChunkToMemory',
          chunkId: winnerChunk,
          data: [chunks[winnerChunk][positions[winnerChunk]]],
        },
        recordSteps,
      );
      this.pushStep(
        {
          type: 'comparisonDetails',
          indices: candidateChunks,
          winnerIndex: winnerChunk,
        },
        recordSteps,
      );

      this.pushStep(
        {
          type: 'writeToDisk',
          chunkId: outputChunkId,
          index: writeIndex,
          value: winnerValue,
        },
        recordSteps,
      );

      this.overwrite(writeIndex, winnerValue, recordSteps);
      positions[winnerChunk] += 1;
    }
  }
}
