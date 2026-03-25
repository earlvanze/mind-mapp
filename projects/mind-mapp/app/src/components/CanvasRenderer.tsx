import { useEffect, useRef, memo, useCallback } from 'react';
import { Node, useMindMapStore } from '../store/useMindMapStore';

type Props = {
  nodes: Record<string, Node>;
  focusId: string;
  selectedIds: string[];
  editingId?: string;
  viewport?: { x: number; y: number; scale: number };
  onNodeClick: (id: string, metaKey: boolean, ctrlKey: boolean) => void;
  onNodeDoubleClick: (id: string) => void;
  onDragStart: (id: string, x: number, y: number) => void;
};

/**
 * Full canvas-based renderer for high-performance maps (>1000 nodes)
 * Renders both nodes and edges on canvas, with DOM overlay for text editing
 */
function CanvasRenderer({
  nodes,
  focusId,
  selectedIds,
  editingId,
  viewport = { x: 0, y: 0, scale: 1 },
  onNodeClick,
  onNodeDoubleClick,
  onDragStart,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const hitMapRef = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Apply viewport transform
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      // Draw edges first (behind nodes)
      drawEdges(ctx, nodes);

      // Draw nodes and build hit map
      hitMapRef.current.clear();
      drawNodes(ctx, nodes, focusId, selectedIds, editingId, hitMapRef.current);

      ctx.restore();
    };

    render();

    // Cancel any pending frame
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [nodes, viewport, focusId, selectedIds, editingId]);

  // Handle canvas interactions
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    // Find clicked node
    for (const [id, bounds] of hitMapRef.current.entries()) {
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        onNodeClick(id, e.metaKey, e.ctrlKey);
        return;
      }
    }
  }, [viewport, onNodeClick]);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    // Find clicked node
    for (const [id, bounds] of hitMapRef.current.entries()) {
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        onNodeDoubleClick(id);
        return;
      }
    }
  }, [viewport, onNodeDoubleClick]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey || editingId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    // Find node under mouse
    for (const [id, bounds] of hitMapRef.current.entries()) {
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        if (!e.metaKey && !e.ctrlKey) {
          onDragStart(id, e.clientX, e.clientY);
        }
        return;
      }
    }
  }, [viewport, editingId, onDragStart]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas-renderer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'default',
        }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseDown={handleCanvasMouseDown}
      />
      {/* Overlay for text editing */}
      {editingId && nodes[editingId] && (
        <div
          ref={overlayRef}
          className="node focused editing"
          contentEditable
          suppressContentEditableWarning
          style={{
            position: 'absolute',
            left: nodes[editingId].x * viewport.scale + viewport.x,
            top: nodes[editingId].y * viewport.scale + viewport.y,
            transform: `scale(${viewport.scale})`,
            transformOrigin: 'top left',
            minWidth: 60,
            zIndex: 1000,
          }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).blur();
            }
          }}
          onBlur={(e) => {
            const text = (e.currentTarget.textContent || '').trim();
            useMindMapStore.getState().setText(editingId, text || 'New');
          }}
        >
          {nodes[editingId].text}
        </div>
      )}
    </>
  );
}

// Draw all edges between parent and child nodes
function drawEdges(ctx: CanvasRenderingContext2D, nodes: Record<string, Node>) {
  const edgeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#9aa4b2';
  
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  Object.values(nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) return;

      // Measure node text to get accurate width
      const nodeWidth = Math.max(60, measureTextWidth(ctx, node.text) + 20);

      // Parent center-right (anchor point)
      const x1 = node.x + nodeWidth;
      const y1 = node.y + 16;

      // Child center-left (target point)
      const x2 = child.x;
      const y2 = child.y + 16;

      // Draw cubic bezier curve
      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) * 0.5;
      const cp2y = y2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();

      // Draw arrow at child end
      drawArrow(ctx, x2, y2, cp2x, cp2y, edgeColor);
    });
  });
}

// Draw arrow marker at end of edge
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fromX: number,
  fromY: number,
  color: string
) {
  const angle = Math.atan2(y - fromY, x - fromX);
  const arrowSize = 8;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Draw all nodes and populate hit map
function drawNodes(
  ctx: CanvasRenderingContext2D,
  nodes: Record<string, Node>,
  focusId: string,
  selectedIds: string[],
  editingId: string | undefined,
  hitMap: Map<string, { x: number; y: number; width: number; height: number }>
) {
  const nodeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#ffffff';
  const nodeBorder = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#ccc';
  const focusColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#4f46e5';
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() || '#111';
  const shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--color-shadow').trim() || 'rgba(0,0,0,0.06)';

  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';

  Object.values(nodes).forEach((node) => {
    // Skip editing node (rendered by overlay)
    if (editingId === node.id) return;

    const isFocused = focusId === node.id;
    const isSelected = selectedIds.includes(node.id);

    // Measure text width
    const textWidth = measureTextWidth(ctx, node.text);
    const width = Math.max(60, textWidth + 20);
    const height = 32;

    // Store hit bounds
    hitMap.set(node.id, { x: node.x, y: node.y, width, height });

    // Draw shadow
    ctx.fillStyle = shadowColor;
    ctx.fillRect(node.x + 1, node.y + 2, width, height);

    // Draw node background with rounded corners
    ctx.fillStyle = nodeColor;
    roundRect(ctx, node.x, node.y, width, height, 8);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = isFocused ? focusColor : (isSelected ? focusColor : nodeBorder);
    ctx.lineWidth = isFocused ? 2 : (isSelected ? 2 : 1);
    roundRect(ctx, node.x, node.y, width, height, 8);
    ctx.stroke();

    // Draw text
    ctx.fillStyle = textColor;
    ctx.fillText(node.text, node.x + 10, node.y + height / 2);
  });
}

// Draw rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Measure text width (cached for performance)
const textWidthCache = new Map<string, number>();
function measureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  const cached = textWidthCache.get(text);
  if (cached !== undefined) return cached;

  const width = ctx.measureText(text).width;
  textWidthCache.set(text, width);
  return width;
}

export default memo(CanvasRenderer);
