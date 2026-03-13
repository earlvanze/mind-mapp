export const DEFAULT_ALLOWED_HOSTS = [
  'cyber.earlco.in',
  'cyber.talpa-stargazer.ts.net',
] as const;

export function parseAllowedHosts(raw?: string): string[] {
  if (!raw) return [];

  const parts = raw
    .split(/[\s,]+/)
    .map(part => part.trim())
    .filter(Boolean);

  return [...new Set(parts)];
}

export function resolveAllowedHosts(raw?: string): string[] {
  const parsed = parseAllowedHosts(raw);
  if (parsed.length) return parsed;
  return [...DEFAULT_ALLOWED_HOSTS];
}
