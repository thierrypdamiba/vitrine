import {
  ArcadeAuthorizationRequired,
  ArcadeContextError,
  createArcadeTools,
  getArcadeConnection,
  getArcadeStatus,
  loadPrivateContextFromArcade,
  readArcadeConfig,
  type ArcadeConfig,
  type ArcadeTools,
} from './arcade.ts';
import type { ArcadeStatus } from './arcade-types.ts';
import { guardVaultRequest, memo } from './request-guard.ts';

/**
 * The two public Arcade routes. Both are same-origin gated, both memoize upstream calls for
 * five minutes (one demo mailbox, no per-visitor data), and neither ever returns a URL: an
 * unauthorized mailbox is a boolean here and a console.warn on the server, nothing more.
 */
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const MEMO_TTL_MS = 5 * 60 * 1000;

export type ArcadeRouteDeps = {
  readConfig: () => ArcadeConfig | null;
  createTools: (config: ArcadeConfig) => ArcadeTools;
};

const defaultDeps: ArcadeRouteDeps = {
  readConfig: () => readArcadeConfig(),
  createTools: createArcadeTools,
};

const NOT_AUTHORIZED = { error: 'Gmail is not authorized on this server.' };
const NOT_CONFIGURED: ArcadeStatus = {
  configured: false,
  gmailRead: false,
  calendar: false,
  shopping: false,
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function handleArcadeContext(
  request: Request,
  deps: ArcadeRouteDeps = defaultDeps,
): Promise<Response> {
  const denied = guardVaultRequest(request);
  if (denied) return denied;

  const config = deps.readConfig();
  if (!config) return json({ error: 'Arcade is not configured on this server.' }, 503);

  try {
    const context = await memo('arcade-context', MEMO_TTL_MS, async () => {
      const tools = deps.createTools(config);
      const connection = await getArcadeConnection(tools, config.userId);
      if (!connection.connected) throw new ArcadeAuthorizationRequired();
      return loadPrivateContextFromArcade(tools, config);
    });
    return json({ context });
  } catch (error) {
    if (error instanceof ArcadeAuthorizationRequired) {
      console.warn('Vitrine: Gmail not authorized for the configured Arcade user');
      return json(NOT_AUTHORIZED, 401);
    }
    if (error instanceof ArcadeContextError) return json({ error: error.message }, 422);
    return json({ error: 'Arcade is unavailable right now.' }, 502);
  }
}

export async function handleArcadeStatus(
  request: Request,
  deps: ArcadeRouteDeps = defaultDeps,
): Promise<Response> {
  const denied = guardVaultRequest(request);
  if (denied) return denied;

  const config = deps.readConfig();
  if (!config) return json(NOT_CONFIGURED);

  try {
    const status = await memo('arcade-status', MEMO_TTL_MS, () =>
      getArcadeStatus(deps.createTools(config), config.userId),
    );
    return json(status);
  } catch {
    return json({ ...NOT_CONFIGURED, configured: true }, 502);
  }
}
