import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const PRODUCTS_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

const isApply = process.argv.includes("--apply") || process.argv.includes("--write");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Валідація бінарних сигнатур (Magic Bytes)
function inspectMagicBytes(buffer) {
  if (!buffer || buffer.length < 16) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: ".jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: ".png", mime: "image/png" };
  }

  // WebP: RIFF .... WEBP
  const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (isRiff && isWebp) {
    return { ext: ".webp", mime: "image/webp" };
  }

  return null;
}

// 2. Отримання VQD токена DuckDuckGo
async function fetchVqd(query) {
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(7000),
      },
    );
    const html = await res.text();
    const match = html.match(/vqd=["']?([0-9-]+)["']?/) || html.match(/vqd=([0-9-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// 3. Пошук URL кандидатів
async function searchCandidates(query) {
  try {
    const vqd = await fetchVqd(query);
    if (!vqd) return [];

    const res = await fetch(
      `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Referer: "https://duckduckgo.com/",
        },
        signal: AbortSignal.timeout(7000),
      },
    );
    const data = await res.json();
    if (Array.isArray(data.results)) {
      return data.results.slice(0, 6).map((r) => r.image).filter(Boolean);
    }
  } catch {}
  return [];
}

// 4. Завантаження та валідація буфера
async function downloadValidatedImage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  if (buffer.length < 4000) {
    throw new Error("Файл замалий (<4KB)");
  }

  const magic = inspectMagicBytes(buffer);
  if (!magic) {
    throw new Error("Некоректні Magic Bytes (не JPG/PNG/WebP)");
  }

  return { buffer, ext: magic.ext, mime: magic.mime };
}

// Редакційні заповнювачі на випадок відсутності фото
const CATEGORY_EDITORIAL_FALLBACKS = {
  lenses: "/images/artificial/macro-lens-hydration.jpg",
  care: "/images/artificial/hero-refraction-light.jpg",
  frames: "/images/artificial/shop-editorial-eyewear.jpg",
  sunglasses: "/images/artificial/shop-editorial-eyewear.jpg",
};

async function main() {
  const modeLabel = isApply ? "🚀 РЕЖИМ ЗАПИСУ (--apply)" : "🔍 DRY-RUN (перегляд змін)";
  console.log(`\n======================================================`);
  console.log(`  Менеджер зображень каталогу: ${modeLabel}`);
  console.log(`======================================================\n`);

  const productFiles = fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith(".json"));
  const stats = {
    total: productFiles.length,
    existingValid: 0,
    downloaded: 0,
    editorialFallback: 0,
  };

  for (const [index, file] of productFiles.entries()) {
    const filePath = path.join(PRODUCTS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    const productId = path.parse(file).name;
    const category = json.category || "lenses";
    const brand = json.brand || "";
    const title = json.title || productId;

    const targetDir = path.join(PUBLIC_DIR, "images", "shop", category);
    if (isApply) fs.mkdirSync(targetDir, { recursive: true });

    // Крок 1: Перевірка існуючого локального файлу з валідацією байтів
    let validLocalWebPath = null;
    for (const ext of [".webp", ".png", ".jpg", ".jpeg"]) {
      const localDiskPath = path.join(targetDir, `${productId}${ext}`);
      if (fs.existsSync(localDiskPath)) {
        const buf = fs.readFileSync(localDiskPath);
        const magic = inspectMagicBytes(buf);
        if (magic && buf.length >= 4000) {
          validLocalWebPath = `/images/shop/${category}/${productId}${ext}`;
          break;
        }
      }
    }

    if (validLocalWebPath) {
      stats.existingValid++;
      console.log(`[${index + 1}/${stats.total}] ✅ ІСНУЄ: ${productId} -> ${validLocalWebPath}`);
      if (isApply) {
        json.image = validLocalWebPath;
        json.imageKind = "product";
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
      }
      continue;
    }

    // Крок 2: Пошук та валідація нового фото в інтернеті
    const searchQuery = `${brand} ${title} packshot product isolated white background`.trim();
    console.log(`[${index + 1}/${stats.total}] 🌐 ПОШУК: "${brand} - ${title}"`);

    const candidateUrls = await searchCandidates(searchQuery);
    let downloadedResult = null;

    for (const url of candidateUrls) {
      try {
        const res = await downloadValidatedImage(url);
        downloadedResult = res;
        break;
      } catch {}
    }

    if (downloadedResult) {
      const fileName = `${productId}${downloadedResult.ext}`;
      const saveDiskPath = path.join(targetDir, fileName);
      const relativeWebPath = `/images/shop/${category}/${fileName}`;

      if (isApply) {
        fs.writeFileSync(saveDiskPath, downloadedResult.buffer);
        json.image = relativeWebPath;
        json.imageKind = "product";
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
      }

      stats.downloaded++;
      console.log(`    📥 ЗАВАНТАЖЕНО (${downloadedResult.mime}): ${relativeWebPath}`);
    } else {
      // Крок 3: Чесний fallback на редакційне фото, якщо точного не знайдено
      const editorialPath = CATEGORY_EDITORIAL_FALLBACKS[category] || "/images/artificial/macro-lens-hydration.jpg";
      if (isApply) {
        json.image = editorialPath;
        json.imageKind = "editorial";
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
      }
      stats.editorialFallback++;
      console.log(`    ⚠️ НЕ ЗНАЙДЕНО -> editorial fallback: ${editorialPath}`);
    }

    await sleep(350);
  }

  console.log(`\n======================================================`);
  console.log(`📊 Підсумок обробки:`);
  console.log(`  • Всього товарів:             ${stats.total}`);
  console.log(`  • Підтверджено наявних:       ${stats.existingValid}`);
  console.log(`  • Завантажено нових валідних: ${stats.downloaded}`);
  console.log(`  • Редакційних заглушок:       ${stats.editorialFallback}`);
  console.log(`======================================================\n`);

  if (!isApply) {
    console.log(`👉 Щоб зберегти файли на диск та оновити JSON, запусти:`);
    console.log(`   node scripts/sync-shop-images.mjs --apply\n`);
  }
}

main().catch(console.error);
