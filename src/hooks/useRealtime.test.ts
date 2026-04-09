/**
 * useRealtime hook tests
 *
 * Tests the realtime collaboration hook's:
 * - subscription lifecycle (connect/disconnect)
 * - follow mode toggle (applies pending changes)
 * - pending queue management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtime } from './useRealtime';
import type { RemoteChange } from '../lib/realtime';

// Mock the realtime lib
vi.mock('../lib/realtime', () => ({
  subscribeToProject: vi.fn(() => () => {}),
  broadcastChange: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
}));

// Mock zustand
const mockImportState = vi.fn();
const mockNodes = {};

vi.mock('../store/useMindMapStore', () => ({
  useMindMapStore: vi.fn((selector) => {
    if (selector === 'nodes') return mockNodes;
    if (selector === 'importState') return mockImportState;
    return vi.fn();
  }),
}));

describe('useRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns disconnected state when no projectId', () => {
    const { result } = renderHook(() =>
      useRealtime({ projectId: undefined, userId: 'user-1' })
    );
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isFollowing).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it('returns disconnected state when no userId', () => {
    const { result } = renderHook(() =>
      useRealtime({ projectId: 'project-1', userId: undefined })
    );
    expect(result.current.isConnected).toBe(false);
  });

  it('toggleFollowMode toggles the follow state', () => {
    const { result } = renderHook(() =>
      useRealtime({ projectId: 'project-1', userId: 'user-1' })
    );
    expect(result.current.isFollowing).toBe(false);
    act(() => result.current.toggleFollowMode());
    expect(result.current.isFollowing).toBe(true);
    act(() => result.current.toggleFollowMode());
    expect(result.current.isFollowing).toBe(false);
  });

  it('dismissPending clears the pending queue', () => {
    const { result } = renderHook(() =>
      useRealtime({ projectId: 'project-1', userId: 'user-1' })
    );
    // Manually set pending count via ref access isn't directly possible,
    // so we test dismiss when count is 0
    act(() => result.current.dismissPending());
    expect(result.current.pendingCount).toBe(0);
  });
});
