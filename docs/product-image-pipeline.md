# Product image intake and binding

This repository treats image transport, visual identity, and usage permission as three separate checks. A successful HTTP download is not evidence that an asset is the exact local product or that it may be republished.

## Canonical commands

```sh
bash scripts/download_shop_images.sh
pnpm seed:products
pnpm report:product-images
```

The downloader resolves the project root from its own path, so it does not depend on `$HOME` or the caller's working directory. It requests only the public HTTPS manufacturer pages listed in `scripts/download_shop_images.sh`. It sends no credentials, cookies, copied browser session, or access-control bypass headers.

The canonical seed command accepts no `--allow-missing-images` mode. When exact photo evidence is absent, generation succeeds only by assigning the existing category editorial asset with `imageKind: "editorial"`. The storefront already exposes that distinction in its image badge and alt text.

`scripts/fetch-product-images.ts` and `scripts/seed-products-clean.ts` are historical/manual utilities, not package-script entry points and not the approved pipeline for this report. They must not be used to claim exact or licensed image coverage.

## Acquisition safety

For each documented source the downloader:

1. restricts the initial URL and every redirect to HTTPS;
2. applies connect/total timeouts, two bounded retries, and a 15 MiB limit;
3. requires a successful HTTP response and an expected MIME type;
4. validates JPEG, PNG, WebP, or AVIF magic bytes and a non-trivial size;
5. stages the validated bytes beside the destination and performs an atomic rename;
6. keeps an existing file only when its SHA-256 matches a provenance row;
7. records every download with source page, source asset, provider, retrieval time, SHA-256, usage-rights state, and exact-match state;
8. reports failed or intentionally unattempted products in `image-download-failures.tsv`.

`permission-unverified` means exactly that: the asset must not be treated as licensed for this site. `unreviewed` means filename, metadata, and source context have not established an exact model/variant/pack match.

## Exact-image approval gate

`scripts/seed-products.ts` will bind a shop image as `imageKind: "product"` only when one provenance row for the same product contains all of the following:

- `usage_rights` is `approved-for-site`, backed by owner-supplied or manufacturer permission;
- `exact_match_confidence` is `exact` after visual review of model/SKU, variant, and pack size;
- `source_page` and `source_asset` are HTTPS URLs;
- `sha256` exactly matches the local bytes;
- the referenced file passes raster magic-byte validation.

Do not promote a row based only on a manufacturer domain, filename, search result, similar packaging, or a visually related lifestyle image. Product price, stock, medical/performance statements, warranty, and local assortment still require their own business evidence; image approval does not verify those fields.

## Reports

- `public/images/shop/image-sources.tsv` is the provenance ledger.
- `public/images/shop/image-download-failures.tsv` is the latest acquisition blocker ledger.
- `docs/product-image-coverage.json` is the machine-readable binding and asset audit.
- `docs/product-image-coverage.md` is the human-readable coverage report, including visual findings for generic filenames and downloaded candidates.

The three collection files outside `seed-products.manifest.json` are retained intentionally: they are `draft` / `pending-clinic-confirmation` editorial placeholders. They are not part of the 60 generated seed products and are not accidental active duplicates.
