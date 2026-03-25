import { useEffect, useRef, memo } from 'react';
import { Node as NodeType, useMindMapStore } from '../store/useMindMapStore';
import { resolveStyle, FONT_SIZE_MAP } from '../utils/nodeStyles';
import { loadTheme } from '../utils/theme';

type Props = { 
  node: NodeType;
  isFocused: boolean;
  isSelected: boolean;
  isEditing: boolean;
};

function Node({ node, isFocused, isSelected, isEditing }: Props) {
  const {
    nodes,
    selectedIds,
    setFocus,
    toggleSelection,
    startEditing,
    setText,
    moveNode,
    moveNodes,
  } = useMindMapStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      ref.current?.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(ref.current as Node);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const onDragStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;

    const dragIds = selectedIds.includes(node.id) && selectedIds.length ? selectedIds : [node.id];
    if (!selectedIds.includes(node.id)) {
      setFocus(node.id);
    }

    const startPositions = Object.fromEntries(
      dragIds
        .map(id => {
          const target = nodes[id];
          return target ? [id, { x: target.x, y: target.y }] : null;
        })
        .filter(Boolean) as [string, { x: number; y: number }][]
    );

    let lastUpdates = startPositions;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      lastUpdates = Object.fromEntries(
        Object.entries(startPositions).map(([id, pos]) => [id, { x: pos.x + dx, y: pos.y + dy }])
      );

      if (dragIds.length === 1) {
        const single = dragIds[0];
        const p = lastUpdates[single];
        moveNode(single, p.x, p.y);
      } else {
        moveNodes(lastUpdates);
      }
    };

    const onUp = () => {
      if (dragIds.length === 1) {
        const single = dragIds[0];
        const p = lastUpdates[single];
        moveNode(single, p.x, p.y, true);
      } else {
        moveNodes(lastUpdates, true);
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const theme = loadTheme();
  const resolved = resolveStyle(node.style, theme);
  const focusColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#4f46e5';

  const nodeStyle: React.CSSProperties = {
    left: node.x,
    top: node.y,
    minWidth: 60,
    backgroundColor: resolved.bg,
    color: resolved.text,
    borderColor: isFocused ? focusColor : (isSelected ? focusColor : resolved.border),
    borderWidth: isFocused || isSelected ? 2 : resolved.borderWidth,
    fontSize: resolved.fontSize,
    borderRadius: resolved.shape === 'ellipse' ? '50%'
               : resolved.shape === 'rounded' ? '8px'
               : resolved.shape === 'diamond' ? '0'
               : '4px',
    borderStyle: 'solid',
    transform: resolved.shape === 'diamond' ? 'rotate(45deg)' : undefined,
    transformOrigin: 'center center',
    display: 'flex',
    alignItems: 'center',
    gap: resolved.icon ? '4px' : undefined,
  };

  const textStyle: React.CSSProperties = {
    transform: resolved.shape === 'diamond' ? 'rotate(-45deg)' : undefined,
  };

  return (
    <div
      ref={ref}
      className={`node ${isFocused ? 'focused' : ''} ${isSelected ? 'selected' : ''}`}
      style={nodeStyle}
      onMouseDown={(e) => {
        if (e.shiftKey) return;
        if (e.metaKey || e.ctrlKey) return;
        if (isEditing) return;
        onDragStart(e);
      }}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          toggleSelection(node.id);
          return;
        }
        setFocus(node.id);
      }}
      onDoubleClick={() => startEditing(node.id)}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e) => {
        const text = (e.currentTarget.textContent || '').trim();
        setText(node.id, text || 'New');
        (e.currentTarget as HTMLElement).contentEditable = 'false';
      }}
    >
      {resolved.icon ? <span style={{ fontSize: '1em', lineHeight: 1 }}>{resolved.icon}</span> : null}
      <span style={textStyle}>{node.text}</span>
    </div>
  );
}

export default memo(Node, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.node.text === next.node.text &&
    prev.node.x === next.node.x &&
    prev.node.y === next.node.y &&
    prev.node.parentId === next.node.parentId &&
    prev.node.children.length === next.node.children.length &&
    prev.isFocused === next.isFocused &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    prev.node.style === next.node.style
  );
});
