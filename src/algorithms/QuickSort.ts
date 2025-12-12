import { SortAlgorithm } from './SortAlgorithm';

export class QuickSort extends SortAlgorithm {
  protected sort(recordSteps: boolean): void {
    this.quickSort(0, this.array.length - 1, recordSteps);
  }

  private quickSort(
    low: number,
    high: number,
    recordSteps: boolean,
  ): void {
    if (low < high) {
      const pivotIndex = this.partition(low, high, recordSteps);
      this.quickSort(low, pivotIndex - 1, recordSteps);
      this.quickSort(pivotIndex + 1, high, recordSteps);
    }
  }

  private partition(
    low: number,
    high: number,
    recordSteps: boolean,
  ): number {
    const pivotIndex = high;
    let i = low - 1;

    for (let j = low; j < high; j += 1) {
      if (this.compare(j, pivotIndex, recordSteps) <= 0) {
        i += 1;
        this.swap(i, j, recordSteps);
      }
    }
    this.swap(i + 1, high, recordSteps);
    return i + 1;
  }
}
