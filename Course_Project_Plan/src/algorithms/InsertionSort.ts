import { SortAlgorithm } from './SortAlgorithm';

export class InsertionSort extends SortAlgorithm {
  protected sort(recordSteps: boolean): void {
    for (let i = 1; i < this.array.length; i += 1) {
      let j = i;
      while (j > 0 && this.compare(j - 1, j, recordSteps) > 0) {
        this.swap(j - 1, j, recordSteps);
        j -= 1;
      }
    }
  }
}
