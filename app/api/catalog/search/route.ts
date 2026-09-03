import { searchLiveProducts } from '../../../../lib/shopping';
import { handleMerchantSearch, parsePublicBrief } from '../../../../lib/vitrine';

// Not rate-limited on purpose: agents call this route. The adapter cache is the quota guard.
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // The same validated brief that becomes the receipt also drives live row filtering;
  // an invalid body never reaches the adapter because handleMerchantSearch rejects it first.
  const parsed = parsePublicBrief(body);
  const brief = parsed.ok ? parsed.brief : undefined;

  const result = await handleMerchantSearch(body, {
    searchLive: (merchantQuery, signal) => searchLiveProducts(merchantQuery, { signal, brief }),
    signal: request.signal,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      receipt: result.receipt,
      merchantQuery: result.merchantQuery,
      merchant: result.merchant,
      items: result.items,
      ...(result.arcadeRequest ? { arcadeRequest: result.arcadeRequest } : {}),
      ...(result.cached !== undefined ? { cached: result.cached } : {}),
    },
    { status: result.status },
  );
}
