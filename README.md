# Vitrine

A jacket shop you can talk to. The agent may know about Dad, Scotland, October, and a $250
budget. `search_products` only accepts `jacket`, `XL`, `waterproof`, `packable`, `navy`, and
`olive`. The sidebar shows that split.

You do not need a Shopify store. This page is the shop.

## Run it

Requires Node 22.13+.

```sh
npm install
npm run dev
```

Open the app. The catalog loads. Copy the agent prompt from the sidebar and paste it into
ChatGPT's in-app browser, or Chrome with `chrome://flags/#enable-webmcp-testing`.

```sh
npm test
npm run test:bdd
npm run build
```

## Test the WebMCP tools

Clients used: ChatGPT's in-app browser, and Chrome 149+ with
`chrome://flags/#enable-webmcp-testing` enabled. Without a WebMCP client the page still
works as a normal shop; the sidebar reports whether `navigator.modelContext` was found.

1. Open the live URL in a WebMCP-enabled browser. The catalog loads from a recorded sample.
2. Click **Copy agent prompt** in the sidebar and paste it into the agent.
3. The agent calls `search_products` with only `category`, `size`, `features`, `colors`.
4. Read the **merchant receipt** in the sidebar: it is built from the request the catalog
   adapter actually received. Dad, Scotland, October, and $250 are absent.
5. The agent calls `compare_products` and then `prepare_selection`. Confirm to open the listing.

Automated checks cover the same boundary without a browser:

```sh
npm test          # unit tests, including "no private field in any tool schema"
npm run test:bdd  # Gherkin scenarios in features/
```

## Hosting

The live URL must be public. ChatGPT Sites projects default to owner-only, which fails judging.
In the Sites project settings, set visibility so anyone with the link can open the app without
signing in as the owner.

## Connect Arcade

Arcade can search live Google Shopping or Walmart from the catalog adapter, and can feed Gmail
context to an agent outside this page. It is optional. The recorded sample still fills the shop.

Copy `.env.example` to `.env.local` and set `ARCADE_API_KEY` and `ARCADE_USER_ID`. See
[docs/ARCADE.md](docs/ARCADE.md).

## What this shop may receive

`category`, `size`, `features`, `colors`. Nothing else.
