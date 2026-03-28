import { describe, expect, it } from 'vitest';

describe('tags', () => {
  describe('Node with tags', () => {
    it('should allow tags as array of strings', () => {
      const node = {
        id: 'n1',
        text: 'Test',
        x: 0,
        y: 0,
        parentId: null,
        children: [],
        tags: ['urgent', 'work']
      };
      expect(node.tags).toEqual(['urgent', 'work']);
    });

    it('should allow undefined tags', () => {
      const node = {
        id: 'n1',
        text: 'Test',
        x: 0,
        y: 0,
        parentId: null,
        children: [],
      };
      expect(node.tags).toBeUndefined();
    });

    it('should allow empty tags array', () => {
      const node = {
        id: 'n1',
        text: 'Test',
        x: 0,
        y: 0,
        parentId: null,
        children: [],
        tags: []
      };
      expect(node.tags).toEqual([]);
    });
  });
});
