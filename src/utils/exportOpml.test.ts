import { describe, it, expect } from 'vitest';
import { toOpml } from './exportOpml';
import type { Node } from '../store/useMindMapStore';

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'n1',
    text: 'Root',
    parentId: null,
    children: [],
    x: 0,
    y: 0,
    style: {},
    ...overrides,
  };
}

describe('toOpml', () => {
  it('returns valid OPML 2.0 header for empty nodes', () => {
    const xml = toOpml({});
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<opml version="2.0">');
    expect(xml).toContain('<head>');
    expect(xml).toContain('<body>');
    expect(xml).toContain('</body>');
    expect(xml).toContain('</opml>');
  });

  it('escapes XML special characters in text', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: "A & B <C> \"D\" 'E'", parentId: null, children: [] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).toContain('&gt;');
    expect(xml).toContain('&quot;');
    expect(xml).toContain('&apos;');
  });

  it('emits root node with children as nested outlines', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'Root', parentId: null, children: ['n2', 'n3'] }),
      n2: makeNode({ id: 'n2', text: 'Child A', parentId: 'n1', children: [] }),
      n3: makeNode({ id: 'n3', text: 'Child B', parentId: 'n1', children: [] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('text="Root"');
    expect(xml).toContain('text="Child A"');
    expect(xml).toContain('text="Child B"');
  });

  it('emits deep subtree recursively', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'Level 1', parentId: null, children: ['n2'] }),
      n2: makeNode({ id: 'n2', text: 'Level 2', parentId: 'n1', children: ['n3'] }),
      n3: makeNode({ id: 'n3', text: 'Level 3', parentId: 'n2', children: [] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('text="Level 1"');
    expect(xml).toContain('text="Level 2"');
    expect(xml).toContain('text="Level 3"');
    expect(xml).toMatch(/<outline[^>]*text="Level 2"[^>]*>[\s\S]*<outline[^>]*text="Level 3"[^>]*\/>/);
  });

  it('handles n_root as canonical root', () => {
    const nodes = {
      n_root: makeNode({ id: 'n_root', text: 'My Map', parentId: null, children: ['n1'] }),
      n1: makeNode({ id: 'n1', text: 'Topic', parentId: 'n_root', children: [] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('text="My Map"');
    expect(xml).toContain('text="Topic"');
  });

  it('renders orphan top-level nodes as separate outlines', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'Orphan A', parentId: null, children: [] }),
      n2: makeNode({ id: 'n2', text: 'Orphan B', parentId: null, children: [] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('text="Orphan A"');
    expect(xml).toContain('text="Orphan B"');
  });

  it('includes tags as _tags attribute', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'Node', parentId: null, children: [], tags: ['urgent', 'work'] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('_tags="urgent, work"');
  });

  it('includes comment as _note attribute', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'Node', parentId: null, children: [], comment: 'This is a note' }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('_note="This is a note"');
  });

  it('includes style attributes as custom attributes', () => {
    const nodes = {
      n1: makeNode({
        id: 'n1',
        text: 'Styled Node',
        parentId: null,
        children: [],
        style: {
          backgroundColor: '#ff0000',
          textColor: '#0000ff',
          shape: 'ellipse',
          bold: true,
          italic: true,
          fontSize: 'large',
          icon: '⭐',
        },
      }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('_backgroundColor="#ff0000"');
    expect(xml).toContain('_textColor="#0000ff"');
    expect(xml).toContain('_shape="ellipse"');
    expect(xml).toContain('_bold="true"');
    expect(xml).toContain('_italic="true"');
    expect(xml).toContain('_fontSize="large"');
    expect(xml).toContain('_icon="⭐"');
  });

  it('marks collapsed nodes with _collapsed="true"', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'Root', parentId: null, children: ['n2'] }),
      n2: makeNode({ id: 'n2', text: 'Child', parentId: 'n1', children: [], isCollapsed: true }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('_collapsed="true"');
  });

  it('omits default style values', () => {
    const nodes = {
      n1: makeNode({
        id: 'n1',
        text: 'Plain Node',
        parentId: null,
        children: [],
        style: { backgroundColor: 'transparent', fontSize: 'medium', shape: 'rounded' },
      }),
    };
    const xml = toOpml(nodes);
    expect(xml).not.toContain('_backgroundColor');
    expect(xml).not.toContain('_fontSize');
    expect(xml).not.toContain('_shape="rounded"');
  });

  it('guards against cycles safely', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: 'A', parentId: null, children: ['n2'] }),
      n2: makeNode({ id: 'n2', text: 'B', parentId: 'n1', children: ['n1'] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('text="A"');
    expect(xml).toContain('text="B"');
  });

  it('uses Untitled for whitespace-only text', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', text: '   ', parentId: null, children: [] }),
    };
    const xml = toOpml(nodes);
    expect(xml).toContain('text="Untitled"');
  });
});
