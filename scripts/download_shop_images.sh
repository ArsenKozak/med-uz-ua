#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
SHOP_ROOT="$PROJECT_ROOT/public/images/shop"
MANIFEST="$SHOP_ROOT/image-sources.tsv"
FAILURES="$SHOP_ROOT/image-download-failures.tsv"
FORCE=0

case "${1:-}" in
  "") ;;
  --force) FORCE=1 ;;
  *)
    printf 'Usage: %s [--force]\n' "${0##*/}" >&2
    exit 64
    ;;
esac

if [[ $# -gt 1 ]]; then
  printf 'Usage: %s [--force]\n' "${0##*/}" >&2
  exit 64
fi

mkdir -p "$SHOP_ROOT"/{lenses,care,frames,sunglasses}

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/meduz-shop-images.XXXXXX")"
cleanup() {
  rm -rf -- "$WORK_DIR"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

RUN_MANIFEST="$WORK_DIR/image-sources.run.tsv"
NEXT_MANIFEST="$WORK_DIR/image-sources.next.tsv"
NEXT_FAILURES="$WORK_DIR/image-download-failures.next.tsv"

printf 'product_id\tcategory\tfile\tsource_page\tsource_asset\tprovider\tretrieved_at\tsha256\tusage_rights\texact_match_confidence\n' > "$RUN_MANIFEST"
printf 'product_id\tcategory\trequested_file\tsource_page\tprovider\treason\n' > "$NEXT_FAILURES"

SUCCESS=0
SKIPPED=0
FAILED=0

sanitize_tsv() {
  printf '%s' "$1" | tr '\t\r\n' '   '
}

record_failure() {
  local product_id="$1"
  local category="$2"
  local requested_file="$3"
  local source_page="$4"
  local provider="$5"
  local reason="$6"

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$(sanitize_tsv "$product_id")" \
    "$(sanitize_tsv "$category")" \
    "$(sanitize_tsv "$requested_file")" \
    "$(sanitize_tsv "$source_page")" \
    "$(sanitize_tsv "$provider")" \
    "$(sanitize_tsv "$reason")" >> "$NEXT_FAILURES"
  FAILED=$((FAILED + 1))
}

is_https_url() {
  [[ "$1" =~ ^https://[^[:space:]]+$ ]]
}

# Prints "mime<TAB>extension" only for a non-empty raster with matching magic bytes.
inspect_raster() {
  python3 - "$1" <<'PY'
from __future__ import annotations

import pathlib
import sys

path = pathlib.Path(sys.argv[1])
try:
    data = path.read_bytes()
except OSError:
    raise SystemExit(1)

if len(data) < 512:
    raise SystemExit(1)

if data.startswith(b"\xff\xd8\xff"):
    print("image/jpeg\tjpg")
elif data.startswith(b"\x89PNG\r\n\x1a\n"):
    print("image/png\tpng")
elif len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
    print("image/webp\twebp")
elif len(data) >= 12 and data[4:8] == b"ftyp" and data[8:12] in {b"avif", b"avis"}:
    print("image/avif\tavif")
else:
    raise SystemExit(1)
PY
}

sha256_file() {
  shasum -a 256 -- "$1" | awk '{print $1}'
}

existing_has_matching_provenance() {
  local product_id="$1"
  local category="$2"
  local filename="$3"
  local sha256="$4"

  python3 - "$MANIFEST" "$product_id" "$category" "$filename" "$sha256" <<'PY'
from __future__ import annotations

import csv
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
product_id, category, filename, sha256 = sys.argv[2:]
if not manifest_path.exists():
    raise SystemExit(1)

with manifest_path.open(newline="", encoding="utf-8") as source:
    for row in csv.DictReader(source, delimiter="\t"):
        if (
            row.get("product_id") == product_id
            and row.get("category") == category
            and row.get("file") == filename
            and row.get("sha256") == sha256
            and (row.get("source_page") or "").startswith("https://")
            and (row.get("source_asset") or "").startswith("https://")
        ):
            raise SystemExit(0)

raise SystemExit(1)
PY
}

# The page parser ranks only HTTPS candidates whose surrounding metadata contains
# at least two model tokens (or the sole token for a one-word model). A match is
# still recorded as "unreviewed"; filename similarity is never treated as proof.
choose_image_url() {
  local html_file="$1"
  local page_url="$2"
  local search_terms="$3"

  python3 - "$html_file" "$page_url" "$search_terms" <<'PY'
from __future__ import annotations

import html
import json
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

html_file, page_url, search_terms = sys.argv[1:]
raw = open(html_file, encoding="utf-8", errors="ignore").read()
terms = [term for term in re.split(r"[^a-z0-9]+", search_terms.lower()) if len(term) > 2]


class Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.candidates: list[tuple[str, str, int]] = []

    def handle_starttag(self, tag: str, attrs_list) -> None:
        attrs = {str(key).lower(): str(value) for key, value in attrs_list if value is not None}
        normalized_tag = tag.lower()
        if normalized_tag == "meta":
            key = (attrs.get("property") or attrs.get("name") or "").lower()
            if key in {"og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"}:
                self.candidates.append((attrs.get("content", ""), key, 25))
        elif normalized_tag in {"img", "source"}:
            src = attrs.get("src") or attrs.get("data-src") or attrs.get("data-lazy-src")
            if not src and attrs.get("srcset"):
                src = attrs["srcset"].split(",")[-1].strip().split()[0]
            if src:
                label = " ".join((attrs.get("alt", ""), attrs.get("title", ""), src))
                self.candidates.append((src, label, 0))


parser = Parser()
parser.feed(raw)

for match in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', raw, re.I | re.S):
    try:
        payload = json.loads(html.unescape(match.group(1)))
    except Exception:
        continue
    stack = [payload]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            image_value = item.get("image")
            label = str(item.get("name", ""))
            if isinstance(image_value, str):
                parser.candidates.append((image_value, label, 35))
            elif isinstance(image_value, list):
                parser.candidates.extend((value, label, 35) for value in image_value if isinstance(value, str))
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)

ranked: list[tuple[int, str]] = []
seen: set[str] = set()
minimum_matches = min(2, len(terms))

for source, label, base_score in parser.candidates:
    source = html.unescape(source.strip())
    if not source or source.startswith(("data:", "blob:")):
        continue
    url = urljoin(page_url, source)
    if urlparse(url).scheme != "https" or url in seen:
        continue
    seen.add(url)
    haystack = f"{label} {url}".lower()
    matched_terms = sum(1 for term in terms if term in haystack)
    if matched_terms < minimum_matches:
        continue
    score = base_score + matched_terms * 18
    score += 12 if any(word in haystack for word in ("packshot", "product", "front", "hero")) else 0
    score -= 100 if any(word in haystack for word in ("logo", "icon", "sprite", "avatar", "placeholder")) else 0
    score -= 50 if url.lower().endswith(".svg") else 0
    ranked.append((score, url))

if ranked:
    print(max(ranked, key=lambda item: item[0])[1])
PY
}

download_product() {
  local product_id="$1"
  local category="$2"
  local base_name="$3"
  local provider="$4"
  local search_terms="$5"
  local page_url="$6"
  local existing=""

  if ! is_https_url "$page_url"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "source-page-not-https"
    return
  fi

  while IFS= read -r candidate; do
    if inspect_raster "$candidate" >/dev/null 2>&1; then
      existing="$candidate"
      break
    fi
  done < <(find "$SHOP_ROOT/$category" -maxdepth 1 -type f -name "${base_name}.*" -print 2>/dev/null | sort)

  if [[ -n "$existing" && "$FORCE" -eq 0 ]]; then
    local existing_sha
    existing_sha="$(sha256_file "$existing")"
    if existing_has_matching_provenance \
      "$product_id" "$category" "${existing##*/}" "$existing_sha"; then
      printf 'skip  %s (%s; matching provenance)\n' "$product_id" "${existing##*/}"
      SKIPPED=$((SKIPPED + 1))
    else
      record_failure \
        "$product_id" "$category" "${existing##*/}" "$page_url" "$provider" \
        "valid-existing-file-without-matching-provenance-use-force-to-reacquire"
      printf 'fail  %s (existing file lacks matching provenance)\n' "$product_id" >&2
    fi
    return
  fi

  local html_file="$WORK_DIR/${product_id}.html"
  local image_file="$WORK_DIR/${product_id}.image"
  local page_meta image_meta page_status page_mime page_effective
  local image_status image_mime image_effective image_url magic_info magic_mime extension

  if ! page_meta="$(curl --fail --silent --show-error --location \
      --proto '=https' --proto-redir '=https' \
      --retry 2 --retry-delay 1 --connect-timeout 10 --max-time 45 \
      --user-agent 'MedUzAssetAudit/1.0' \
      --output "$html_file" \
      --write-out '%{http_code}\t%{content_type}\t%{url_effective}' \
      "$page_url")"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "page-download-failed"
    printf 'fail  %s (page download)\n' "$product_id" >&2
    return
  fi

  IFS=$'\t' read -r page_status page_mime page_effective <<< "$page_meta"
  if [[ ! "$page_status" =~ ^2[0-9][0-9]$ ]] || ! is_https_url "$page_effective"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "invalid-page-response"
    printf 'fail  %s (invalid page response)\n' "$product_id" >&2
    return
  fi
  if [[ ! "$page_mime" =~ ^text/html([[:space:]]*;|$) ]] && [[ ! "$page_mime" =~ ^application/xhtml\+xml([[:space:]]*;|$) ]]; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "unexpected-page-mime:${page_mime:-missing}"
    printf 'fail  %s (page MIME %s)\n' "$product_id" "${page_mime:-missing}" >&2
    return
  fi

  image_url="$(choose_image_url "$html_file" "$page_effective" "$search_terms")"
  if [[ -z "$image_url" ]] || ! is_https_url "$image_url"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "qualified-https-image-not-found"
    printf 'fail  %s (qualified image not found)\n' "$product_id" >&2
    return
  fi

  if ! image_meta="$(curl --fail --silent --show-error --location \
      --proto '=https' --proto-redir '=https' \
      --retry 2 --retry-delay 1 --connect-timeout 10 --max-time 60 \
      --max-filesize 5242880 \
      --user-agent 'MedUzAssetAudit/1.0' \
      --header 'Accept: image/avif,image/webp,image/png,image/jpeg;q=0.9' \
      --output "$image_file" \
      --write-out '%{http_code}\t%{content_type}\t%{url_effective}' \
      "$image_url")"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "image-download-failed"
    printf 'fail  %s (image download)\n' "$product_id" >&2
    return
  fi

  IFS=$'\t' read -r image_status image_mime image_effective <<< "$image_meta"
  if [[ ! "$image_status" =~ ^2[0-9][0-9]$ ]] || ! is_https_url "$image_effective"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "invalid-image-response"
    printf 'fail  %s (invalid image response)\n' "$product_id" >&2
    return
  fi

  if ! magic_info="$(inspect_raster "$image_file")"; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "invalid-or-empty-raster"
    printf 'fail  %s (invalid raster bytes)\n' "$product_id" >&2
    return
  fi
  IFS=$'\t' read -r magic_mime extension <<< "$magic_info"

  if [[ "${image_mime%%;*}" != "$magic_mime" ]]; then
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "mime-magic-mismatch:${image_mime:-missing}:${magic_mime}"
    printf 'fail  %s (MIME/magic mismatch)\n' "$product_id" >&2
    return
  fi

  local destination="$SHOP_ROOT/$category/$base_name.$extension"
  local destination_tmp
  destination_tmp="$(mktemp "$SHOP_ROOT/$category/.${base_name}.XXXXXX")"
  if ! cp -- "$image_file" "$destination_tmp" || ! inspect_raster "$destination_tmp" >/dev/null 2>&1; then
    rm -f -- "$destination_tmp"
    record_failure "$product_id" "$category" "$base_name" "$page_url" "$provider" "atomic-stage-validation-failed"
    printf 'fail  %s (atomic staging)\n' "$product_id" >&2
    return
  fi
  chmod 0644 "$destination_tmp"
  mv -f -- "$destination_tmp" "$destination"

  if [[ "$FORCE" -eq 1 ]]; then
    while IFS= read -r sibling; do
      [[ "$sibling" == "$destination" ]] || rm -f -- "$sibling"
    done < <(find "$SHOP_ROOT/$category" -maxdepth 1 -type f -name "${base_name}.*" -print 2>/dev/null)
  fi

  local retrieved_at sha256
  retrieved_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  sha256="$(sha256_file "$destination")"
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$product_id" "$category" "${destination##*/}" "$page_effective" "$image_effective" \
    "$provider" "$retrieved_at" "$sha256" "permission-unverified" "unreviewed" >> "$RUN_MANIFEST"
  printf 'saved %s (%s)\n' "$product_id" "${destination##*/}"
  SUCCESS=$((SUCCESS + 1))
}

printf 'Image acquisition root: %s\n' "$SHOP_ROOT"
printf 'Only public HTTPS manufacturer pages below are requested. The script sends no credentials, cookies, or bypass headers.\n'
printf 'A successful download records provenance, not copyright permission or an exact visual match.\n\n'

# Fields: product ID, category, local basename, provider, model terms, official source page.
# Frames and sunglasses are intentionally absent: the seed lacks manufacturer model/SKU
# identifiers, so a legal exact-image request cannot be constructed from style names alone.
while IFS=$'\t' read -r product_id category base_name provider search_terms page_url; do
  [[ -z "$product_id" || "$product_id" == \#* ]] && continue
  download_product "$product_id" "$category" "$base_name" "$provider" "$search_terms" "$page_url"
done <<'SOURCES'
lens-air-optix-night-day-1	lenses	lens-air-optix-night-day-1	Alcon	air optix night day aqua	https://www.myalcon.com/contact-lenses/monthly/air-optix-night-and-day-aqua/
lens-air-optix-plus-8	lenses	lens-air-optix-plus-8	Alcon	air optix plus hydraglyde	https://www.myalcon.com/contact-lenses/monthly/air-optix-plus-hydraglyde/
lens-air-optix-astigmatism-9	lenses	lens-air-optix-astigmatism-9	Alcon	air optix plus hydraglyde astigmatism	https://www.myalcon.com/contact-lenses/monthly/air-optix-plus-hydraglyde-for-astigmatism/
lens-dailies-total-1-4	lenses	lens-dailies-total-1-4	Alcon	dailies total1	https://www.myalcon.com/contact-lenses/daily/dailies-total1/
lens-biofinity-2	lenses	lens-biofinity-2	CooperVision	biofinity	https://coopervision.com/contact-lenses/biofinity
lens-clariti-1day-6	lenses	lens-clariti-1day-6	CooperVision	clariti 1 day	https://coopervision.com/contact-lenses/clariti-1-day
lens-acuvue-oasys-3	lenses	lens-acuvue-oasys-3	ACUVUE	acuvue oasys hydraclear plus	https://www.acuvue.com/en-us/products/acuvue-oasys-2-week/
lens-acuvue-moist-7	lenses	lens-acuvue-moist-7	ACUVUE	1 day acuvue moist	https://www.acuvue.com/en-us/products/acuvue-moist-1-day/
lens-acuvue-vita-15	lenses	lens-acuvue-vita-15	ACUVUE	acuvue vita	https://www.acuvue.com/en-us/products/acuvue-vita/
lens-ultra-bausch-lomb-5	lenses	lens-ultra-bausch-lomb-5	Bausch + Lomb	bausch lomb ultra	https://www.bausch.com/products/contact-lenses/monthly-contact-lenses/
lens-purevision-2-10	lenses	lens-purevision-2-10	Bausch + Lomb	purevision 2 hd	https://www.bausch.com/products/contact-lenses/monthly-contact-lenses/
lens-biotrue-oneday-14	lenses	lens-biotrue-oneday-14	Bausch + Lomb	biotrue oneday	https://www.bauschcontactlenses.com/contacts/biotrue-oneday/
lens-seed-1day-pure-12	lenses	lens-seed-1day-pure-12	SEED	seed 1daypure moisture	https://www.seed.co.jp/en/products/contact/soft/1daypure_up.html
care-biotrue-solution-1	care	care-biotrue-solution-1	Bausch + Lomb	biotrue contact solution	https://www.biotrue.com/products/contact-solution/
care-renu-multiplus-5	care	care-renu-multiplus-5	Bausch + Lomb	renu multiplus	https://www.renu.com/
care-opti-free-puremoist-2	care	care-opti-free-puremoist-2	Alcon	opti free puremoist	https://opti-free.myalcon.com/products/opti-free-puremoist/
care-ao-sept-plus-6	care	care-ao-sept-plus-6	Alcon	aosept plus	https://www.myalcon.com/contact-lenses/contact-lens-solutions/aosept-plus-hydraglyde/
care-systane-ultra-drops-3	care	care-systane-ultra-drops-3	Alcon	systane ultra	https://systane.myalcon.com/products/systane-ultra/
care-systane-balance-11	care	care-systane-balance-11	Alcon	systane balance	https://systane.myalcon.com/products/systane-balance/
care-hylo-comod-4	care	care-hylo-comod-4	URSAPHARM	hylo comod	https://hylo.de/en/products/hylo-comod
care-hylo-dual-9	care	care-hylo-dual-9	URSAPHARM	hylo dual	https://hylo.de/en/products/hylo-dual
care-blink-contacts-7	care	care-blink-contacts-7	Bausch + Lomb	blink contacts	https://www.justblink.com/products/blink-contacts-lubricating-eye-drops/
care-avizor-unica-8	care	care-avizor-unica-8	Avizor	avizor unica sensitive	https://www.avizor.com/en/product/unica-sensitive/
SOURCES

# Ensure the failure report covers every intended seed product. Products omitted
# from SOURCES have no sufficiently precise documented official source or model ID;
# that is a real acquisition blocker, not a silent skip.
BLOCKED_SOURCE_COUNT="$(python3 - \
  "$PROJECT_ROOT/shop_seed.json" "$SHOP_ROOT" "$MANIFEST" "$RUN_MANIFEST" "$NEXT_FAILURES" <<'PY'
from __future__ import annotations

import csv
import hashlib
import json
import pathlib
import sys

seed_path, shop_root, old_manifest_path, run_manifest_path, failures_path = map(pathlib.Path, sys.argv[1:])
with seed_path.open(encoding="utf-8") as source:
    seed = json.load(source)

covered: set[str] = set()
for file_path in (old_manifest_path, run_manifest_path, failures_path):
    if not file_path.exists():
        continue
    with file_path.open(newline="", encoding="utf-8") as source:
        for row in csv.DictReader(source, delimiter="\t"):
            product_id = (row.get("product_id") or "").strip()
            if not product_id:
                continue
            if file_path == old_manifest_path:
                category = (row.get("category") or "").strip()
                filename = (row.get("file") or "").strip()
                expected_sha = (row.get("sha256") or "").strip()
                candidate = shop_root / category / filename
                if (
                    not candidate.is_file()
                    or len(expected_sha) != 64
                    or hashlib.sha256(candidate.read_bytes()).hexdigest() != expected_sha
                ):
                    continue
            covered.add(product_id)

blocked = 0
with failures_path.open("a", newline="", encoding="utf-8") as destination:
    writer = csv.writer(destination, delimiter="\t", lineterminator="\n")
    for product in seed:
        product_id = str(product.get("id", "")).strip()
        if not product_id or product_id in covered:
            continue
        writer.writerow(
            [
                product_id,
                str(product.get("category", "")),
                str(product.get("image", "")),
                "",
                str(product.get("brand", "")),
                "not-attempted-no-documented-official-source-or-exact-model-id",
            ]
        )
        blocked += 1

print(blocked)
PY
)"
FAILED=$((FAILED + BLOCKED_SOURCE_COUNT))

# Merge new rows over prior rows by product_id while preserving old provenance for
# skipped/temporarily failed entries. Legacy three-column rows are retained as
# unattributed records rather than silently upgraded into stronger evidence.
python3 - "$MANIFEST" "$RUN_MANIFEST" "$NEXT_MANIFEST" <<'PY'
from __future__ import annotations

import csv
import pathlib
import sys
from urllib.parse import urlparse

old_path, run_path, output_path = map(pathlib.Path, sys.argv[1:])
fields = [
    "product_id", "category", "file", "source_page", "source_asset", "provider",
    "retrieved_at", "sha256", "usage_rights", "exact_match_confidence",
]
rows: dict[str, dict[str, str]] = {}


def key_for(row: dict[str, str]) -> str:
    product_id = row.get("product_id", "").strip()
    if product_id:
        return f"product:{product_id}"
    return f"legacy:{row.get('category', '')}/{row.get('file', '')}/{row.get('source_page', '')}"


if old_path.exists():
    with old_path.open(newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source, delimiter="\t")
        for old in reader:
            if not old:
                continue
            if "product_id" not in old:
                page = old.get("source_page", "")
                host = urlparse(page).hostname or ""
                old = {
                    "product_id": "",
                    "category": old.get("category", ""),
                    "file": old.get("file", ""),
                    "source_page": page,
                    "source_asset": "",
                    "provider": host,
                    "retrieved_at": "",
                    "sha256": "",
                    "usage_rights": "permission-unverified",
                    "exact_match_confidence": "unreviewed",
                }
            normalized = {field: old.get(field, "") for field in fields}
            rows[key_for(normalized)] = normalized

with run_path.open(newline="", encoding="utf-8") as source:
    for row in csv.DictReader(source, delimiter="\t"):
        normalized = {field: row.get(field, "") for field in fields}
        rows[key_for(normalized)] = normalized

with output_path.open("w", newline="", encoding="utf-8") as destination:
    writer = csv.DictWriter(destination, fieldnames=fields, delimiter="\t", lineterminator="\n")
    writer.writeheader()
    for key in sorted(rows):
        writer.writerow(rows[key])
PY

atomic_replace() {
  local source="$1"
  local destination="$2"
  local temporary
  temporary="$(mktemp "$SHOP_ROOT/.${destination##*/}.XXXXXX")"
  if ! cp -- "$source" "$temporary"; then
    rm -f -- "$temporary"
    return 1
  fi
  chmod 0644 "$temporary"
  mv -f -- "$temporary" "$destination"
}

if ! atomic_replace "$NEXT_MANIFEST" "$MANIFEST"; then
  printf 'Could not atomically update %s\n' "$MANIFEST" >&2
  exit 1
fi
if ! atomic_replace "$NEXT_FAILURES" "$FAILURES"; then
  printf 'Could not atomically update %s\n' "$FAILURES" >&2
  exit 1
fi

printf '\nDownloaded: %d; skipped valid existing: %d; failed: %d\n' "$SUCCESS" "$SKIPPED" "$FAILED"
printf 'Provenance: %s\n' "$MANIFEST"
printf 'Current-run failures: %s\n' "$FAILURES"

if [[ "$FAILED" -gt 0 ]]; then
  exit 2
fi
