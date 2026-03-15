import type { Shortcut } from './shortcuts';

type ShortcutHaystackCacheEntry = {
  source: string;
  haystack: string;
};

const shortcutHaystackCache = new WeakMap<Shortcut, ShortcutHaystackCacheEntry>();

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

export function filterShortcuts(shortcuts: Shortcut[], query: string): Shortcut[] {
  const normalizedQuery = normalizeShortcutText(query);
  if (!normalizedQuery) return shortcuts;

  const terms = normalizedQuery.split(' ');

  return shortcuts.filter((shortcut) => {
    const haystack = getShortcutHaystack(shortcut);
    return terms.every(term => haystack.includes(term));
  });
}
