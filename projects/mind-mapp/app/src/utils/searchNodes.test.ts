import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { searchNodes } from './searchNodes';

const nodes: Record<string, Node> = {
  n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: [] },
  n_alpha: { id: 'n_alpha', text: 'Alpha', x: 0, y: 0, parentId: 'n_root', children: [] },
  n_beta: { id: 'n_beta', text: 'Beta', x: 0, y: 0, parentId: 'n_root', children: [] },
  n_alpine: { id: 'n_alpine', text: 'Alpine', x: 0, y: 0, parentId: 'n_root', children: [] },
  node_x1: { id: 'node_x1', text: 'Gamma', x: 0, y: 0, parentId: 'n_root', children: [] },
};

describe('searchNodes', () => {
  it('returns empty array for blank query', () => {
    expect(searchNodes(nodes, '   ')).toEqual([]);
  });

  it('prioritizes label prefix matches over contains/id matches', () => {
    const results = searchNodes(nodes, 'al');
    expect(results.map(node => node.id)).toEqual(['n_alpha', 'n_alpine']);
  });

  it('can match by node id when label does not match', () => {
    const results = searchNodes(nodes, 'x1');
    expect(results.map(node => node.id)).toEqual(['node_x1']);
  });

  it('applies result limit after ranking', () => {
    const results = searchNodes(nodes, 'a', 2);
    expect(results).toHaveLength(2);
  });
});
