import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { Node as NodeType, useMindMapStore } from '../store/useMindMapStore';
import { resolveStyle } from '../utils/nodeStyles';
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
    setSelectedStyle,
    moveNode,
    moveNodes,
  } = useMindMapStore();
  const ref = useRef<HTMLDivElement>(null);
  const [editingBold, setEditingBold] = useState(false);
  const [editingItalic, setEditingItalic] = useState(false);

  // Sync editingBold/Italic with node style when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditingBold(node.style?.bold ?? false);
      setEditingItalic(node.style?.italic ?? false);
      ref.current?.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(ref.current as Node);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing, node.style]);

  const applyBold = useCallback(() => {
    const next = !editingBold;
    setEditingBold(next);
    setSelectedStyle({ bold: next });
  }, [editingBold, setSelectedStyle]);

  const applyItalic = useCallback(() => {
    const next = !editingItalic;
    setEditingItalic(next);
    setSelectedStyle({ italic: next });
  }, [editingItalic, setSelectedStyle]);

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

  // When editing, use live editingBold/Italic state for display
  const displayBold = isEditing ? editingBold : resolved.bold;
  const displayItalic = isEditing ? editingItalic : resolved.italic;

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
    fontWeight: displayBold ? 'bold' : undefined,
    fontStyle: displayItalic ? 'italic' : undefined,
  };

  const textStyle: React.CSSProperties = {
    transform: resolved.shape === 'diamond' ? 'rotate(-45deg)' : undefined,
  };

  return (
    <>
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            left: node.x,
            top: node.y - 34,
            zIndex: 1001,
            display: 'flex',
            gap: 2,
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${resolved.border}`,
            borderRadius: 4,
            padding: '2px 4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            title="Bold (Cmd+B)"
            onClick={applyBold}
            style={{
              background: editingBold ? resolved.bg : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 3,
              color: resolved.text,
            }}
          >
            B
          </button>
          <button
            title="Italic (Cmd+I)"
            onClick={applyItalic}
            style={{
              background: editingItalic ? resolved.bg : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontStyle: 'italic',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 3,
              color: resolved.text,
            }}
          >
            I
          </button>
        </div>
      )}
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
          // Rich text shortcuts during editing
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            applyBold();
            return;
          }
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            applyItalic();
            return;
          }
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
    </>
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
    (prev.node.style?.bold ?? false) === (next.node.style?.bold ?? false) &&
    (prev.node.style?.italic ?? false) === (next.node.style?.italic ?? false) &&
    prev.node.style?.backgroundColor === next.node.style?.backgroundColor &&
    prev.node.style?.textColor === next.node.style?.textColor &&
    prev.node.style?.borderColor === next.node.style?.borderColor &&
    prev.node.style?.borderWidth === next.node.style?.borderWidth &&
    prev.node.style?.shape === next.node.style?.shape &&
    prev.node.style?.icon === next.node.style?.icon &&
    prev.node.style?.fontSize === next.node.style?.fontSize
  );
});
