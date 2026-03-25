import { useEffect, useRef, memo } from 'react';
import { Node as NodeType, useMindMapStore } from '../store/useMindMapStore';

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

  return (
    <div
      ref={ref}
      className={`node ${isFocused ? 'focused' : ''} ${isSelected ? 'selected' : ''}`}
      style={{ left: node.x, top: node.y, minWidth: 60 }}
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
      {node.text}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when other nodes change
export default memo(Node, (prev, next) => {
  // Re-render only if the node data or state flags change
  return (
    prev.node.id === next.node.id &&
    prev.node.text === next.node.text &&
    prev.node.x === next.node.x &&
    prev.node.y === next.node.y &&
    prev.node.parentId === next.node.parentId &&
    prev.node.children.length === next.node.children.length &&
    prev.isFocused === next.isFocused &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing
  );
});
