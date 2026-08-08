# Med.uz.ua 2.0

Stage 1 walking skeleton for the static-first Astro rebuild described in
`ARCHITECTURE.md`.

## Local development

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm typecheck
pnpm build
```

The homepage is prerendered. `POST /api/appointments` is the only application
route rendered on demand and is emitted by `@astrojs/cloudflare` as a
Cloudflare Pages Function. Use `pnpm build` and deploy the `dist/` directory in
Cloudflare Pages.

Astro 5 and the Cloudflare adapter 12 are pinned intentionally because newer
Astro Cloudflare adapters target Workers instead of Pages. Styling uses
Tailwind CSS 4 through its official Vite plugin, with design tokens defined in
`src/styles/global.css`.

The Stage 1 lead dispatcher is an awaited, deterministic Telegram-style fetch
mock. Replace the implementation behind `src/lib/leads/dispatcher.ts` with the
selected production lead destination; the endpoint already maps downstream
failure to a controlled non-success response.
