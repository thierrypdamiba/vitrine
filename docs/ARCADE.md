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
not same-origin (`Sec-Fetch-Site: same-origin` or a matching `Origin`) with 403, and throttles
each client to 20 requests a minute with 429. They never trigger an authorization flow and never
return an authorization URL; when Gmail is not authorized the server logs a warning and the page
falls back to the fixture. Successful context and status responses are memoized for five minutes
per isolate, so judging traffic reads the mailbox at most every five minutes.

`/api/catalog/search` is not rate-limited (agents call it); a keyword cache is the quota guard.

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

- No product images. Neither Arcade SERP tool returns usable image URLs for these rows, and
  `Walmart.GetProductDetails` has none either, so the cards render swatches instead of pictures.
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
