import type { Node } from '../store/useMindMapStore';

export function formatSelectionText(
  nodes: Record<string, Node>,
  selectedIds: string[],
  fallbackId?: string,
): string {
  const ids = selectedIds.filter((id, index, arr) => arr.indexOf(id) === index && !!nodes[id]);

  if (!ids.length && fallbackId && nodes[fallbackId]) {
    ids.push(fallbackId);
  }

  if (!ids.length) return '';

  return ids
    .map(id => nodes[id])
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
    .map(node => node.text.trim() || '(untitled)')
    .join('\n');
}
