/**
 * The vault routes read the demo mailbox through the server's own Arcade user. They exist for
 * the page that serves them, so only same-origin browser requests may call them, and callers
 * are throttled so judging traffic cannot exhaust Arcade quota. Sixty a minute leaves room
 * for a judge reloading the page and re-running the demo without meeting a 429.
 */
const WINDOW_MS = 60_000;
export const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();

/**
 * Browsers send Sec-Fetch-Site, which settles it. The Origin fallback is for older clients;
 * a non-browser client can set a same-host Origin and pass. That is accepted on purpose: the
 * routes behind this check answer with the shared demo mailbox's parsed facts and four status
 * booleans, never a token, an authorization URL, or anything keyed to the caller, so the
 * check bounds accidental cross-site use and quota, not secrecy.
 */
export function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function isRateLimited(key: string, now = Date.now()): boolean {
  // Prune every idle key on each call so the map never grows with one-off callers.
  for (const [held, stamps] of hits) {
    const live = stamps.filter(at => now - at < WINDOW_MS);
    if (live.length === 0) hits.delete(held);
    else if (live.length !== stamps.length) hits.set(held, live);
  }
  const recent = hits.get(key) ?? [];
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** Keys currently tracked; exported for the pruning test. */
export function trackedClientKeys(): string[] {
  return [...hits.keys()];
}

export function clientKey(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  );
}

export function guardVaultRequest(request: Request): Response | null {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: 'Vault routes only serve this page.' }, { status: 403 });
  }
  if (isRateLimited(clientKey(request))) {
    return Response.json(
      { error: 'Too many vault requests. Try again in a minute.' },
      { status: 429 },
    );
  }
  return null;
}

/**
 * Per-isolate promise memo shared by the Arcade routes and the catalog cache. Workers
 * isolates each hold their own copy, so this bounds upstream calls per isolate, not globally.
 * Only fulfilled promises stay cached: a rejection evicts its entry so the next caller retries.
 */
const memos = new Map<string, { expires: number; promise: Promise<unknown> }>();

export function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const held = memos.get(key);
  if (held && held.expires > now) return held.promise as Promise<T>;

  const entry = { expires: now + ttlMs, promise: fn() };
  memos.set(key, entry);
  entry.promise.catch(() => {
    if (memos.get(key) === entry) memos.delete(key);
  });
  return entry.promise;
}

export function clearMemo(): void {
  memos.clear();
}
