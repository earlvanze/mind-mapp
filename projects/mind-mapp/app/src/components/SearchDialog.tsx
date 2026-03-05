import { useEffect, useMemo, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nodes, setFocus } = useMindMapStore();
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
    return Object.values(nodes).filter(n => n.text.toLowerCase().includes(q)).slice(0, 20);
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
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, results, selected, setFocus]);

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
              onClick={() => { setFocus(r.id); onClose(); }}
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
