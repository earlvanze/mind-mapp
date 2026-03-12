import type { Node } from '../store/useMindMapStore';

type SearchToken = {
  value: string;
  negated: boolean;
};

function tokenizeSearchQuery(query: string): SearchToken[] {
  const tokens: SearchToken[] = [];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tokens;

  const pattern = /(-?)"([^"]+)"|(-?)(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    const prefix = match[1] || match[3] || '';
    const raw = (match[2] || match[4] || '').trim();
    if (!raw) continue;

    tokens.push({
      value: raw,
      negated: prefix === '-',
    });
  }

  return tokens;
}

function nodePathLabels(nodes: Record<string, Node>, startId: string): string {
  const labels: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null | undefined = startId;

  while (currentId && !visited.has(currentId) && nodes[currentId]) {
    visited.add(currentId);
    const node = nodes[currentId];
    labels.push(node.text.toLowerCase());
    currentId = node.parentId;
  }

  return labels.reverse().join(' ');
}

function rankSearchMatches(
  nodes: Record<string, Node>,
  query: string,
): Array<{ node: Node; rank: number }> {
  const tokens = tokenizeSearchQuery(query);
  if (!tokens.length) return [];

  const positiveTerms = tokens.filter(token => !token.negated).map(token => token.value);
  const negativeTerms = tokens.filter(token => token.negated).map(token => token.value);
  const phrase = positiveTerms.join(' ');

  const scored = Object.values(nodes)
    .map((node) => {
      const label = node.text.toLowerCase();
      const id = node.id.toLowerCase();
      const path = nodePathLabels(nodes, node.id);
      const searchable = `${label} ${id} ${path}`;

      if (positiveTerms.length && !positiveTerms.every(term => searchable.includes(term))) {
        return null;
      }

      if (negativeTerms.some(term => searchable.includes(term))) {
        return null;
      }

      const rank =
        positiveTerms.length === 0 ? 4
          : phrase && label.startsWith(phrase) ? 0
            : positiveTerms.every(term => label.includes(term)) ? 1
              : positiveTerms.every(term => id.includes(term)) ? 2
                : positiveTerms.every(term => path.includes(term)) ? 3
                  : 4;

      return { node, rank };
    })
    .filter(Boolean) as Array<{ node: Node; rank: number }>;

  return scored.sort((a, b) => a.rank - b.rank || a.node.text.localeCompare(b.node.text) || a.node.id.localeCompare(b.node.id));
}

export function searchNodesWithTotal(
  nodes: Record<string, Node>,
  query: string,
  limit = 20,
): { results: Node[]; total: number } {
  const scored = rankSearchMatches(nodes, query);
  return {
    results: scored.slice(0, limit).map(item => item.node),
    total: scored.length,
  };
}

export function searchNodes(
  nodes: Record<string, Node>,
  query: string,
  limit = 20,
): Node[] {
  return searchNodesWithTotal(nodes, query, limit).results;
}
