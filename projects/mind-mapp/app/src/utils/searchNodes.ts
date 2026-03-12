import type { Node } from '../store/useMindMapStore';

export function searchNodes(
  nodes: Record<string, Node>,
  query: string,
  limit = 20,
): Node[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = Object.values(nodes)
    .map((node) => {
      const label = node.text.toLowerCase();
      const id = node.id.toLowerCase();
      const startsWithLabel = label.startsWith(q);
      const includesLabel = label.includes(q);
      const includesId = id.includes(q);

      if (!includesLabel && !includesId) return null;

      const rank = startsWithLabel ? 0 : includesLabel ? 1 : 2;
      return { node, rank };
    })
    .filter(Boolean) as Array<{ node: Node; rank: number }>;

  return scored
    .sort((a, b) => a.rank - b.rank || a.node.text.localeCompare(b.node.text) || a.node.id.localeCompare(b.node.id))
    .slice(0, limit)
    .map(item => item.node);
}
