import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutTransitions, prefersReducedMotion, getPositionTransition } from './useLayoutTransitions';

const mockSetIsTransitioning = vi.fn();

vi.mock('../store/useMindMapStore', () => ({
  useMindMapStore: Object.assign(
    vi.fn((selector?: (s: { isTransitioning: boolean }) => any) => {
      if (selector) return selector({ isTransitioning: false });
      return false;
    }),
    {
      getState: () => ({ setIsTransitioning: mockSetIsTransitioning }),
    }
  ),
}));

describe('useLayoutTransitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in non-transitioning state', () => {
    const { result } = renderHook(() => useLayoutTransitions());
    expect(result.current.isTransitioning).toBe(false);
  });

  it('sets transitioning true when startTransition is called', () => {
    const { result } = renderHook(() => useLayoutTransitions());
    act(() => { result.current.startTransition(); });
    expect(mockSetIsTransitioning).toHaveBeenCalledWith(true);
  });

  it('auto-disables transitioning after 300ms', () => {
    const { result } = renderHook(() => useLayoutTransitions());
    act(() => { result.current.startTransition(); });
    act(() => { vi.advanceTimersByTime(350); });
    expect(mockSetIsTransitioning).toHaveBeenCalledWith(false);
  });

  it('clears existing timer when startTransition is called again', () => {
    const { result } = renderHook(() => useLayoutTransitions());
    act(() => { result.current.startTransition(); }); // timer #1, fires at t=300
    act(() => { vi.advanceTimersByTime(150); });      // t=150, timer #1 not fired yet
    act(() => { result.current.startTransition(); }); // clears timer #1, starts timer #2
    // Advance well past both original timers
    act(() => { vi.advanceTimersByTime(500); });
    // Final call should be false (last timer cleared + re-set)
    const calls = mockSetIsTransitioning.mock.calls;
    expect(calls[calls.length - 1]).toEqual([false]);
  });

  it('clears timer on unmount without crashing', () => {
    const { result, unmount } = renderHook(() => useLayoutTransitions());
    act(() => { result.current.startTransition(); });
    unmount();
    act(() => { vi.advanceTimersByTime(400); });
    expect(true).toBe(true);
  });
});

describe('getPositionTransition', () => {
  it('returns CSS transition string when transitioning', () => {
    const result = getPositionTransition(true);
    expect(result).toContain('left');
    expect(result).toContain('top');
  });

  it('returns none when not transitioning', () => {
    const result = getPositionTransition(false);
    expect(result).toBe('none');
  });
});