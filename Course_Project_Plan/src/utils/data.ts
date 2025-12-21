import { MAX_VALUE, MIN_VALUE } from './constants';

export const generateRandomArray = (
  size: number,
  min = MIN_VALUE,
  max = MAX_VALUE,
): number[] => {
  return Array.from({ length: size }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  );
};

export const generateNearlySortedArray = (
  size: number,
  min = MIN_VALUE,
  max = MAX_VALUE,
  swapCount = Math.max(1, Math.floor(size * 0.05)),
): number[] => {
  const step = Math.max(1, Math.floor((max - min) / Math.max(1, size)));
  const base = Array.from({ length: size }, (_, index) => min + index * step);
  for (let i = 0; i < swapCount; i += 1) {
    const a = Math.floor(Math.random() * size);
    const b = Math.floor(Math.random() * size);
    [base[a], base[b]] = [base[b], base[a]];
  }
  return base.map((value) =>
    Math.max(min, Math.min(max, Math.round(value))),
  );
};

export const generateReverseArray = (
  size: number,
  min = MIN_VALUE,
  max = MAX_VALUE,
): number[] => {
  const step = Math.max(1, Math.floor((max - min) / Math.max(1, size)));
  return Array.from({ length: size }, (_, index) =>
    Math.max(min, Math.min(max, Math.round(max - index * step))),
  );
};

export const generateDuplicateHeavyArray = (
  size: number,
  min = MIN_VALUE,
  max = MAX_VALUE,
  uniqueCount = Math.max(2, Math.floor(size * 0.2)),
): number[] => {
  const uniques = Array.from({ length: uniqueCount }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  );
  return Array.from({ length: size }, () => {
    const pick = uniques[Math.floor(Math.random() * uniques.length)];
    return pick;
  });
};

export const generateOutlierArray = (
  size: number,
  min = MIN_VALUE,
  max = MAX_VALUE,
  outlierRatio = 0.05,
): number[] => {
  const base = generateRandomArray(size, min, max);
  const outliers = Math.max(1, Math.floor(size * outlierRatio));
  for (let index = 0; index < outliers; index += 1) {
    const target = Math.floor(Math.random() * size);
    base[target] = Math.random() > 0.5 ? max : min;
  }
  return base;
};

export interface ParsedResult {
  values: number[];
  normalizedCount: number;
  droppedCount: number;
  clampedCount: number;
}

export const parseInputToArray = (input: string): number[] => {
  return sanitizeInput(input).values;
};

export const sanitizeInput = (
  input: string,
  min = MIN_VALUE,
  max = MAX_VALUE,
): ParsedResult => {
  const tokens = input
    .split(/[\s,]+/) // 支持逗号、空格、换行等分隔符
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  let droppedCount = 0;
  let clampedCount = 0;

  const values = tokens
    .map((value) => Number(value))
    .filter((value) => {
      if (Number.isFinite(value)) return true;
      droppedCount += 1;
      return false;
    })
    .map((value) => {
      if (value < min) {
        clampedCount += 1;
        return min;
      }
      if (value > max) {
        clampedCount += 1;
        return max;
      }
      return value;
    });

  return {
    values,
    normalizedCount: values.length,
    droppedCount,
    clampedCount,
  };
};
