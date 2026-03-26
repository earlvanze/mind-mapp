import { Node } from '../store/useMindMapStore';

// ---------------------------------------------------------------------------
// Tree layout — compact horizontal tree
// Parent at (x, y)
// Children spread along X axis (same Y = same depth level)
// Grandchildren on next depth level (greater Y)
// ---------------------------------------------------------------------------

export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 36;
export const H_GAP = 80;        // horizontal gap between parent right and child left
export const V_GAP = 60;        // vertical gap between depth levels
export const MIN_SIBLING_GAP = 24;

interface LayoutNode {
  id: string;
  children: string[];
}

type LayoutState = Map<string, { x: number; y: number; width: number; height: number }>;

// Returns { left, right, width } of a subtree's bounding box
function subtreeBounds(nodeId: string, state: LayoutState, children: Record<string, LayoutNode>) {
  const r = state.get(nodeId)!;
  const ch = children[nodeId]?.children ?? [];
  if (ch.length === 0) {
    return { left: r.x, right: r.x + r.width, width: r.width };
  }
  let leftMost = Infinity, rightMost = -Infinity;
  for (const c of ch) {
    const b = subtreeBounds(c, state, children);
    leftMost = Math.min(leftMost, b.left);
    rightMost = Math.max(rightMost, b.right);
  }
  return { left: leftMost, right: rightMost, width: rightMost - leftMost };
}

function shiftTree(nodeId: string, offset: number, state: LayoutState, children: Record<string, LayoutNode>): void {
  const rec = state.get(nodeId);
  if (!rec) return;
  state.set(nodeId, { ...rec, x: rec.x + offset });
  for (const c of children[nodeId]?.children ?? []) {
    shiftTree(c, offset, state, children);
  }
}

// First walk: computes relative x positions (children spread along x axis)
function firstWalk(nodeId: string, state: LayoutState, children: Record<string, LayoutNode>): void {
  const ch = children[nodeId]?.children ?? [];

  if (ch.length === 0) {
    state.set(nodeId, { x: 0, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT });
    return;
  }

  for (const c of ch) firstWalk(c, state, children);

  // Collect bounds for each child
  const positions = ch.map(c => ({
    id: c,
    bounds: subtreeBounds(c, state, children),
  }));

  // Walk left-to-right, enforce MIN_SIBLING_GAP between subtrees
  let curRight = positions[0].bounds.right;
  for (let i = 1; i < positions.length; i++) {
    const { id, bounds } = positions[i];
    const neededGap = curRight + MIN_SIBLING_GAP - bounds.left;
    if (neededGap > 0) {
      shiftTree(id, neededGap, state, children);
    }
    curRight = subtreeBounds(id, state, children).right;
  }

  // Shift children so first child's left edge is H_GAP to the right of parent left edge
  const childrenLeft = subtreeBounds(ch[0], state, children).left;
  const groupOffset = NODE_WIDTH + H_GAP - childrenLeft;
  if (groupOffset !== 0) {
    shiftTree(ch[0], groupOffset, state, children);
  }

  // Centre parent above children
  const firstBounds = subtreeBounds(ch[0], state, children);
  state.set(nodeId, { x: firstBounds.left - NODE_WIDTH - H_GAP, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT });
}

// Second walk: assigns depth → y positions
function secondWalk(
  nodeId: string,
  depth: number,
  state: LayoutState,
  children: Record<string, LayoutNode>,
  results: Record<string, { x: number; y: number }>,
): void {
  const r = state.get(nodeId)!;
  // depth on Y axis (deeper = greater Y), sibling spread on X
  results[nodeId] = { x: r.x, y: depth * (NODE_HEIGHT + V_GAP) };
  for (const c of children[nodeId]?.children ?? []) {
    secondWalk(c, depth + 1, state, children, results);
  }
}

/** Compute new (x, y) positions using Reingold-Tilford tree layout.
 *  Produces a horizontal tree: depth on Y axis, sibling spread on X axis. */
export function computeTreeLayout(
  rootId: string,
  nodes: Record<string, Node>,
  _options: { horizontal?: boolean } = {},
): Record<string, { x: number; y: number }> {
  const children: Record<string, LayoutNode> = {};
  for (const [id, node] of Object.entries(nodes)) {
    children[id] = { id, children: [...node.children] };
  }

  if (!children[rootId]) return {};

  const state: LayoutState = new Map();
  firstWalk(rootId, state, children);

  const results: Record<string, { x: number; y: number }> = {};
  secondWalk(rootId, 0, state, children, results);

  return results;
}
