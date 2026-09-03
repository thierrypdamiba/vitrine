import { handleArcadeStatus } from '../../../../lib/arcade-routes';

export function GET(request: Request): Promise<Response> {
  return handleArcadeStatus(request);
}
