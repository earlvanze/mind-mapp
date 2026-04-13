import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualization } from './useVirtualization';
import type { Node } from '../store/useMindMapStore';

vi.mock('../utils/virtualization', () => ({
  getVisibleNodes: vi.fn(),
  getHiddenNodeIds: vi.fn(),
}));

import { getVisibleNodes, getHiddenNodeIds } from '../utils/virtualization';

function makeNodes(count: number): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  for (let i = 0; i < count; i++) {
    const id = `node-${i}`;
    nodes[id] = { id, text: `Node ${i}`, x: i * 100, y: i * 50, parentId: i > 0 ? `node-${i - 1}` : null, children: [] };
    if (i > 0 && nodes[`node-${i - 1}`]) {
      nodes[`node-${i - 1}`].children = [...(nodes[`node-${i - 1}`].children || []), id];
    }
  }
  return nodes;
}

describe('useVirtualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty set for empty nodes', () => {
    const nodes: Record<string, Node> = {};
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set());
    const { result } = renderHook(() => useVirtualization(nodes, true, 100));
    expect(result.current.visibleNodeIds.size).toBe(0);
  });

  it('returns all non-hidden nodes when disabled', () => {
    const nodes = makeNodes(5);
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set());
    const { result } = renderHook(() => useVirtualization(nodes, false, 100));
    expect(result.current.visibleNodeIds.size).toBe(5);
    expect(result.current.shouldVirtualize).toBe(false);
  });

  it('excludes collapsed children even when disabled', () => {
    const nodes = makeNodes(3);
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set(['node-1', 'node-2']));
    const { result } = renderHook(() => useVirtualization(nodes, false, 100));
    expect(result.current.visibleNodeIds.size).toBe(1);
    expect(result.current.visibleNodeIds.has('node-0')).toBe(true);
  });

  it('uses viewport filtering when enabled and node count >= threshold', () => {
    const nodes = makeNodes(200);
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set(['node-50', 'node-51']));
    (getVisibleNodes as ReturnType<typeof vi.fn>).mockReturnValue({
      visibleNodes: Array.from({ length: 50 }, (_, i) => `node-${i}`),
      visibleEdges: [],
    });

    const { result } = renderHook(() => useVirtualization(nodes, true, 100));
    expect(getVisibleNodes).toHaveBeenCalled();
    expect(result.current.shouldVirtualize).toBe(true);
  });

  it('does not virtualize when node count is below threshold', () => {
    const nodes = makeNodes(50);
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set());
    const { result } = renderHook(() => useVirtualization(nodes, true, 100));
    expect(result.current.shouldVirtualize).toBe(false);
    expect(getVisibleNodes).not.toHaveBeenCalled();
  });

  it('handles single node', () => {
    const nodes: Record<string, Node> = {
      root: { id: 'root', text: 'Only node', x: 0, y: 0, parentId: null, children: [] },
    };
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set());
    const { result } = renderHook(() => useVirtualization(nodes, true, 100));
    expect(result.current.visibleNodeIds.size).toBe(1);
    expect(result.current.visibleNodeIds.has('root')).toBe(true);
  });

  it('passes correct multiplier (1.3) to getVisibleNodes', () => {
    const nodes = makeNodes(200);
    (getHiddenNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(new Set());
    (getVisibleNodes as ReturnType<typeof vi.fn>).mockReturnValue({ visibleNodes: [], visibleEdges: [] });
    renderHook(() => useVirtualization(nodes, true, 100));
    expect(getVisibleNodes).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      1.3,
      expect.anything()
    );
  });
});