import { createArcadeTools, getArcadeConnection, readArcadeConfig } from '../../../../lib/arcade';
import { guardVaultRequest } from '../../../../lib/request-guard';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET(request: Request): Promise<Response> {
  const denied = guardVaultRequest(request);
  if (denied) return denied;

  const config = readArcadeConfig();
  if (!config) {
    return Response.json(
      { configured: false, connected: false, tokenStatus: 'unknown' },
      { headers: NO_STORE_HEADERS },
    );
  }

  try {
    const connection = await getArcadeConnection(createArcadeTools(config), config.userId);
    return Response.json({ configured: true, ...connection }, { headers: NO_STORE_HEADERS });
  } catch {
    return Response.json(
      { configured: true, connected: false, tokenStatus: 'unknown' },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
