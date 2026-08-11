# Med.uz.ua 2.0

Static-first Astro application for the Med.uz.ua ophthalmology clinic and
optical shop. Ukrainian routes are unprefixed; Slovak, English, and Hungarian
routes use `/sk`, `/en`, and `/hu`.

## Local development

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm seed:products
pnpm validate:prices
pnpm typecheck
pnpm build
pnpm verify:stage6
```

Run `pnpm verify:stage6` after `pnpm build`. It validates the protected API
hash, official medical prices, generated product catalog, localized route and
SEO output, referenced image bytes and dimensions, appointment form contract,
and Cloudflare bundle/configuration invariants.

## Cloudflare deployment

The repository uses the established Cloudflare Workers Static Assets layout:

```text
Worker entry: ./dist/_worker.js/index.js
Assets:       ./dist
```

Build with `pnpm build`. `wrangler.jsonc` owns the deployment contract; do not
convert the project to Cloudflare Pages or replace the generated Worker entry.
The static pages are prerendered, while `POST /api/appointments` remains the
on-demand Astro server endpoint in the Worker bundle.

Astro 5 and `@astrojs/cloudflare` 12 are pinned to preserve this established
output. Styling uses Tailwind CSS 4 through its official Vite plugin, with
design tokens defined in `src/styles/global.css`.

The current lead dispatcher is an awaited, deterministic Telegram-style fetch
mock. Replace the implementation behind `src/lib/leads/dispatcher.ts` with the
selected production lead destination; the endpoint already maps downstream
failure to a controlled non-success response.
