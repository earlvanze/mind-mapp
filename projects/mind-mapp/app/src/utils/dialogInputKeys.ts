export type DialogInputKeyState = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
};

function normalizedKey(value: string): string {
  return value.toLowerCase();
}

function isInputTarget(target: EventTarget | null | undefined): boolean {
  const tagName = (target as { tagName?: string } | null)?.tagName;
  return typeof tagName === 'string' && tagName.toLowerCase() === 'input';
}

export function isDialogFocusInputEvent(event: DialogInputKeyState): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && normalizedKey(event.key) === 'f';
}

export function isDialogSelectInputEvent(event: DialogInputKeyState): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && normalizedKey(event.key) === 'a';
}

export function isDialogClearInputEvent(event: DialogInputKeyState): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !!event.shiftKey && normalizedKey(event.key) === 'k';
}

export function shouldSkipDialogSelectShortcut(event: DialogInputKeyState): boolean {
  return isInputTarget(event.target);
}
