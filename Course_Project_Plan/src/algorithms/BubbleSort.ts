import { SortAlgorithm } from './SortAlgorithm';

export class BubbleSort extends SortAlgorithm {
  protected sort(recordSteps: boolean): void {
    const n = this.array.length;

    for (let i = 0; i < n - 1; i += 1) {
      for (let j = 0; j < n - i - 1; j += 1) {
        if (this.compare(j, j + 1, recordSteps) > 0) {
          this.swap(j, j + 1, recordSteps);
        }
      }
    }
  }
}
