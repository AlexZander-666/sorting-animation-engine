import { SortAlgorithm } from './SortAlgorithm';

export class HeapSort extends SortAlgorithm {
  protected sort(recordSteps: boolean): void {
    const n = this.array.length;

    for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
      this.heapify(n, i, recordSteps);
    }

    for (let i = n - 1; i > 0; i -= 1) {
      this.swap(0, i, recordSteps);
      this.heapify(i, 0, recordSteps);
    }
  }

  private heapify(
    size: number,
    root: number,
    recordSteps: boolean,
  ): void {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size && this.compare(left, largest, recordSteps) > 0) {
      largest = left;
    }

    if (right < size && this.compare(right, largest, recordSteps) > 0) {
      largest = right;
    }

    if (largest !== root) {
      this.swap(root, largest, recordSteps);
      this.heapify(size, largest, recordSteps);
    }
  }
}
