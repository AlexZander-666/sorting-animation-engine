import { describe, expect, it } from 'vitest';
import { sanitizeInput } from '../utils/data';

describe('input sanitize', () => {
  it('keeps zeros and trims whitespace/commas', () => {
    const result = sanitizeInput('0, 1, -1');
    expect(result.values).toEqual([5, 5, 5]); // 全部被限制到 MIN=5
    expect(result.clampedCount).toBe(3);
  });

  it('drops non-numeric tokens and reports count', () => {
    const result = sanitizeInput('5,foo,8 bar,9');
    expect(result.values).toEqual([5, 8, 9]);
    expect(result.droppedCount).toBe(2); // "foo" 与 "bar" 被忽略
  });

  it('clamps large numbers to MAX', () => {
    const result = sanitizeInput('10, 200, 50', 5, 100);
    expect(result.values).toEqual([10, 100, 50]);
    expect(result.clampedCount).toBe(1);
  });

  it('supports whitespace and newline separated tokens', () => {
    const result = sanitizeInput('1 2\n3,4', -10, 10);
    expect(result.values).toEqual([1, 2, 3, 4]);
    expect(result.droppedCount).toBe(0);
    expect(result.clampedCount).toBe(0);
  });
});
