export function safeNextPath(next: string | null, fallback: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}

export function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
