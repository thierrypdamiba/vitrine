/**
 * The vault routes read the demo mailbox through the server's own Arcade user. They exist for
 * the page that serves them, so only same-origin browser requests may call them, and callers
 * are throttled so judging traffic cannot exhaust Arcade quota.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

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
  const recent = (hits.get(key) ?? []).filter(at => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
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
