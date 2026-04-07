import { useEffect, useRef, memo, useCallback } from 'react';
import { Node } from '../store/useMindMapStore';

type Props = {
  nodes: Record<string, Node>;
  viewport?: { x: number; y: number; scale: number };
  selectedEdgeId?: string;
  hoveredEdgeId?: string;
  onEdgeClick?: (fromId: string, toId: string) => void;
  onEdgeHover?: (fromId: string, toId: string | null) => void;
};

/**
 * Canvas-based edge renderer (better performance than SVG for >100 nodes)
 * Renders only edges on canvas while keeping HTML nodes for text editing.
 * Also handles edge click/hover hit detection.
 */
function CanvasEdges({ nodes, viewport = { x: 0, y: 0, scale: 1 }, selectedEdgeId, hoveredEdgeId, onEdgeClick, onEdgeHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const nodesRef = useRef(nodes);
  const selectedEdgeIdRef = useRef(selectedEdgeId);
  const hoveredEdgeIdRef = useRef(hoveredEdgeId);

  // Keep refs in sync
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { selectedEdgeIdRef.current = selectedEdgeId; }, [selectedEdgeId]);
  useEffect(() => { hoveredEdgeIdRef.current = hoveredEdgeId; }, [hoveredEdgeId]);

  // Hit test: find edge near point (in world coordinates)
  const hitTest = useCallback((worldX: number, worldY: number) => {
    const nodesSnapshot = nodesRef.current;
    const threshold = 10; // pixels in world space

    for (const node of Object.values(nodesSnapshot)) {
      for (const childId of node.children) {
        const child = nodesSnapshot[childId];
        if (!child) continue;

        const x1 = node.x + 80;
        const y1 = node.y + 16;
        const x2 = child.x;
        const y2 = child.y + 16;

        // Check if point is near bezier curve (simplified: distance to midpoint)
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dist = Math.sqrt((worldX - midX) ** 2 + (worldY - midY) ** 2);

        if (dist < threshold) {
          return { fromId: node.id, toId: childId };
        }
      }
    }
    return null;
  }, []);

  // Handle pointer events on canvas
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = (screenX - viewport.x) / viewport.scale;
    const worldY = (screenY - viewport.y) / viewport.scale;

    const hit = hitTest(worldX, worldY);
    if (hit && onEdgeClick) {
      onEdgeClick(hit.fromId, hit.toId);
    }
  }, [viewport, hitTest, onEdgeClick]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = (screenX - viewport.x) / viewport.scale;
    const worldY = (screenY - viewport.y) / viewport.scale;

    const hit = hitTest(worldX, worldY);
    if (onEdgeHover) {
      onEdgeHover(hit ? hit.fromId + ':' + hit.toId : null);
    }
  }, [viewport, hitTest, onEdgeHover]);

  const handlePointerLeave = useCallback(() => {
    if (onEdgeHover) onEdgeHover(null);
  }, [onEdgeHover]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      drawEdges(ctx, nodes, selectedEdgeId, hoveredEdgeId);

      ctx.restore();
    };

    render();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, viewport, selectedEdgeId, hoveredEdgeId]);

  return (
    <canvas
      ref={canvasRef}
      className="edges-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: hoveredEdgeId ? 'pointer' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}

// Draw all edges with selection/hover highlighting
function drawEdges(ctx: CanvasRenderingContext2D, nodes: Record<string, Node>, selectedEdgeId?: string, hoveredEdgeId?: string) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  Object.values(nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) return;

      const edgeKey = node.id + ':' + childId;
      const isSelected = selectedEdgeId === edgeKey;
      const isHovered = hoveredEdgeId === edgeKey;

      const x1 = node.x + 80;
      const y1 = node.y + 16;
      const x2 = child.x;
      const y2 = child.y + 16;

      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) * 0.5;
      const cp2y = y2;

      // Line style based on state
      ctx.lineWidth = isSelected ? 3.5 : isHovered ? 3 : 2;
      ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#9aa4b2';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(y2 - cp2y, x2 - cp2x);
      const arrowSize = isSelected || isHovered ? 10 : 8;

      ctx.save();
      ctx.translate(x2, y2);
      ctx.rotate(angle);

      ctx.fillStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#9aa4b2';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(-arrowSize, arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  });
}

// Memoize to prevent re-render when viewport changes (handled internally)
export default memo(CanvasEdges, (prev, next) => {
  const prevNodes = Object.values(prev.nodes);
  const nextNodes = Object.values(next.nodes);

  if (prevNodes.length !== nextNodes.length) return false;
  if (prev.selectedEdgeId !== next.selectedEdgeId) return false;
  if (prev.hoveredEdgeId !== next.hoveredEdgeId) return false;

  for (const node of nextNodes) {
    const prevNode = prev.nodes[node.id];
    if (!prevNode) return false;
    if (prevNode.x !== node.x || prevNode.y !== node.y) return false;
    if (prevNode.children.length !== node.children.length) return false;
    for (let i = 0; i < node.children.length; i++) {
      if (prevNode.children[i] !== node.children[i]) return false;
    }
  }

  return true;
});
