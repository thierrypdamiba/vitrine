import { handleArcadeContext } from '../../../../lib/arcade-routes';

export function POST(request: Request): Promise<Response> {
  return handleArcadeContext(request);
}
