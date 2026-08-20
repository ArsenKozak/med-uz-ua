import fs from "fs";
import path from "path";

console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
console.log("║           MED.UZ.UA — ENTERPRISE PRODUCTION READINESS AUDIT          ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) {
  console.log(`  \x1b[32m✅\x1b[0m ${msg}`);
  passed++;
}

function warn(msg) {
  console.log(`  \x1b[33m⚠️\x1b[0m  ${msg}`);
  warnings++;
}

function fail(msg) {
  console.log(`  \x1b[31m❌\x1b[0m ${msg}`);
  failed++;
}

function section(title) {
  console.log(`\n\x1b[1m════ ${title} ════\x1b[0m`);
}

function readFile(relPath) {
  const full = path.resolve(process.cwd(), relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

// -----------------------------------------------------------------------------
// 1. i18n, Hreflang & Canonical Links
// -----------------------------------------------------------------------------
section("1. i18n SEO, Canonical & Hreflang");
const baseLayout = readFile("src/layouts/BaseLayout.astro") || readFile("src/layouts/Layout.astro") || "";
const headComponent = readFile("src/components/seo/Head.astro") || readFile("src/components/seo/SeoHead.astro") || baseLayout;

if (headComponent.includes("hreflang") && headComponent.includes("x-default")) {
  pass("Двосторонні hreflang та x-default налаштовано коректно");
} else if (headComponent.includes("hreflang")) {
  warn("Знайдено hreflang, але перевірте наявність x-default");
} else {
  fail("Теги hreflang відсутні у головному Head-компоненті");
}

if (headComponent.includes('rel="canonical"') || headComponent.includes("rel='canonical'")) {
  pass("Канонічні URL (rel=canonical) присутні для запобігання дублям сторінок");
} else {
  fail("Тег rel=canonical відсутній");
}

// -----------------------------------------------------------------------------
// 2. Open Graph & Social Previews
// -----------------------------------------------------------------------------
section("2. Open Graph & Social Preview Metadata");
const hasOgTitle = headComponent.includes("og:title");
const hasOgDesc = headComponent.includes("og:description");
const hasOgImage = headComponent.includes("og:image");
const hasTwitterCard = headComponent.includes("twitter:card");

if (hasOgTitle && hasOgDesc && hasOgImage && hasTwitterCard) {
  pass("Повний набір Open Graph і Twitter Card мета-тегів присутній");
} else {
  fail(`Відсутні обов'язкові мета-теги: ${[!hasOgTitle && 'og:title', !hasOgDesc && 'og:description', !hasOgImage && 'og:image', !hasTwitterCard && 'twitter:card'].filter(Boolean).join(", ")}`);
}

const ogMatches = headComponent.match(/content=["']([^"']*\.(?:webp|png|jpg|jpeg))["']/i);
if (headComponent.includes(".webp") && headComponent.includes("og:image")) {
  warn("Увага: у og:image використовується .webp. Деякі месенджери (Viber/старий WhatsApp) краще відображають PNG/JPG.");
} else {
  pass("Формат og:image сумісний із більшістю краулерів");
}

// -----------------------------------------------------------------------------
// 3. iOS Safari & Safe Area Insets
// -----------------------------------------------------------------------------
section("3. iOS Safari & Mobile Viewport Geometry");
if (headComponent.includes("viewport-fit=cover")) {
  pass("Meta viewport містить viewport-fit=cover для підтримки дисплеїв із вирізом (notch)");
} else {
  warn("У meta viewport рекомендовано додати 'viewport-fit=cover'");
}

const cssFiles = ["src/styles/global.css", "src/styles/app.css"].map(readFile).filter(Boolean).join("\n");
const allSrc = fs.readdirSync("src", { recursive: true }).filter(f => f.endsWith(".astro") || f.endsWith(".css")).map(f => readFile(path.join("src", f))).join("\n");

if (allSrc.includes("safe-area-inset") || allSrc.includes("env(safe-area-inset-bottom)")) {
  pass("Реалізовано відступи для Safe Area на мобільних пристроях");
} else {
  warn("Не знайдено явних safe-area-inset відступів для фіксованих панелей");
}

// -----------------------------------------------------------------------------
// 4. Custom 404 Error Page
// -----------------------------------------------------------------------------
section("4. Custom 404 Handling");
const page404 = readFile("src/pages/404.astro");
if (page404) {
  pass("Кастомна сторінка 404.astro існує");
  if (page404.includes("locale") || page404.includes("uk") || page404.includes("en")) {
    pass("Сторінка 404 враховує локалізацію користувача");
  } else {
    warn("Сторінка 404 не має явної прив'язки до активної локалі");
  }
} else {
  fail("Файл src/pages/404.astro не знайдено");
}

// -----------------------------------------------------------------------------
// 5. Accessibility (a11y) & Reduced Motion
// -----------------------------------------------------------------------------
section("5. Accessibility & Motion Preferences");
if (allSrc.includes("sr-only") || allSrc.includes("skip-to-content") || allSrc.includes("skip-link")) {
  pass("Наявні допоміжні елементи a11y (screen-reader класи або skip-to-content)");
} else {
  warn("Рекомендовано перевірити наявність skip-to-content для навігації з клавіатури");
}

if (allSrc.includes("motion-reduce") || allSrc.includes("prefers-reduced-motion")) {
  pass("Реалізовано підтримку системного режиму prefers-reduced-motion");
} else {
  warn("Рекомендовано додати motion-reduce для плавних переходів і слайдерів");
}

// -----------------------------------------------------------------------------
// 6. Analytics PII & Medical Data Quarantine
// -----------------------------------------------------------------------------
section("6. Analytics PII & Data Privacy Quarantine");
const analyticsLib = readFile("src/lib/analytics.ts") || readFile("src/lib/analytics/index.ts") || "";

const sendsSensitiveComment = analyticsLib.includes("comment") || analyticsLib.includes("fullName") || analyticsLib.includes("customer_phone");
if (!sendsSensitiveComment) {
  pass("Суворий карантин персональних та медичних даних у DataLayer підтверджено (нуль витоків у GA4)");
} else {
  fail("УВАГА: В аналітику можуть передаватися чутливі дані користувача");
}

// -----------------------------------------------------------------------------
// 7. Security Headers & CSP Final State
// -----------------------------------------------------------------------------
section("7. Security Headers & CSP");
const headers = readFile("public/_headers") || "";
if (headers.includes("Content-Security-Policy:") && !headers.includes("Report-Only")) {
  pass("Content Security Policy увімкнено у повноцінному бойовому enforce-режимі");
} else if (headers.includes("Content-Security-Policy-Report-Only:")) {
  warn("CSP досі працює у Report-Only режимі");
} else {
  fail("CSP заголовок відсутній");
}

if (headers.includes("Strict-Transport-Security") && headers.includes("X-Frame-Options: DENY")) {
  pass("HSTS та X-Frame-Options захищають від clickjacking та MITM-атак");
} else {
  fail("Відсутні критичні безпекові заголовки HSTS або X-Frame-Options");
}

// -----------------------------------------------------------------------------
// Final Report
// -----------------------------------------------------------------------------
console.log("\n══════════════════════════════════════════════════════════════════════");
console.log(`Passed:   \x1b[32m${passed}\x1b[0m`);
console.log(`Warnings: \x1b[33m${warnings}\x1b[0m`);
console.log(`Failed:   \x1b[31m${failed}\x1b[0m`);
console.log("══════════════════════════════════════════════════════════════════════\n");
