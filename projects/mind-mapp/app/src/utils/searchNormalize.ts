const DIACRITIC_RE = /[\u0300-\u036f]/g;

export function shouldInsertSearchBoundary(previous: string, current: string): boolean {
  if (!previous || !current) return false;

  const prevIsLower = /[a-z]/.test(previous);
  const prevIsLetter = /[A-Za-z]/.test(previous);
  const prevIsDigit = /\d/.test(previous);
  const currentIsUpper = /[A-Z]/.test(current);
  const currentIsLetter = /[A-Za-z]/.test(current);
  const currentIsDigit = /\d/.test(current);

  return (
    (prevIsLower && currentIsUpper)
    || (prevIsLetter && currentIsDigit)
    || (prevIsDigit && currentIsLetter)
  );
}

export function foldSearchCharacter(char: string): string {
  return char
    .normalize('NFD')
    .replace(DIACRITIC_RE, '')
    .toLowerCase()
    .replace(/[-_./:]+/g, ' ');
}

export function normalizeSearchText(value: string): string {
  const pieces: string[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const current = value[i];
    const previous = i > 0 ? value[i - 1] : '';

    if (shouldInsertSearchBoundary(previous, current)) {
      pieces.push(' ');
    }

    pieces.push(foldSearchCharacter(current));
  }

  return pieces
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}
