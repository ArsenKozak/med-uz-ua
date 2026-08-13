# Product image coverage

This report is generated from `shop_seed.json`, the product collection, `seed-products.manifest.json`, image magic bytes, and `public/images/shop/image-sources.tsv`. It does not grant copyright permission or infer an exact model from a filename.

The repository has no distinct SKU field, so **slug/SKU** below is the canonical content slug/seed ID. A manufacturer candidate link is labeled “candidate only” when it is not the provenance of the rendered fallback.

## Summary

| Metric | Count |
|---|---:|
| expectedSeedRecords | 60 |
| seedRecords | 60 |
| uniqueSeedIds | 60 |
| generatedManifestFiles | 60 |
| productCollectionFiles | 63 |
| generatedSeedProducts | 60 |
| manualDraftPlaceholders | 3 |
| manualOtherProducts | 0 |
| zodValidProductFiles | 63 |
| exactProductImagesApproved | 0 |
| honestEditorialFallbacks | 63 |
| productImageEvidenceGaps | 0 |
| productsWithoutApprovedExactPhoto | 63 |
| missingReferencedFiles | 0 |
| invalidReferencedFiles | 0 |
| provenanceRows | 16 |
| approvedForSiteProvenanceRows | 0 |
| permissionUnverifiedProvenanceRows | 16 |
| visuallyExactCandidateRows | 2 |
| partialVisualCandidateRows | 6 |
| mismatchedVisualCandidateRows | 8 |
| shopRasterFilenameCount | 49 |
| invalidShopRasterFiles | 2 |
| unreferencedShopAssets | 49 |

The three non-manifest collection records are retained because they are explicit `draft` / `pending-clinic-confirmation` editorial placeholders, not accidental duplicates of the 60 generated seed IDs. Exact one-to-one photo coverage remains blocked until an asset has a visually reviewed model match and documented `approved-for-site` usage rights.

## Per-product coverage

| Slug / seed ID | Brand / model | Referenced path | Valid file | Referenced source / acquisition candidate | Exact confidence | Duplicate use | Status |
|---|---|---|---|---|---|---:|---|
| care-ao-sept-plus-6 | Alcon — Пероксидна система AOSEPT PLUS 360 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-artificial-tears-15 | Thea — Штучні сльози Thealoz Duo 10 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-avizor-unica-8 | Avizor — Розчин Avizor Unica Sensitive 350 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | [Avizor](https://www.avizor.com/en/product/unica-sensitive/) (candidate only) | not-applicable-editorial; candidate: partial/model-identified-non-packshot | 32 | verified-category-fallback |
| care-biotrue-solution-1 | Bausch & Lomb — Універсальний розчин Biotrue 300 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | [Bausch + Lomb](https://www.biotrue.com/products/contact-solution/) (candidate only) | not-applicable-editorial; candidate: partial/model-family-volume-unverified | 32 | verified-category-fallback |
| care-blink-contacts-7 | Johnson & Johnson — Краплі Blink Contacts 10 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | [Bausch + Lomb](https://www.justblink.com/products/blink-contacts-lubricating-eye-drops/) (candidate only) | not-applicable-editorial; candidate: mismatch/brand-attribution-and-pack-need-review | 32 | verified-category-fallback |
| care-hilens-optical-10 | Hilens — Розчин Hilens Optical Care 360 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-hylo-comod-4 | URSAPHARM — Краплі для очей HYLO-COMOD 10 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-hylo-dual-9 | URSAPHARM — Краплі HYLO DUAL 10 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-lens-case-12 | Bausch & Lomb — Контейнер для лінз з дзеркалом | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-opti-free-puremoist-2 | Alcon — Багатофункціональний розчин Opti-Free PureMoist 360 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | [Alcon](https://opti-free.myalcon.com/products/opti-free-puremoist/) (candidate only) | not-applicable-editorial; candidate: mismatch/not-a-product-photo | 32 | verified-category-fallback |
| care-peroxide-neutralizer-14 | Menicon — Нейтралізатор для пероксидних систем 360 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-renu-multiplus-5 | Bausch & Lomb — Розчин ReNu MultiPlus 360 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| care-systane-balance-11 | Alcon — Краплі Systane Balance 10 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | [Alcon](https://systane.myalcon.com/products/systane-balance/) (candidate only) | not-applicable-editorial; candidate: exact/exact-model-volume | 32 | verified-category-fallback |
| care-systane-ultra-drops-3 | Alcon — Зволожуючі краплі Systane Ultra 10 мл | `/images/artificial/macro-lens-hydration.jpg` | yes | [Alcon](https://systane.myalcon.com/products/systane-ultra/) (candidate only) | not-applicable-editorial; candidate: exact/exact-model-volume | 32 | verified-category-fallback |
| care-tweezers-13 | SEED — Пінцет для контактних лінз силіконовий | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| daily-contact-lenses | Pending clinic confirmation — Daily Contact Lens Option | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| frame-alvaro-sport-10 | Alvaro — Оправа Alvaro Sport Flex | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-dacchi-square-7 | Dacchi — Оправа Dacchi Classic Square | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-maxima-acetate-15 | Maxima — Оправа Maxima Acetate | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-maxima-titanium-4 | Maxima & Co — Оправа Maxima & Co Titanium | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-oliver-black-gold-14 | Oliver Black — Оправа Oliver Black Gold Edition | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-oliver-black-premium-3 | Oliver Black — Оправа Oliver Black Premium | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-owlet-cateye-12 | Owlet — Оправа Owlet Cat-Eye | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-owlet-classic-1 | Owlet — Оправа Owlet Classic Acetate | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-polo-club-elegant-2 | Polo Club — Оправа Polo Club Elegant Metal | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-polo-club-wayfarer-13 | Polo Club — Оправа Polo Club Wayfarer Style | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-pro-lightweight-11 | Pro — Оправа Pro Lightweight | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-seiko-precision-9 | SEIKO — Оправа SEIKO Precision Titanium | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-shadow-minimalist-6 | Shadow — Оправа Shadow Minimalist | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-twenty-retro-5 | Twenty — Оправа Twenty Retro Square | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| frame-vido-round-8 | Vido — Оправа Vido Vintage Round | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| lens-acuvue-moist-7 | Johnson & Johnson — Acuvue Moist (30 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [ACUVUE](https://www.acuvue.com/en-us/products/acuvue-moist-1-day/) (candidate only) | not-applicable-editorial; candidate: mismatch/pack-count-mismatch | 32 | verified-category-fallback |
| lens-acuvue-oasys-3 | Johnson & Johnson — Acuvue Oasys with Hydraclear Plus (6 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [ACUVUE](https://www.acuvue.com/en-us/products/acuvue-oasys-2-week/) (candidate only) | not-applicable-editorial; candidate: mismatch/pack-count-mismatch | 32 | verified-category-fallback |
| lens-acuvue-vita-15 | Johnson & Johnson — Acuvue Vita (6 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| lens-air-optix-astigmatism-9 | Alcon — Air Optix for Astigmatism (3 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| lens-air-optix-night-day-1 | Alcon — Air Optix Night & Day Aqua (3 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [Alcon](https://www.myalcon.com/contact-lenses/monthly/air-optix-night-and-day-aqua/) (candidate only) | not-applicable-editorial; candidate: partial/model-family-match-pack-unverified | 32 | verified-category-fallback |
| lens-air-optix-plus-8 | Alcon — Air Optix Plus HydraGlyde (3 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [Alcon](https://www.myalcon.com/contact-lenses/monthly/air-optix-plus-hydraglyde/) (candidate only) | not-applicable-editorial; candidate: partial/model-family-match-pack-unverified | 32 | verified-category-fallback |
| lens-biofinity-2 | CooperVision — Biofinity CooperVision (6 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [CooperVision](https://coopervision.com/contact-lenses/biofinity-contacts) (candidate only) | not-applicable-editorial; candidate: mismatch/variant-composite | 32 | verified-category-fallback |
| lens-biotrue-oneday-14 | Bausch & Lomb — Biotrue ONEday (30 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [Bausch + Lomb](https://www.bauschcontactlenses.com/contacts/biotrue-oneday/) (candidate only) | not-applicable-editorial; candidate: partial/model-family-match-pack-unverified | 32 | verified-category-fallback |
| lens-care-solution | Pending clinic confirmation — Lens Care Option | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| lens-clariti-1day-6 | CooperVision — Clariti 1 Day (30 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [CooperVision](https://coopervision.com/contact-lenses/clariti-1-day) (candidate only) | not-applicable-editorial; candidate: mismatch/not-a-product-photo | 32 | verified-category-fallback |
| lens-dailies-total-1-4 | Alcon — Dailies Total 1 (30 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| lens-menicon-z-11 | Menicon — Menicon Z (1 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| lens-purevision-2-10 | Bausch & Lomb — PureVision 2 HD (6 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [Bausch + Lomb](https://www.bausch.com/products/contact-lenses/monthly-contact-lenses/) (candidate only) | not-applicable-editorial; candidate: partial/model-pack-match-hd-marking-unverified | 32 | verified-category-fallback |
| lens-rodenstock-cxl-13 | Rodenstock — Rodenstock CXL (6 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | — | not-applicable-editorial | 32 | verified-category-fallback |
| lens-seed-1day-pure-12 | SEED — SEED 1day Pure Moisture (30 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [SEED](https://www.seed.co.jp/en/products/contact/soft/1daypure_up.html) (candidate only) | not-applicable-editorial; candidate: mismatch/pack-count-mismatch | 32 | verified-category-fallback |
| lens-ultra-bausch-lomb-5 | Bausch & Lomb — Bausch & Lomb ULTRA (3 шт.) | `/images/artificial/macro-lens-hydration.jpg` | yes | [Bausch + Lomb](https://www.bausch.com/products/contact-lenses/monthly-contact-lenses/) (candidate only) | not-applicable-editorial; candidate: mismatch/pack-count-mismatch | 32 | verified-category-fallback |
| signature-optical-frame | Pending clinic confirmation — Optical Frame Selection | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-alvaro-gradient-9 | Alvaro — Сонцезахисні окуляри Alvaro Gradient | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-dacchi-square-7 | Dacchi — Сонцезахисні окуляри Dacchi Square | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-maxima-oversize-3 | Maxima — Сонцезахисні окуляри Maxima Oversize | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-maxima-polarized-12 | Maxima — Сонцезахисні окуляри Maxima Polarized | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-oliver-black-classic-4 | Oliver Black — Сонцезахисні окуляри Oliver Black Classic | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-oliver-black-premium-13 | Oliver Black — Сонцезахисні окуляри Oliver Black Premium | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-owlet-cateye-2 | Owlet — Сонцезахисні окуляри Owlet Sun Cat-Eye | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-owlet-fashion-11 | Owlet — Сонцезахисні окуляри Owlet Fashion | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-polo-club-aviator-1 | Polo Club — Сонцезахисні окуляри Polo Club Aviator | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-polo-club-wayfarer-10 | Polo Club — Сонцезахисні окуляри Polo Club Wayfarer | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-shadow-elegant-15 | Shadow — Сонцезахисні окуляри Shadow Elegant | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-shadow-retro-6 | Shadow — Сонцезахисні окуляри Shadow Retro | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-twenty-metal-14 | Twenty — Сонцезахисні окуляри Twenty Metal | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-twenty-sport-5 | Twenty — Сонцезахисні окуляри Twenty Sport | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |
| sunglass-vido-round-8 | Vido — Сонцезахисні окуляри Vido Round | `/images/artificial/shop-editorial-eyewear.jpg` | yes | — | not-applicable-editorial | 31 | verified-category-fallback |

## Visual review of generic and acquired shop assets

| Asset | Assessment | Visible evidence |
|---|---|---|
| `/images/shop/care/care-avizor-unica-8.png` | model-identified-non-packshot | Unica Sensitive promotional artwork is visible, but not the exact 350 ml product pack. |
| `/images/shop/care/care-biotrue-solution-1.jpg` | model-family-volume-unverified | Biotrue solution bottle is visible; 300 ml is not legible. |
| `/images/shop/care/care-blink-contacts-7.png` | brand-attribution-and-pack-need-review | The current official source is Bausch + Lomb while the seed attributes Johnson & Johnson; the rear pack also does not establish the exact 10 ml item. |
| `/images/shop/care/care-opti-free-puremoist-2.webp` | not-a-product-photo | The asset is a product comparison table, not a PureMoist 360 ml packshot. |
| `/images/shop/care/care-solution-01.jpg` | model-family-volume-unverified | Biotrue solution packaging is visible; the seed's exact 300 ml variant is not legible. |
| `/images/shop/care/care-solution-02.jpg` | different-product | The image shows Multison, which is not an intended seed product. |
| `/images/shop/care/care-solution-03.jpg` | pack-volume-mismatch | ReNu MultiPlus packaging is visible, but the pictured small pack does not support the 360 ml seed claim. |
| `/images/shop/care/care-systane-balance-11.webp` | exact-model-volume | Systane Balance 10 ml box and bottle are visibly identified. |
| `/images/shop/care/care-systane-ultra-drops-3.jpg` | exact-model-volume | Systane Ultra 10 ml box and bottle are visibly identified. |
| `/images/shop/frames/frames-catalog-01.jpeg` | generic-unbranded-frame | One unbranded frame is shown outdoors; no seeded model or SKU can be identified. |
| `/images/shop/frames/frames-catalog-02.webp` | not-a-product-photo | The image is a clinic/interior scene, not a frame product. |
| `/images/shop/frames/frames-showcase-01.jpg` | category-display-only | A multi-frame display is shown; no single seeded model can be bound. |
| `/images/shop/lenses/lens-acuvue-moist-7.webp` | pack-count-mismatch | The acquired ACUVUE asset identifies a 90-pack while the seed requests 30. |
| `/images/shop/lenses/lens-acuvue-oasys-3.webp` | pack-count-mismatch | The acquired ACUVUE asset identifies a 24-pack while the seed requests 6. |
| `/images/shop/lenses/lens-air-optix-night-day-1.webp` | model-family-match-pack-unverified | Air Optix Night & Day Aqua packaging is visible; the seed's 3-pack count is not visible. |
| `/images/shop/lenses/lens-air-optix-plus-8.png` | model-family-match-pack-unverified | Air Optix plus HydraGlyde packaging is visible; the seed's 3-pack count is not visible. |
| `/images/shop/lenses/lens-biofinity-2.png` | variant-composite | The asset combines Biofinity and Biofinity XR packaging, so it is not one exact seed packshot. |
| `/images/shop/lenses/lens-biotrue-oneday-14.png` | model-family-match-pack-unverified | Biotrue ONEday packaging is visible; the seed's 30-pack count is not established. |
| `/images/shop/lenses/lens-clariti-1day-6.webp` | not-a-product-photo | The asset is a lifestyle banner, not a Clariti 1 Day 30-pack product photo. |
| `/images/shop/lenses/lens-product-01.jpg` | different-product | The image shows CooperVision MyDay daily disposable. |
| `/images/shop/lenses/lens-product-02.jpg` | different-product | The image shows Bausch + Lomb Optima FW. |
| `/images/shop/lenses/lens-product-03.jpg` | model-family-match-pack-unverified | Dailies Total1 packaging is visible; exact pack count is not established by the image. |
| `/images/shop/lenses/lens-product-04.jpg` | different-variant | The image shows Biofinity multifocal, not plain Biofinity. |
| `/images/shop/lenses/lens-product-05.jpg` | different-variant | The image shows Biofinity toric, not plain Biofinity. |
| `/images/shop/lenses/lens-product-06.jpg` | different-product | The image shows Bausch + Lomb SofLens Multi-Focal. |
| `/images/shop/lenses/lens-product-07.jpg` | different-category-product | The image shows Opti-Free Express lens solution, not contact lenses. |
| `/images/shop/lenses/lens-product-08.jpg` | different-variant | The image shows Air Optix plus HydraGlyde for Astigmatism. |
| `/images/shop/lenses/lens-product-09.jpg` | different-variant | The image shows Air Optix plus HydraGlyde Multifocal. |
| `/images/shop/lenses/lens-product-10.jpg` | different-product | The image shows Dailies AquaComfort Plus. |
| `/images/shop/lenses/lens-product-11.jpg` | model-family-match-pack-unverified | Plain Biofinity packaging is visible; pack count is not established. |
| `/images/shop/lenses/lens-product-12.jpg` | different-product | The image shows SofLens Natural Colors. |
| `/images/shop/lenses/lens-product-13.jpg` | different-product | The image shows Air Optix Colors. |
| `/images/shop/lenses/lens-product-14.jpg` | different-product | The image shows SofLens 59. |
| `/images/shop/lenses/lens-product-15.jpg` | different-category-product | The image shows AOSept lens-care solution, not contact lenses. |
| `/images/shop/lenses/lens-product-16.jpg` | different-category-product | The image shows Avizor Unica lens-care solution. |
| `/images/shop/lenses/lens-product-17.jpg` | different-category-product | The image shows an Avizor lens-care system, not contact lenses. |
| `/images/shop/lenses/lens-product-18.jpg` | different-category-product | The image shows Avizor Aqua Soft lens-care solution. |
| `/images/shop/lenses/lens-product-19.jpg` | model-family-match-pack-unverified | Air Optix Night & Day Aqua packaging is visible; pack count is not established. |
| `/images/shop/lenses/lens-product-20.jpg` | model-family-match-pack-unverified | Air Optix plus HydraGlyde packaging is visible; pack count is not established. |
| `/images/shop/lenses/lens-product-21.jpg` | different-product | The image shows ClearLux Premium. |
| `/images/shop/lenses/lens-product-22.jpg` | model-family-match-pack-unverified | Bausch + Lomb ULTRA packaging is visible; the required pack count is not established. |
| `/images/shop/lenses/lens-purevision-2-10.webp` | model-pack-match-hd-marking-unverified | PureVision2 six-lens packaging is visible, but the seed's HD wording is not visible. |
| `/images/shop/lenses/lens-seed-1day-pure-12.jpg` | pack-count-mismatch | The image visibly identifies 32 lenses while the seed requests 30. |
| `/images/shop/lenses/lens-ultra-bausch-lomb-5.webp` | pack-count-mismatch | The image visibly identifies 6 lenses while the seed requests 3. |
| `/images/shop/sunglasses/sunglass-oakley-sport-03.jpg` | invalid-raster | The .jpg file contains HTML bytes. |
| `/images/shop/sunglasses/sunglass-polaroid-classic-02.jpg` | generic-unbranded-lifestyle | Lifestyle sunglasses photo with no visible Polaroid model/SKU evidence. |
| `/images/shop/sunglasses/sunglass-rayban-aviator-01.jpg` | generic-unbranded-different-shape | Round unbranded sunglasses are shown, not a verified Ray-Ban Aviator model. |
| `/images/shop/sunglasses/sunglass-tomford-luxury-05.jpg` | invalid-raster | The .jpg file contains HTML bytes. |
| `/images/shop/sunglasses/sunglass-vogue-fashion-04.jpg` | brand-filename-mismatch | A Ray-Ban-marked frame is visible under a Vogue filename; no exact seeded model match exists. |

## Invalid legacy shop assets

These files are not referenced by any generated product. They are reported rather than silently treated as images.

| Path | Bytes | Status |
|---|---:|---|
| `/images/shop/sunglasses/sunglass-oakley-sport-03.jpg` | 29 | invalid-raster |
| `/images/shop/sunglasses/sunglass-tomford-luxury-05.jpg` | 29 | invalid-raster |
