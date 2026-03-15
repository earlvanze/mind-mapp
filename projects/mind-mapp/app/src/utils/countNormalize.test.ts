import { describe, expect, it } from 'vitest';
import { normalizeNonNegativeInt } from './countNormalize';

describe('normalizeNonNegativeInt', () => {
  it('normalizes finite values to truncated non-negative ints', () => {
    expect(normalizeNonNegativeInt(3.9)).toBe(3);
    expect(normalizeNonNegativeInt(-3.9)).toBe(0);
  });

  it('normalizes non-finite values to zero', () => {
    expect(normalizeNonNegativeInt(Number.NaN)).toBe(0);
    expect(normalizeNonNegativeInt(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
