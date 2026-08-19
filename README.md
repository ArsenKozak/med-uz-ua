# 🏥 med.uz.ua — Medical Practice Platform

**Status:** ✅ Production | **Hosting:** Cloudflare Pages | **Domain:** [med.uz.ua](https://med.uz.ua)

Production web platform built for a specialized ophthalmology medical practice. Designed with a Zero-JS-first approach using Astro, achieving instantaneous navigation, high accessibility, and optimized Core Web Vitals.

---

## 🎯 Architecture & Performance

┌─────────────────────────────────────────────────────────┐
│              Cloudflare Global Edge Network             │
├────────────────────────────┬────────────────────────────┤
│   Static Site Generation   │   Client-Side Hydration    │
│   (Astro + Tailwind CSS)   │   (Vanilla JS / Modals)    │
├────────────────────────────┴────────────────────────────┤
│     Asset Optimization (WebP, Responsive Img, Minify)   │
└─────────────────────────────────────────────────────────┘


- **Zero-JS by Default:** Ships pre-rendered static HTML, hydrating interactive components only when necessary.
- **Global Edge Delivery:** Hosted via Cloudflare Pages with automatic HTTPS and asset caching.
- **SEO & Discoverability:** Structured JSON-LD metadata, semantic HTML5, semantic `robots.txt`, and optimized sitemap.

---

## 🛠️ Tech Stack

- **Framework:** Astro 4.x
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare Pages (Git integration)
- **Tooling & Analytics:** Chrome DevTools profiling, Google Analytics 4 (GA4), Google Tag Manager (GTM)

---

## 🚀 Local Development

```bash
# Clone & install
git clone [https://github.com/arsenii-leno/med-uz-ua.git](https://github.com/arsenii-leno/med-uz-ua.git)
cd med-uz-ua
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
📄 License
All rights reserved © 2026 Arsenii Leno
