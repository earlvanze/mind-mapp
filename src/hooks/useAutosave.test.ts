import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from './useAutosave';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useAutosave', () => {
  it('accepts custom delay parameter without throwing', () => {
    const onSave = vi.fn();
    expect(() => renderHook(() => useAutosave(onSave, 500))).not.toThrow();
  });

  it('does not throw when unmounted before any timer fires', () => {
    const onSave = vi.fn();
    const { unmount } = renderHook(() => useAutosave(onSave, 100));
    act(() => { vi.advanceTimersByTime(50); });
    expect(() => unmount()).not.toThrow();
  });

  it('does not call onSave on unmount if timer has not fired', () => {
    const onSave = vi.fn();
    const { unmount } = renderHook(() => useAutosave(onSave, 100));
    act(() => { vi.advanceTimersByTime(50); });
    unmount();
    act(() => { vi.advanceTimersByTime(100); });
    expect(onSave).not.toHaveBeenCalled();
  });
});