import type { SortStep, SortingStats } from '../types';
import { MAX_STEPS } from '../utils/constants';

export abstract class SortAlgorithm {
  protected array: number[];
  protected steps: SortStep[] = [];
  protected comparisons = 0;
  protected swaps = 0;
  protected startTime = 0;
  protected duration = 0;
  protected auxiliarySpace = 0;

  constructor(originalArray: number[]) {
    this.array = [...originalArray];
  }

  run(recordSteps: boolean): SortStep[] {
    this.reset(recordSteps);
    this.sort(recordSteps);
    this.duration = performance.now() - this.startTime;
    return recordSteps ? this.steps : [];
  }

  getStats(): SortingStats {
    return {
      algorithmName: this.constructor.name,
      comparisons: this.comparisons,
      swaps: this.swaps,
      executionTime: this.duration,
      memoryUsage: this.array.length * 8 + this.auxiliarySpace,
    };
  }

  protected abstract sort(recordSteps: boolean): void;

  protected reset(recordSteps: boolean) {
    this.steps = recordSteps ? [] : this.steps;
    this.comparisons = 0;
    this.swaps = 0;
    this.startTime = performance.now();
    this.auxiliarySpace = 0;
  }

  protected ensureCapacity(record: boolean) {
    if (record && this.steps.length >= MAX_STEPS) {
      throw new Error(
        `动画步骤数量超过限制 (${MAX_STEPS})，请减小输入规模。`,
      );
    }
  }

  protected pushStep(step: SortStep, record: boolean) {
    if (record) {
      this.ensureCapacity(true);
      this.steps.push(step);
    }
  }

  protected compare(i: number, j: number, record: boolean): number {
    this.comparisons++;
    this.pushStep({ type: 'compare', indices: [i, j] }, record);
    return this.array[i] - this.array[j];
  }

  protected swap(i: number, j: number, record: boolean) {
    this.swaps++;
    this.pushStep({ type: 'swap', indices: [i, j] }, record);
    const temp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = temp;
  }

  protected overwrite(index: number, value: number, record: boolean) {
    this.swaps++;
    this.pushStep({ type: 'overwrite', index, value }, record);
    this.array[index] = value;
  }
}
