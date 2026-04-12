import { useEffect, useRef, useState, useCallback } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

interface NodeNotesProps {
  onClose: () => void;
}

export default function NodeNotes({ onClose }: NodeNotesProps) {
  const { focusId, nodes, editingId } = useMindMapStore();
  const focusedNode = nodes[focusId];

  // If no focus or node is being edited, don't show panel
  if (!focusedNode || editingId === focusId) return null;

  const existing = focusedNode.comment ?? '';
  const [value, setValue] = useState(existing);
  const setNodeComment = useMindMapStore((s) => s.setNodeComment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync value if the focused node changes
  useEffect(() => {
    setValue(focusedNode.comment ?? '');
  }, [focusedNode.id, focusedNode.comment]);

  // Auto-focus textarea when panel opens
  useEffect(() => {
    textareaRef.current?.focus();
    autoResize(textareaRef.current);
  }, []);

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    autoResize(e.target);
  };

  const handleBlur = useCallback(() => {
    const trimmed = value.trim();
    setNodeComment(focusedNode.id, trimmed || undefined);
  }, [value, focusedNode.id, setNodeComment]);

  // Ctrl/Cmd+Enter to save and close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleBlur();
      onClose();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleBlur();
      onClose();
    }
  };

  return (
    <div
      className="node-notes-panel"
      role="complementary"
      aria-label={`Notes for node: ${focusedNode.text || '(untitled)'}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        background: 'var(--color-surface, #ffffff)',
        borderTop: '1px solid var(--color-border, #e5e7eb)',
        padding: '12px 16px 16px',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxHeight: '40vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true">📝</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
            Notes
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)', fontStyle: 'italic' }}>
            — {focusedNode.text || '(untitled node)'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #9ca3af)' }}>
            ⌘↵ save • Esc close
          </span>
          <button
            type="button"
            onClick={() => {
              handleBlur();
              onClose();
            }}
            aria-label="Close notes panel"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: 'var(--color-text-secondary)',
              padding: '2px 6px',
              borderRadius: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Add notes, annotations, or context for this node…"
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '6px',
          border: '1px solid var(--color-border, #d1d5db)',
          backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
          color: 'var(--color-text)',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
          outline: 'none',
          minHeight: '60px',
          flex: 1,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-color, #3b82f6)';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.15)';
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border, #d1d5db)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        aria-label="Node notes"
      />
    </div>
  );
}
