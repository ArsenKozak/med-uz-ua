#!/usr/bin/env bash

set -uo pipefail

ROOT="${HOME}/med-uz-ua/public/images/shop"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

mkdir -p "$ROOT"/{lenses,care,frames,sunglasses}

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

SUCCESS=0
SKIPPED=0
FAILED=0
MANIFEST="$ROOT/image-sources.tsv"
FAILURES="$ROOT/image-download-failures.tsv"

printf 'category\tfile\tsource_page\n' > "$MANIFEST"
printf 'category\tfile\tsource_page\treason\n' > "$FAILURES"

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
from urllib.parse import urljoin

html_file, page_url, search_terms = sys.argv[1:]
raw = open(html_file, encoding="utf-8", errors="ignore").read()
terms = [t for t in re.split(r"[^a-z0-9]+", search_terms.lower()) if len(t) > 2]


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.candidates: list[tuple[str, str, int]] = []

    def handle_starttag(self, tag: str, attrs_list):
        attrs = {str(k).lower(): str(v) for k, v in attrs_list if v is not None}
        if tag.lower() == "meta":
            key = (attrs.get("property") or attrs.get("name") or "").lower()
            if key in {"og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"}:
                self.candidates.append((attrs.get("content", ""), key, 25))
        elif tag.lower() in {"img", "source"}:
            src = attrs.get("src") or attrs.get("data-src") or attrs.get("data-lazy-src")
            if not src and attrs.get("srcset"):
                src = attrs["srcset"].split(",")[-1].strip().split()[0]
            label = " ".join((attrs.get("alt", ""), attrs.get("title", ""), src or ""))
            if src:
                self.candidates.append((src, label, 0))


parser = Parser()
parser.feed(raw)

# Product JSON-LD often contains the cleanest packshot.
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
            if isinstance(image_value, str):
                parser.candidates.append((image_value, str(item.get("name", "")), 35))
            elif isinstance(image_value, list):
                for value in image_value:
                    if isinstance(value, str):
                        parser.candidates.append((value, str(item.get("name", "")), 35))
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)

ranked = []
seen = set()
for src, label, base in parser.candidates:
    src = html.unescape(src.strip())
    if not src or src.startswith(("data:", "blob:")):
        continue
    url = urljoin(page_url, src)
    if url in seen:
        continue
    seen.add(url)
    haystack = f"{label} {url}".lower()
    score = base + sum(18 for term in terms if term in haystack)
    score += 12 if any(word in haystack for word in ("packshot", "product", "front", "hero")) else 0
    score -= 80 if any(word in haystack for word in ("logo", "icon", "sprite", "avatar", "placeholder")) else 0
    score -= 25 if url.lower().endswith(".svg") else 0
    ranked.append((score, url))

if ranked:
    print(max(ranked, key=lambda item: item[0])[1])
PY
}

download_product() {
  local category="$1"
  local base_name="$2"
  local search_terms="$3"
  local page_url="$4"
  local existing

  existing="$(find "$ROOT/$category" -maxdepth 1 -type f -name "${base_name}.*" -print -quit 2>/dev/null || true)"
  if [[ -n "$existing" && "$FORCE" -eq 0 ]]; then
    echo "↪️  Вже є: ${existing##*/}"
    SKIPPED=$((SKIPPED + 1))
    return
  fi

  local html_file="$WORK_DIR/page-${SUCCESS}-${FAILED}.html"
  local image_file="$WORK_DIR/image-${SUCCESS}-${FAILED}"
  local image_url mime extension destination

  if ! curl --fail --silent --show-error --location \
      --retry 3 --retry-all-errors --connect-timeout 15 --max-time 60 \
      --user-agent 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36' \
      "$page_url" -o "$html_file"; then
    printf '%s\t%s\t%s\tpage-download-failed\n' "$category" "$base_name" "$page_url" >> "$FAILURES"
    echo "❌ Сторінка недоступна: $base_name"
    FAILED=$((FAILED + 1))
    return
  fi

  image_url="$(choose_image_url "$html_file" "$page_url" "$search_terms")"
  if [[ -z "$image_url" ]]; then
    printf '%s\t%s\t%s\timage-url-not-found\n' "$category" "$base_name" "$page_url" >> "$FAILURES"
    echo "❌ Не знайдено packshot: $base_name"
    FAILED=$((FAILED + 1))
    return
  fi

  if ! curl --fail --silent --show-error --location \
      --retry 3 --retry-all-errors --connect-timeout 15 --max-time 90 \
      --referer "$page_url" \
      --user-agent 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36' \
      "$image_url" -o "$image_file"; then
    printf '%s\t%s\t%s\timage-download-failed\n' "$category" "$base_name" "$page_url" >> "$FAILURES"
    echo "❌ Зображення недоступне: $base_name"
    FAILED=$((FAILED + 1))
    return
  fi

  mime="$(file -b --mime-type "$image_file")"
  case "$mime" in
    image/jpeg) extension="jpg" ;;
    image/png) extension="png" ;;
    image/webp) extension="webp" ;;
    image/avif) extension="avif" ;;
    image/gif) extension="gif" ;;
    *)
      printf '%s\t%s\t%s\tnot-an-image:%s\n' "$category" "$base_name" "$page_url" "$mime" >> "$FAILURES"
      echo "❌ Отримано не зображення: $base_name ($mime)"
      FAILED=$((FAILED + 1))
      return
      ;;
  esac

  destination="$ROOT/$category/$base_name.$extension"
  if [[ "$FORCE" -eq 1 ]]; then
    find "$ROOT/$category" -maxdepth 1 -type f -name "${base_name}.*" -delete
  fi
  mv "$image_file" "$destination"
  printf '%s\t%s\t%s\n' "$category" "${base_name}.${extension}" "$page_url" >> "$MANIFEST"
  echo "✅ ${category}/${base_name}.${extension}"
  SUCCESS=$((SUCCESS + 1))
}

echo "Завантажую підтверджені фотографії товарів у: $ROOT"

# Contact lenses: official manufacturer pages where possible.
download_product lenses alcon-air-optix-night-day-aqua "air optix night day aqua packshot" "https://www.cz.alcon.com/content/rada-dailiesr"
download_product lenses alcon-air-optix-plus-hydraglyde "air optix plus hydraglyde packshot" "https://www.uk.alcon.com/lenses/airoptix.shtml"
download_product lenses alcon-air-optix-plus-hydraglyde-astigmatism "air optix hydraglyde astigmatism packshot" "https://www.cz.alcon.com/content/rada-dailiesr"
download_product lenses alcon-dailies-total1 "dailies total1 packshot" "https://www.alcon.com/lenses/focus_dailies/focus_dailies.shtml"
download_product lenses coopervision-biofinity "biofinity product box" "https://coopervision.com/contact-lenses"
download_product lenses coopervision-clariti-1-day "clariti 1 day product box" "https://coopervision.com/contact-lenses/clariti-1-day"
download_product lenses coopervision-proclear-1-day "proclear 1 day product box" "https://coopervision.com/contact-lenses/proclear-1-day-contacts"
download_product lenses acuvue-oasys-2-week "acuvue oasys hydraclear product box" "https://www.acuvue.com/en-us/products/"
download_product lenses acuvue-moist-1-day "acuvue moist product box" "https://www.acuvue.com/en-us/products/"
download_product lenses acuvue-vita-monthly "acuvue vita product box" "https://www.acuvue.com/en-us/products/acuvue-vita/"
download_product lenses bausch-lomb-ultra-monthly "bausch lomb ultra product box" "https://www.bausch.com/products/contact-lenses/monthly-contact-lenses/"
download_product lenses bausch-lomb-purevision2-hd "purevision 2 hd product box" "https://www.bausch.com/products/contact-lenses/monthly-contact-lenses/"
download_product lenses bausch-lomb-biotrue-oneday "biotrue oneday product box" "https://www.bauschcontactlenses.com/contacts/biotrue-oneday/"
download_product lenses menicon-z-rgp "menicon z product" "https://www.meniconamerica.com/consumer/products/specialty-lenses/menicon-z"
download_product lenses seed-1daypure-moisture "seed 1daypure moisture product box" "https://www.seed.co.jp/en/products/contact/soft/1daypure_up.html"

# Solutions and drops: official product pages where possible.
download_product care bausch-lomb-biotrue-multipurpose-solution "biotrue contact solution bottle product" "https://www.biotrue.com/products/contact-solution/"
download_product care bausch-lomb-renu-multiplus "renu multi plus bottle product" "https://www.renu.com/"
download_product care alcon-opti-free-puremoist "opti free puremoist bottle product" "https://opti-free.myalcon.com/"
download_product care alcon-opti-free-replenish "opti free replenish bottle product" "https://opti-free.myalcon.com/"
download_product care alcon-aosept-plus "aosept plus clear care product" "https://www.alcon.com/lens_care/aosept.shtml"
download_product care alcon-systane-ultra "systane ultra product box" "https://systane.myalcon.com/products/systane-ultra/"
download_product care alcon-systane-balance "systane balance product box" "https://systane.myalcon.com/products/systane-balance/"
download_product care ursapharm-hylo-comod "hylo comod product bottle" "https://hylo.de/en/products/hylo-comod"
download_product care ursapharm-hylo-dual "hylo dual product bottle" "https://hylo.de/en/products/hylo-dual"
download_product care bausch-lomb-blink-contacts "blink contacts product bottle" "https://www.justblink.com/products/blink-contacts-lubricating-eye-drops/"
download_product care acuvue-revitalens "acuvue revitalens solution packshot" "https://www.acuvue.com/en-gb/revitalens-multi-purpose-disinfecting-contact-lens-solution/"
download_product care avizor-unica-sensitive "avizor unica sensitive product bottle" "https://www.avizor.com/en/product/unica-sensitive/"

cat > "$ROOT/NEEDS_REAL_MODEL_IDS.md" <<'EOF'
# Зображення, які не можна чесно визначити без артикулу або фото товару

## Контактні лінзи

- Rodenstock CXL — модель контактної лінзи не підтверджена; CXL зазвичай означає corneal cross-linking.
- Proclear — у завантажувачі використано підтверджений Proclear 1 day; перевірити, чи саме він є в магазині.

## Догляд

- Hilens Optical Care Professional — не знайдено офіційного каталогу/виробника, достатнього для надійного packshot.
- Thealoz Duo — потрібне точне локальне пакування/обʼєм.
- Menicon neutralizer — потрібна назва конкретного продукту.
- SEED silicone tweezers — потрібен артикул; це не одна визначена модель.
- Lens case — потрібен виробник або власна фотографія.

## Оправи та сонцезахисні окуляри

Потрібні коди з внутрішнього боку дужки або фотографії етикеток для кожної моделі:

- Owlet
- Polo Club — також потрібна повна назва бренду (наприклад, Beverly Hills Polo Club чи інший).
- Oliver Black
- Maxima / Maxima & Co
- Twenty
- Shadow
- Dacchi
- Vido
- Alvaro
- Pro
- SEIKO

Назви Aviator, Wayfarer, Cat-Eye, Fashion, Oversize, Polarized, Classic, Premium,
Sport, Metal, Retro, Elegant, Square, Round і Gradient описують форму або стиль, а не
унікальний артикул. Називати ними випадкові фотографії конкретними товарами не можна.

## Окулярні лінзи

SEIKO, Filab і Transitions GEN S — це лінзи/технології, а не оправи. Для них потрібні
окремі промоматеріали виробника або узгоджені бренд-банери, а не фотографії випадкових окулярів.
EOF

echo
echo "Готово: $SUCCESS; пропущено наявних: $SKIPPED; помилок: $FAILED"
echo "Джерела: $MANIFEST"
echo "Помилки: $FAILURES"
echo "Що потребує артикулів: $ROOT/NEEDS_REAL_MODEL_IDS.md"

if [[ "$FAILED" -gt 0 ]]; then
  exit 2
fi
