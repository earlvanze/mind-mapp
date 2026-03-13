import { describe, expect, it } from 'vitest';
import { shouldKeepSearchOpen } from './searchJump';

describe('shouldKeepSearchOpen', () => {
  it('returns false when no modifier is held', () => {
    expect(shouldKeepSearchOpen({})).toBe(false);
  });

  it('returns true for shift/cmd/ctrl modifiers', () => {
    expect(shouldKeepSearchOpen({ shiftKey: true })).toBe(true);
    expect(shouldKeepSearchOpen({ metaKey: true })).toBe(true);
    expect(shouldKeepSearchOpen({ ctrlKey: true })).toBe(true);
  });
});
