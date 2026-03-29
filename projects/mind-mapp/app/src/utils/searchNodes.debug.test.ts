import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { searchNodes, tokenizeSearchQuery, hasWildcards } from './searchNodes';

const wild = {
  root: { id: 'root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n1'] },
  n1: { id: 'n1', text: 'Alpha', x: 0, y: 0, parentId: 'root', children: [] },
};

// Test wildcard matching directly
it('plain alpha search (control)', () => {
  const results = searchNodes(wild, 'alpha');
  expect(results.map(node => node.id)).toEqual(['n1']);
});

it('star prefix wildcard', () => {
  const results = searchNodes(wild, '*pha');
  console.log('*pha results:', results.map(n => n.id));
  expect(results.map(node => node.id)).toEqual(['n1']);
});

it('star suffix wildcard', () => {
  const results = searchNodes(wild, 'alp*');
  console.log('alp* results:', results.map(n => n.id));
  expect(results.map(node => node.id)).toEqual(['n1']);
});

it('double wildcard', () => {
  const results = searchNodes(wild, '*lph*');
  console.log('*lph* results:', results.map(n => n.id));
  expect(results.map(node => node.id)).toEqual(['n1']);
});
