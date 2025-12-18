import { SortAlgorithm } from './SortAlgorithm';

export class SelectionSort extends SortAlgorithm {
  protected sort(recordSteps: boolean): void {
    const n = this.array.length;
    for (let i = 0; i < n - 1; i += 1) {
      let minIndex = i;
      for (let j = i + 1; j < n; j += 1) {
        if (this.compare(j, minIndex, recordSteps) < 0) {
          minIndex = j;
        }
      }
      if (minIndex !== i) {
        this.swap(i, minIndex, recordSteps);
      }
    }
  }
}
