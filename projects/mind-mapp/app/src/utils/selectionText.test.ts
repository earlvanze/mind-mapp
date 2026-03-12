import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { formatSelectionText } from './selectionText';

describe('formatSelectionText', () => {
  const nodes: Record<string, Node> = {
    n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['a', 'b'] },
    a: { id: 'a', text: 'Alpha', x: 100, y: 200, parentId: 'n_root', children: [] },
    b: { id: 'b', text: 'Beta', x: 50, y: 100, parentId: 'n_root', children: [] },
    c: { id: 'c', text: '   ', x: 200, y: 300, parentId: 'n_root', children: [] },
  };

  it('orders selected nodes by y then x', () => {
    expect(formatSelectionText(nodes, ['a', 'b'])).toBe('Beta\nAlpha');
  });

  it('falls back to focused node when selection is empty', () => {
    expect(formatSelectionText(nodes, [], 'n_root')).toBe('Root');
  });

  it('uses placeholder for blank labels and ignores unknown ids', () => {
    expect(formatSelectionText(nodes, ['missing', 'c'])).toBe('(untitled)');
  });
});
