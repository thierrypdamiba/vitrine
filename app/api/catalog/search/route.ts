import { searchLiveProducts } from '../../../../lib/shopping';
import { handleMerchantSearch } from '../../../../lib/vitrine';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await handleMerchantSearch(body, {
    searchLive: (merchantQuery, signal) => searchLiveProducts(merchantQuery, { signal }),
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
    },
    { status: result.status },
  );
}
