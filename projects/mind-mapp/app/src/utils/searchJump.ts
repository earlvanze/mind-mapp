export type SearchJumpModifiers = {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
};

export function shouldKeepSearchOpen(modifiers: SearchJumpModifiers): boolean {
  return !!(modifiers.metaKey || modifiers.ctrlKey || modifiers.shiftKey);
}
