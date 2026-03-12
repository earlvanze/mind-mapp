import { useEffect, useMemo, useState } from 'react';
import { SHORTCUTS } from '../utils';

export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(
    () => SHORTCUTS.filter(s => `${s.key} ${s.desc}`.toLowerCase().includes(normalized)),
    [normalized],
  );

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="help-box" onClick={(e) => e.stopPropagation()}>
        <h3>Shortcuts</h3>
        <input
          className="help-filter"
          placeholder="Filter shortcuts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="help-meta">{filtered.length} / {SHORTCUTS.length} shown</div>
        {filtered.length ? (
          <ul>
            {filtered.map(s => (
              <li key={s.key}><b>{s.key}</b>: {s.desc}</li>
            ))}
          </ul>
        ) : (
          <div className="help-empty">No shortcuts match your filter.</div>
        )}
      </div>
    </div>
  );
}
