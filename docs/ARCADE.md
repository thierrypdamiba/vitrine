# Arcade connection

This is the exact map of every Arcade call Vitrine makes. Arcade runs only on the server. The API
key never reaches the browser. The judging path needs no credentials: without Arcade the vault
loads a labeled demo fixture and the shop searches a labeled recorded sample.

## Routes

| Route                 | Method | Arcade tools                                                  | Response                                                                                                           |
| --------------------- | ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/api/arcade/status`  | GET    | `tools.get` for the three tools below (no execution)          | `{ configured, gmailRead, calendar, shopping }`, booleans only. No token status text, no URLs.                     |
| `/api/arcade/context` | POST   | `Gmail.SearchEmailsByQuery`, then `GoogleCalendar.ListEvents` | `200 { context }`; `401 { error: 'Gmail is not authorized on this server.' }`; `503` not configured; `422`; `502`. |
| `/api/catalog/search` | POST   | `Walmart.SearchProducts` / `GoogleShopping.SearchProducts`    | `{ receipt, merchantQuery, merchant, items, arcadeRequest?, cached? }` or `400 { error }` for any extra key.       |

The two `/api/arcade/*` routes serve only the page: `guardVaultRequest` rejects requests that are
not same-origin with 403 and throttles each client to 60 requests a minute with 429. Browsers send
`Sec-Fetch-Site`, which settles it, so a cross-site page cannot call these routes; the `Origin`
fallback is for clients without that header, and a script that sets a same-host `Origin` passes on
purpose. That is acceptable because the routes answer with the shared demo mailbox's parsed facts
and four status booleans, never a token, an authorization URL, or anything keyed to the caller:
the gate bounds accidental cross-site use and quota, not secrecy. They never trigger an
authorization flow and never return an authorization URL; when Gmail is not authorized the server
logs a warning and the page falls back to the fixture. Successful context and status responses are
memoized for five minutes per isolate, so judging traffic reads the mailbox at most every five
minutes.

`/api/catalog/search` is not rate-limited (agents call it); a keyword cache is the quota guard.
`parsePublicBrief` also caps the enum arrays: `features` or `colors` longer than the allowed set
(two values each) is rejected with 400 before the array is walked, so a 5,000-entry payload never
reaches the adapter, and a short list that repeats a value collapses to one entry in the receipt.
The schema says the same with `maxItems: 2` and `uniqueItems: true`.

The page also calls this route once on its own, without any shopper request: when
`/api/arcade/status` reports `shopping: true`, it sends `STOREFRONT_DEFAULT_BRIEF` (size M,
waterproof + packable, navy | olive; `lib/session.ts`) so the grid shows live inventory before the
agent does anything. That result never becomes the receipt or moves the seam; the sidebar prints it
as "Storefront default, not a shopper request". Until the status route answers, the grid holds
the labeled recorded sample.

Walmart rows carry no image field. For each Walmart result the server reads the product page's
`og:image` tag (`lib/product-images.ts`: walmart.com links only, 4 s timeout, at most 600 KB, only
`walmartimages.com` hosts accepted) once per product before the result enters the six-hour cache,
so every cache hit ships the same photos. A photo that cannot be read leaves the card on its
swatch; on a hosted worker Walmart may block datacenter addresses, in which case every card shows
the swatch. Google Shopping rows link to Google Shopping search pages and are never fetched. The
only input to that read is the merchant's own link. Measured on 2026-09-03 against the dev server:
the XL brief resolved to Walmart with 5 rows, 5 photos, 5 walmart.com links; the size-M storefront
default resolved to Google Shopping (Walmart returned fewer than three clean M rows), 8 swatch
cards.

## Exact Arcade inputs

`Gmail.SearchEmailsByQuery` (`lib/arcade.ts`):

```json
{ "query": "<ARCADE_CONTEXT_QUERY>", "result_detail": "full", "max_results": 5 }
```

`GoogleCalendar.ListEvents` (optional; a failure or missing authorization yields no Calendar row):

```json
{ "calendar_id": "primary", "min_end_datetime": "<now>", "max_start_datetime": "<now + 180 days>" }
```

`Walmart.SearchProducts` and `GoogleShopping.SearchProducts` (`lib/shopping.ts`):

```json
{ "keywords": "XL waterproof packable navy olive jacket" }
```

`keywords` is the only input key. It is built by `merchantQueryFromBrief` from the validated enum
values of the accepted public brief and nothing else; the sidebar prints this object verbatim as
"Exact Arcade call". `Walmart.SearchProducts` also accepts `sort_by`, `min_price`, `max_price`,
`next_day_delivery`, and `page` (verified via Arcade `tools.get` on 2026-09-03; see
`WALMART_ACCEPTS` in `lib/vitrine.ts`). Vitrine never fills `max_price`: the budget ranks results
on the shopper's side after they return.

Adapter order: Walmart first, Google Shopping fallback, decided by one real query on 2026-09-03
(20 rows, 6 clean; see "Hosted status" in `docs/SUBMISSION.md`). Live rows are filtered for women's, kids', and plus-size titles and rows
that match none of the brief; if fewer than three remain the route returns the recorded sample and
labels it. Live and sample rows are never mixed.

## Limitations

- Neither Arcade SERP tool returns an image URL for these rows, and `Walmart.GetProductDetails`
  has none either. Walmart cards get their photo from the product page's `og:image` as described
  above; Google Shopping cards render swatches.
- `GoogleShopping.SearchProducts` has no price parameter at all.
- Both shopping tools need the Arcade project secret `SERP_API_KEY`; they do not need shopper
  OAuth. If the secret is missing, `shopping` is false in the status and the shop labels the
  recorded sample.

## Single-mailbox disclosure

The hosted demo reads one demo Google account owned by the author, identified by
`ARCADE_USER_ID`. There is no per-visitor Gmail access and no visitor OAuth; the vault everyone sees
is the same demo mailbox, which contains one message matching `ARCADE_CONTEXT_QUERY`. The
credential-free fallback, `DAD_SCOTLAND_FIXTURE`, is embedded in the client bundle and labeled
"Demo fixture. Arcade is not connected on this host." when it is used.

## Vault record

A plain-text message is enough. This parses:

```text
Hey, can you find a jacket for Dad? He's going to Scotland in October and it will rain the whole
time. Keep it under $250. He's XL. Waterproof and packable, navy or olive.
```

Labeled fields (`Recipient: Dad`, `Size: XL`, ...) also parse. Values are bounded to 80 characters,
size/features/colors must be catalog enums, and the budget must be an integer from 1 to 10000.
The merchant never receives the message; `lib/shopping.ts` cannot import the Gmail loaders, and a
source-scan test enforces that.

## Server configuration

```sh
cp .env.example .env.local
```

| Key                    | Meaning                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `ARCADE_API_KEY`       | Arcade project API key. Server only; never `NEXT_PUBLIC_`, never committed.               |
| `ARCADE_USER_ID`       | The Arcade user id whose Gmail (and optionally Calendar) is authorized: the demo account. |
| `ARCADE_CONTEXT_QUERY` | Gmail search query for the vault message. Optional; the default matches recent gift mail. |

The same three values go in the hosted Site's settings. Google authorization is an owner-only step
done outside the app through the Arcade dashboard; the public routes never start it.

Official references:

- [Arcade Gmail tools](https://docs.arcade.dev/en/resources/integrations/productivity/gmail)
- [Arcade Google Calendar](https://docs.arcade.dev/en/resources/integrations/productivity/google-calendar)
- [Arcade Google Shopping](https://docs.arcade.dev/en/resources/integrations/search/google_shopping)
- [Arcade Walmart](https://docs.arcade.dev/toolkits/search/walmart)
- [Arcade authorized tool calling](https://docs.arcade.dev/en/build/tool-calling/custom-apps/auth-tool-calling)
- [Arcade API keys](https://docs.arcade.dev/en/get-started/setup/api-keys)
