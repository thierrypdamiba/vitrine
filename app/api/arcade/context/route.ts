import {
  ArcadeAuthorizationRequired,
  ArcadeContextError,
  beginArcadeAuthorization,
  createArcadeTools,
  getArcadeConnection,
  loadPrivateContextFromArcade,
  readArcadeConfig,
} from '../../../../lib/arcade';
import { guardVaultRequest } from '../../../../lib/request-guard';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function authorizationResponse(url?: string): Response {
  return Response.json(
    {
      error: 'Authorize Gmail with Arcade, then try again.',
      authorizationUrl: url,
    },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request): Promise<Response> {
  const denied = guardVaultRequest(request);
  if (denied) return denied;

  const config = readArcadeConfig();
  if (!config) {
    return Response.json(
      { error: 'Arcade is not configured on this server.' },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const tools = createArcadeTools(config);
  try {
    const connection = await getArcadeConnection(tools, config.userId);
    if (!connection.connected) {
      const authorization = await beginArcadeAuthorization(tools, config.userId);
      if (authorization.status !== 'completed') {
        return authorizationResponse(authorization.url);
      }
    }

    const context = await loadPrivateContextFromArcade(tools, config);
    return Response.json({ context }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof ArcadeAuthorizationRequired) {
      return authorizationResponse(error.url);
    }
    if (error instanceof ArcadeContextError) {
      return Response.json({ error: error.message }, { status: 422, headers: NO_STORE_HEADERS });
    }
    return Response.json(
      { error: 'Arcade is unavailable right now.' },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
