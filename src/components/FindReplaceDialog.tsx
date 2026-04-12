import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import {
  DEFAULT_SEARCH_RESULT_LIMIT,
  SEARCH_DIALOG_ARIA_KEYSHORTCUTS,
  SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS,
  SEARCH_INPUT_ARIA_KEYSHORTCUTS,
  canNavigateSearchSelection,
  centerPointInView,
  clampSearchSelection,
  computeHighlightRanges,
  createFocusPathResolver,
  formatSearchSummary,
  getSearchEmptyMessage,
  isDialogClearInputEvent,
  isDialogFocusInputEvent,
  isDialogSelectInputEvent,
  isSearchSelectionNavigationKey,
  isSearchToggleEvent,
  navigateSearchSelectionByKey,
  searchNodesWithTotal,
  shouldDisplaySearchEmptyState,
  shouldKeepSearchOpen,
  shouldSkipDialogSelectShortcut,
  tokenizeSearchQuery,
} from '../utils';

export default function FindReplaceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { nodes, findAndReplace, setText, setFocus } = useMindMapStore();

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

  const jumpToNode = (id: string, closeAfter = true) => {
    setFocus(id);
    centerOnNode(id);
    if (closeAfter) onClose();
  };

  const [find, setFind] = useState('');
  const deferredFind = useDeferredValue(find);
  const [replace, setReplace] = useState('');
  const [selected, setSelected] = useState(0);
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replacedCount, setReplacedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dialogTitleId = useId();
  const summaryId = useId();
  const listboxId = useId();
  const hintId = useId();

  const searchTokens = useMemo(() => {
    if (!deferredFind) return [];
    if (useRegex) {
      try {
        const flags = (caseSensitive ? '' : 'i') + 'g';
        return [{ value: deferredFind, negated: false, regex: new RegExp(deferredFind, flags) }];
      } catch {
        return [];
      }
    }
    return tokenizeSearchQuery(deferredFind);
  }, [deferredFind, useRegex, caseSensitive]);

  const isSearchPending = find !== deferredFind;

  const highlight = (text: string, terms: string[]): string => {
    if (!terms.length) return text;
    const source = text || '(empty)';
    const ranges = computeHighlightRanges(source, terms);
    if (!ranges.length) return source;
    let result = '';
    let cursor = 0;
    ranges.forEach((range) => {
      if (range.start > cursor) result += source.slice(cursor, range.start);
      result += `<mark>${source.slice(range.start, range.end)}</mark>`;
      cursor = range.end;
    });
    if (cursor < source.length) result += source.slice(cursor);
    return result;
  };

  useEffect(() => {
    if (open) {
      setFind('');
      setReplace('');
      setSelected(0);
      setReplacedCount(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const resolveFocusPath = useMemo(() => createFocusPathResolver(nodes), [nodes]);

  const { results, totalMatches } = useMemo(() => {
    if (!searchTokens.length) return { results: [], totalMatches: 0 };
    const { results: res, total } = searchNodesWithTotal(nodes, searchTokens, DEFAULT_SEARCH_RESULT_LIMIT);
    return {
      totalMatches: total,
      results: res.map((node) => ({ node, path: resolveFocusPath(node.id) })),
    };
  }, [nodes, resolveFocusPath, searchTokens]);

  const selectedNodeId = results[selected]?.node.id;
  const canNavigateSelection = canNavigateSearchSelection(isSearchPending);
  const activeDescendantId =
    canNavigateSelection && selectedNodeId ? `${listboxId}-${selectedNodeId}` : undefined;
  const summaryText = formatSearchSummary(results.length, totalMatches, isSearchPending);
  const emptyMessage = getSearchEmptyMessage(results.length, totalMatches, isSearchPending);
  const shouldShowEmptyState = shouldDisplaySearchEmptyState(find, searchTokens.length > 0);

  useEffect(() => {
    setSelected((index) => clampSearchSelection(index, results.length));
    const validIds = new Set(results.map((r) => r.node.id));
    Object.keys(resultRefs.current).forEach((id) => {
      if (!validIds.has(id)) delete resultRefs.current[id];
    });
  }, [results]);

  useEffect(() => {
    if (!open || !selectedNodeId) return;
    resultRefs.current[selectedNodeId]?.scrollIntoView({ block: 'nearest' });
  }, [open, selectedNodeId, results.length]);

  const buildRegex = (): RegExp | null => {
    if (!find.trim()) return null;
    if (useRegex) {
      try {
        const flags = (caseSensitive ? '' : 'i') + 'g';
        return new RegExp(find, flags);
      } catch {
        return null;
      }
    }
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, (caseSensitive ? '' : 'i') + 'g');
  };

  const handleReplaceAll = () => {
    const regex = buildRegex();
    if (!regex) return;
    const initialCount = replacedCount;
    findAndReplace(find, replace, undefined);
    // Count how many actually changed by re-running the match
    let count = 0;
    for (const node of Object.values(nodes)) {
      if (typeof node.text === 'string') {
        const matches = node.text.match(regex);
        if (matches) count += matches.length;
      }
    }
    setReplacedCount(initialCount + count);
  };

  const handleReplaceSelectedNode = (nodeId: string) => {
    const regex = buildRegex();
    if (!regex) return;
    const node = nodes[nodeId];
    if (!node) return;
    const newText = node.text.replace(regex, replace);
    if (newText !== node.text) {
      setText(nodeId, newText);
      setReplacedCount((c) => c + 1);
    }
  };

  const canReplace = find.trim().length > 0 && results.length > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (find.trim() || replace.trim()) {
          e.preventDefault();
          setFind('');
          setReplace('');
          setSelected(0);
          inputRef.current?.focus();
          return;
        }
        onClose();
        return;
      }
      if (isSearchToggleEvent(e)) {
        e.preventDefault();
        onClose();
        return;
      }
      if (isDialogClearInputEvent(e)) {
        e.preventDefault();
        setFind('');
        setSelected(0);
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (isDialogFocusInputEvent(e)) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (isDialogSelectInputEvent(e)) {
        if (shouldSkipDialogSelectShortcut(e)) return;
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (results.length && isSearchSelectionNavigationKey(e.key)) {
        e.preventDefault();
        if (!canNavigateSelection) return;
        setSelected((current) => navigateSearchSelectionByKey(current, results.length, e.key, e.shiftKey) ?? current);
        return;
      }
      // Cmd/Ctrl+Enter: replace all
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canReplace) {
        e.preventDefault();
        handleReplaceAll();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canNavigateSelection, canReplace, find, onClose, open, replace, results, selected]);

  if (!open) return null;

  const terms = searchTokens.filter((t) => !t.negated).map((t) => t.value);

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        id="mindmapp-find-replace-dialog"
        className="search-box find-replace-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={`${summaryId} ${hintId}`}
        aria-keyshortcuts={SEARCH_DIALOG_ARIA_KEYSHORTCUTS}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id={dialogTitleId} className="search-title">Find &amp; Replace</h3>
          <button
            type="button"
            className="dialog-close-btn"
            title="Close"
            aria-label="Close find & replace dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="find-replace-inputs">
          <div className="find-input-row">
            <input
              ref={inputRef}
              autoFocus
              role="combobox"
              aria-label="Find text"
              aria-controls={listboxId}
              aria-describedby={`${summaryId} ${hintId}`}
              placeholder="Find…"
              value={find}
              onChange={(e) => {
                setFind(e.target.value);
                setSelected(0);
                setReplacedCount(0);
              }}
            />
            <button
              type="button"
              className={`regex-toggle ${useRegex ? 'active' : ''}`}
              title="Use regular expression"
              aria-pressed={useRegex}
              onClick={() => {
                setUseRegex((v) => !v);
                setSelected(0);
                setReplacedCount(0);
              }}
            >
              .*
            </button>
            <button
              type="button"
              className={`case-toggle ${caseSensitive ? 'active' : ''}`}
              title="Match case"
              aria-pressed={caseSensitive}
              onClick={() => {
                setCaseSensitive((v) => !v);
                setSelected(0);
                setReplacedCount(0);
              }}
            >
              Aa
            </button>
          </div>
          <div className="replace-input-row">
            <input
              aria-label="Replace with"
              placeholder="Replace with…"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
            />
            <button
              type="button"
              className="replace-btn"
              disabled={!canReplace}
              title="Replace all matches (Cmd/Ctrl+Enter)"
              onClick={handleReplaceAll}
            >
              Replace all
            </button>
          </div>
        </div>

        <div id={summaryId} className="search-summary" aria-live="polite">
          {replacedCount > 0
            ? `Replaced ${replacedCount} occurrence${replacedCount !== 1 ? 's' : ''}`
            : summaryText}
        </div>

        <div
          id={listboxId}
          className={`search-results ${isSearchPending ? 'is-pending' : ''}`}
          role="listbox"
          aria-busy={isSearchPending}
          aria-disabled={!canNavigateSelection}
        >
          {results.map((r, i) => {
            const title = r.node.text || '(empty)';
            const meta = `${r.node.id} • ${r.path || '(no path)'}`;
            return (
              <div
                key={r.node.id}
                id={`${listboxId}-${r.node.id}`}
                role="option"
                aria-selected={canNavigateSelection && i === selected}
                aria-posinset={i + 1}
                aria-setsize={results.length}
                ref={(el) => {
                  resultRefs.current[r.node.id] = el;
                }}
                className={`search-item ${canNavigateSelection && i === selected ? 'active' : ''}`}
                onMouseEnter={() => {
                  if (canNavigateSelection) setSelected(i);
                }}
                onClick={(e) => {
                  const closeAfter = !shouldKeepSearchOpen(e);
                  jumpToNode(r.node.id, closeAfter);
                }}
                onDoubleClick={() => handleReplaceSelectedNode(r.node.id)}
              >
                <div
                  className="search-item-title"
                  dangerouslySetInnerHTML={{ __html: highlight(title, terms) }}
                />
                <div className="search-item-meta" title={meta}>
                  {highlight(meta, terms)}
                </div>
              </div>
            );
          })}
          {!results.length && shouldShowEmptyState && (
            <div className="search-empty" role="status">
              {emptyMessage ?? 'No results'}
            </div>
          )}
          <div id={hintId} className="search-hint">
            Tab/Shift+Tab: cycle selection • Enter: jump to result • Double-click result: replace in that node
            • Cmd/Ctrl+Enter: replace all
          </div>
        </div>
      </div>
    </div>
  );
}
