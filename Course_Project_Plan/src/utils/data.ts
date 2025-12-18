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
