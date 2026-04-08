/**
 * OPML (Outline Processor Markup Language) export.
 * OPML is a widely-supported outline interchange format used by
 * RSS readers (Feedly, etc.), note-taking apps (Evernote, Notion),
 * and outliners (WorkFlowy, Dynalist, etc.).
 */

import type { Node } from '../store/useMindMapStore';

const ROOT_ID = 'n_root';

function sortIds(ids: string[], nodes: Record<string, Node>) {
  return [...ids].sort((a, b) => {
    const na = nodes[a];
    const nb = nodes[b];
    if (!na && !nb) return a.localeCompare(b);
    if (!na) return 1;
    if (!nb) return -1;
    if (na.y !== nb.y) return na.y - nb.y;
    if (na.x !== nb.x) return na.x - nb.x;
    return na.text.localeCompare(nb.text);
  });
}

/** Escape XML special characters */
function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Build attributes string for an outline element */
function outlineAttrs(node: Node, includeNotes = true): string {
  const text = node.text.trim() || 'Untitled';
  const parts = [`text="${xmlEscape(text)}"`];

  const bg = node.style?.backgroundColor;
  if (bg && bg !== 'transparent') parts.push(`_backgroundColor="${xmlEscape(bg)}"`);

  const tc = node.style?.textColor;
  if (tc) parts.push(`_textColor="${xmlEscape(tc)}"`);

  const bc = node.style?.borderColor;
  if (bc) parts.push(`_borderColor="${xmlEscape(bc)}"`);

  const shape = node.style?.shape;
  if (shape && shape !== 'rounded') parts.push(`_shape="${xmlEscape(shape)}"`);

  const icon = node.style?.icon;
  if (icon) parts.push(`_icon="${xmlEscape(icon)}"`);

  const fontSize = node.style?.fontSize;
  if (fontSize && fontSize !== 'medium') parts.push(`_fontSize="${xmlEscape(fontSize)}"`);

  const bold = node.style?.bold;
  if (bold) parts.push(`_bold="true"`);

  const italic = node.style?.italic;
  if (italic) parts.push(`_italic="true"`);

  if (node.isCollapsed) parts.push(`_collapsed="true"`);

  if (node.tags && node.tags.length > 0) {
    parts.push(`_tags="${xmlEscape(node.tags.join(', '))}"`);
  }

  if (includeNotes && node.comment) {
    parts.push(`_note="${xmlEscape(node.comment)}"`);
  }

  return parts.join(' ');
}

/** Recursively render a node and its subtree as OPML outline elements */
function renderNode(
  id: string,
  nodes: Record<string, Node>,
  visited: Set<string>,
  indent: number,
): string {
  const node = nodes[id];
  if (!node) return '';
  if (visited.has(id)) return '';
  visited.add(id);

  const attrs = outlineAttrs(node);
  const children = sortIds(
    node.children.filter((cid) => !!nodes[cid] && !visited.has(cid)),
    nodes,
  );

  const spaces = '  '.repeat(indent);

  if (children.length === 0) {
    return `${spaces}<outline ${attrs} />`;
  }

  const childLines = children.map((cid) =>
    renderNode(cid, nodes, visited, indent + 1),
  );
  return (
    `${spaces}<outline ${attrs}>\n` +
    childLines.join('\n') +
    `\n${spaces}</outline>`
  );
}

/**
 * Convert the given nodes record to OPML 2.0 XML string.
 */
export function toOpml(nodes: Record<string, Node>): string {
  const ids = Object.keys(nodes);

  if (ids.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Mind Mapp Export</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
  </body>
</opml>`;
  }

  const rootId =
    nodes[ROOT_ID] && nodes[ROOT_ID].parentId == null ? ROOT_ID
    : sortIds(ids.filter((id) => nodes[id].parentId == null), nodes)[0];

  const visited = new Set<string>();
  const outlines: string[] = [];

  if (rootId) {
    const root = nodes[rootId];
    const rootAttrs = outlineAttrs(root);
    const rootChildren = sortIds(
      root.children.filter((cid) => !!nodes[cid]),
      nodes,
    );

    if (rootChildren.length === 0) {
      outlines.push(`  <outline ${rootAttrs} />`);
    } else {
      const childLines = rootChildren.map((cid) =>
        renderNode(cid, nodes, visited, 3),
      );
      outlines.push(
        `  <outline ${rootAttrs}>\n${childLines.join('\n')}\n  </outline>`,
      );
    }
    visited.add(rootId);
  }

  const orphans = ids.filter(
    (id) => id !== rootId && !visited.has(id) && nodes[id].parentId == null,
  );
  for (const id of sortIds(orphans, nodes)) {
    visited.add(id);
    const node = nodes[id];
    const attrs = outlineAttrs(node);
    const children = sortIds(
      node.children.filter((cid) => !!nodes[cid]),
      nodes,
    );
    if (children.length === 0) {
      outlines.push(`  <outline ${attrs} />`);
    } else {
      const childLines = children.map((cid) =>
        renderNode(cid, nodes, visited, 2),
      );
      outlines.push(
        `  <outline ${attrs}>\n${childLines.join('\n')}\n  </outline>`,
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Mind Mapp Export</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines.join('\n')}
  </body>
</opml>`;
}

/** Trigger a browser download of the current map as an .opml file */
export function exportOpmlData(nodes: Record<string, Node>) {
  const xml = toOpml(nodes);
  const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmapp.opml';
  a.click();
  URL.revokeObjectURL(url);
}
