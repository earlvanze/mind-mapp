import { useEffect, useMemo, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { centerPointInView } from '../utils';

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nodes, setFocus } = useMindMapStore();

  const centerOnNode = (id: string) => {
    const node = nodes[id];
    if (!node) return;

    const panZoom = (window as any).__mindmappPanZoom;
    const canvas = document.querySelector('.canvas') as HTMLElement | null;
    if (!panZoom?.getView || !panZoom?.setView || !canvas) return;

    const view = panZoom.getView();
    const rect = canvas.getBoundingClientRect();
    const centered = centerPointInView(
      { x: node.x + 30, y: node.y + 16 },
      { width: rect.width, height: rect.height },
      view.scale ?? 1,
    );
    panZoom.setView(centered);
  };
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.values(nodes)
      .filter(n => n.text.toLowerCase().includes(q))
      .slice(0, 20)
      .sort((a, b) => a.text.localeCompare(b.text));
  }, [nodes, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(results.length - 1, s + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(0, s - 1));
      }
      if (e.key === 'Enter') {
        const item = results[selected];
        if (item) {
          setFocus(item.id);
          centerOnNode(item.id);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, results, selected, setFocus, nodes]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Search nodes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-results">
          {results.map((r, i) => (
            <div
              key={r.id}
              className={`search-item ${i === selected ? 'active' : ''}`}
              onClick={() => {
                setFocus(r.id);
                centerOnNode(r.id);
                onClose();
              }}
            >
              {r.text || '(empty)'}
            </div>
          ))}
          {!results.length && query && <div className="search-empty">No results</div>}
        </div>
      </div>
    </div>
  );
}
