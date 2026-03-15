import type { Shortcut } from './shortcuts';

type ShortcutHaystackCacheEntry = {
  source: string;
  haystack: string;
};

const shortcutHaystackCache = new WeakMap<Shortcut, ShortcutHaystackCacheEntry>();

let lastShortcutQuery = '';
let lastShortcutQueryTerms: string[] = [];

function normalizeShortcutText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bforward\s+slash\b/g, 'slash')
    .replace(/\bquestion\s+mark\b/g, 'slash')
    .replace(/\bcmd\/ctrl\b/g, 'cmd ctrl')
    .replace(/\bctrl\/cmd\b/g, 'cmd ctrl')
    .replace(/\//g, ' slash ')
    .replace(/\+/g, ' plus ')
    .replace(/\?/g, ' question ')
    .replace(/</g, ' less ')
    .replace(/>/g, ' greater ')
    .replace(/,/g, ' comma ')
    .replace(/\./g, ' dot ')
    .replace(/\bcontrol\b/g, 'ctrl')
    .replace(/\bcommand\b/g, 'cmd')
    .replace(/\bescape\b/g, 'esc')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getShortcutHaystack(shortcut: Shortcut): string {
  const source = `${shortcut.key} ${shortcut.desc}`;
  const cached = shortcutHaystackCache.get(shortcut);
  if (cached && cached.source === source) {
    return cached.haystack;
  }

  const haystack = normalizeShortcutText(source);
  shortcutHaystackCache.set(shortcut, { source, haystack });
  return haystack;
}

export function tokenizeShortcutQuery(query: string): string[] {
  const normalizedQuery = normalizeShortcutText(query);
  if (normalizedQuery === lastShortcutQuery) {
    return lastShortcutQueryTerms;
  }

  if (!normalizedQuery) {
    lastShortcutQuery = normalizedQuery;
    lastShortcutQueryTerms = [];
    return lastShortcutQueryTerms;
  }

  const terms = normalizedQuery.split(' ');
  if (terms.length < 2) {
    lastShortcutQuery = normalizedQuery;
    lastShortcutQueryTerms = terms;
    return lastShortcutQueryTerms;
  }

  const deduped: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < terms.length; i += 1) {
    const term = terms[i];
    if (seen.has(term)) continue;
    seen.add(term);
    deduped.push(term);
  }

  lastShortcutQuery = normalizedQuery;
  lastShortcutQueryTerms = deduped;
  return lastShortcutQueryTerms;
}

function includesAllShortcutTerms(haystack: string, terms: string[]): boolean {
  for (let i = 0; i < terms.length; i += 1) {
    if (!haystack.includes(terms[i])) {
      return false;
    }
  }

  return true;
}

export function filterShortcuts(shortcuts: Shortcut[], query: string): Shortcut[] {
  const terms = tokenizeShortcutQuery(query);
  if (!terms.length) return shortcuts;

  return shortcuts.filter((shortcut) => {
    const haystack = getShortcutHaystack(shortcut);
    return includesAllShortcutTerms(haystack, terms);
  });
}
