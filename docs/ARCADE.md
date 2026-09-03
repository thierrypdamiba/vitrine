# Arcade connection

Vitrine uses Arcade in two places. The vault can read a normal Gmail thread and an optional
Calendar event. The merchant adapter can search Google Shopping, then Walmart, using only the
public brief. The demo vault and recorded product sample still run without credentials.

## Server configuration

Create an Arcade API key and keep it on the server. Never expose it through a `NEXT_PUBLIC_`
variable or commit it.

```sh
cp .env.example .env.local
```

Set these values in `.env.local`:

- `ARCADE_API_KEY`: an Arcade project API key
- `ARCADE_USER_ID`: the Arcade user identifier that authorizes Gmail and Calendar
- `ARCADE_CONTEXT_QUERY`: optional Gmail query. Default matches recent jacket, trip, or gift mail

Google Shopping and Walmart need the Arcade project's `SERP_API_KEY` secret. They do not need
shopper OAuth. If that secret is missing, Vitrine labels the recorded sample instead of pretending
the results are live.

The same API key and user id must be configured as secrets in the hosted Sites environment. The
hosted URL must be public.

## Vault records

A plain-text thread is enough. This works:

```text
Hey, can you find a jacket for Dad? He's going to Scotland in October and it will rain the whole
time. Keep it under $250. He's XL. Waterproof and packable, navy or olive.
```

Labeled fields still parse if someone sends them. The merchant never receives the email.

Click **Run private shopping demo**. If Google authorization is missing, Vitrine shows Arcade's
HTTPS authorization link. Complete that flow and run the demo again.

## Privacy boundary

- Vault route: Gmail and Calendar. The browser vault may show the parsed facts. The merchant panel
  cannot.
- Merchant route: public brief only. It builds `XL waterproof packable navy olive jacket` and
  sends that shopping request. It does not import Gmail loaders.
- `search_products` arguments are `category`, `size`, `features`, and `colors`.

Official references:

- [Arcade Gmail tools](https://docs.arcade.dev/en/resources/integrations/productivity/gmail)
- [Arcade Google Calendar](https://docs.arcade.dev/en/resources/integrations/productivity/google-calendar)
- [Arcade Google Shopping](https://docs.arcade.dev/en/resources/integrations/search/google_shopping)
- [Arcade Walmart](https://docs.arcade.dev/toolkits/search/walmart)
- [Arcade authorized tool calling](https://docs.arcade.dev/en/build/tool-calling/custom-apps/auth-tool-calling)
- [Arcade API keys](https://docs.arcade.dev/en/get-started/setup/api-keys)
