import { SortAlgorithm } from './SortAlgorithm';

export class MergeSort extends SortAlgorithm {
  protected sort(recordSteps: boolean): void {
    if (this.array.length <= 1) {
      return;
    }

    this.mergeSort(0, this.array.length - 1, recordSteps);
  }

  private mergeSort(
    left: number,
    right: number,
    recordSteps: boolean,
  ): void {
    if (left >= right) {
      return;
    }

    const mid = Math.floor((left + right) / 2);
    this.mergeSort(left, mid, recordSteps);
    this.mergeSort(mid + 1, right, recordSteps);
    this.merge(left, mid, right, recordSteps);
  }

  private merge(
    left: number,
    mid: number,
    right: number,
    recordSteps: boolean,
  ) {
    const temp: number[] = [];
    let i = left;
    let j = mid + 1;

    while (i <= mid && j <= right) {
      if (this.compare(i, j, recordSteps) <= 0) {
        temp.push(this.array[i]);
        i += 1;
      } else {
        temp.push(this.array[j]);
        j += 1;
      }
    }

    while (i <= mid) {
      temp.push(this.array[i]);
      i += 1;
    }
    while (j <= right) {
      temp.push(this.array[j]);
      j += 1;
    }

    this.auxiliarySpace = Math.max(
      this.auxiliarySpace,
      temp.length * 8,
    );

    temp.forEach((value, index) => {
      this.overwrite(left + index, value, recordSteps);
    });
  }
}
