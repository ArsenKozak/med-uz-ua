# Product image intake and exact binding

The product image pipeline is deterministic and fail-closed. It separates four facts that must not be conflated: successful transport, valid raster bytes, an exact brand/model/SKU match, and permission to publish the photograph.

## Canonical commands

```sh
pnpm fetch:product-images
pnpm seed:products
pnpm report:product-images
```

`scripts/product-image-sources.json` is the only canonical acquisition manifest. It contains exactly one record per canonical product and is reviewed/updated once; the fetch command never performs search-engine queries. `public/images/shop/image-sources.tsv` is retained solely as legacy acquisition evidence and is not an input to the current pipeline.

The removed Bash and SerpAPI implementations must not be used. The current Node.js 22 TypeScript command requires no image-search credential.

## Manifest approval fields

Each seed record has a unique ID, matching slug, and deterministic `MED-INTERNAL-*` catalog SKU. This is explicitly an internal key, not an invented manufacturer SKU. Each source record carries the same identity fields plus brand/model, source page, direct image URL, deterministic local path, expected MIME, match basis, rights basis, optional retrieval timestamp/SHA-256, and two independent approval gates:

- `exactMatchConfirmed` means a human review established the exact brand, model/SKU, variant, and pack configuration.
- `rightsConfirmed` means the clinic has documented permission or another reviewed legal basis to publish that specific asset.

A manufacturer URL, filename similarity, successful download, or owner authorization to build the pipeline does not set either flag automatically. Empty source URLs are explicit unresolved blockers, not placeholders that the script tries to search for.

## Acquisition safety

For an approved manifest record the fetch command:

1. accepts only HTTPS source and image URLs without embedded credentials;
2. rejects localhost, local/private hostnames, literal private addresses, and DNS results containing private addresses;
3. follows at most three HTTPS redirects and makes at most three bounded attempts with a 20-second timeout;
4. requires a successful status and exact declared `Content-Type`;
5. enforces a 15 MiB streaming limit and a non-trivial minimum size;
6. accepts only JPEG, PNG, or WebP and validates magic bytes (including JPEG end marker / PNG IEND);
7. stages validated bytes beside the destination and atomically renames them;
8. computes SHA-256 and preserves an unchanged asset whose bytes match the manifest;
9. refuses to promote records without both exact-match and rights approval;
10. writes a sanitized blocker report without response bodies, secrets, or signed URLs.

The final filename is always derived from the canonical slug and stored under the matching `lenses`, `care`, `frames`, or `sunglasses` directory.

## Seed safety

`scripts/seed-products.ts` has no `--allow-missing-images` or category-fallback mode. It validates all 60 records before writing anything. Generation proceeds only when every manifest record has:

- one-to-one seed ID, slug, brand, model, category, and path parity;
- a valid local raster with matching MIME and SHA-256;
- public HTTPS source-page and direct-image provenance;
- confirmed exact-model evidence and publication rights;
- no duplicate local path or duplicate byte mapping.

Only seed-owned files listed in `scripts/seed-products.manifest.json` may be updated or removed. The three manually maintained draft product fixtures remain outside that ownership manifest.

## Evidence outputs

- `public/images/shop/image-download-failures.tsv` — sanitized blocker state from the latest fetch run.
- `docs/product-image-coverage.json` — machine-readable evidence.
- `docs/product-image-coverage.md` — requested per-product table and computed summary.

Both evidence files are generated from current bytes and manifest data. Their totals are computed, never declared as `60/60` merely because the catalog contains 60 rows.
