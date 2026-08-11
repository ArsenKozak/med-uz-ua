export type BrowserImagePath = `/images/${string}`;

export type VerifiedImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface VerifiedImageAsset {
  readonly src: BrowserImagePath;
  readonly width: number;
  readonly height: number;
  readonly mimeType: VerifiedImageMimeType;
}

/**
 * These dimensions and MIME types were read from the local image bytes. Keep
 * this manifest explicit so templates never have to guess paths or aspect
 * ratios from filenames.
 */
export const siteImageAssets = {
  heroRefraction: {
    src: "/images/artificial/hero-refraction-light.jpg",
    width: 2400,
    height: 1350,
    mimeType: "image/jpeg",
  },
  macroLens: {
    src: "/images/artificial/macro-lens-hydration.jpg",
    width: 2400,
    height: 1920,
    mimeType: "image/jpeg",
  },
  opticalGlass: {
    src: "/images/artificial/abstract-optical-glass.jpg",
    width: 2400,
    height: 1600,
    mimeType: "image/jpeg",
  },
  clinicEditorial: {
    src: "/images/artificial/clinic-minimalist-vibe.jpg",
    width: 2400,
    height: 1590,
    mimeType: "image/jpeg",
  },
  shopEditorial: {
    src: "/images/artificial/shop-editorial-eyewear.jpg",
    width: 2400,
    height: 1600,
    mimeType: "image/jpeg",
  },
  miroslavaLeno: {
    src: "/images/doctors/doctor-miroslava-suboty.jpeg",
    width: 2048,
    height: 2048,
    mimeType: "image/jpeg",
  },
} satisfies Readonly<Record<string, VerifiedImageAsset>>;

export const brandImageAssets = {
  legacyClinicLogo: {
    src: "/images/clinic/clinic-logo-old.jpg",
    width: 400,
    height: 293,
    mimeType: "image/jpeg",
  },
  legacyClinicMark: {
    src: "/images/clinic/logo-icon.jpeg",
    width: 1008,
    height: 616,
    mimeType: "image/png",
  },
} satisfies Readonly<Record<string, VerifiedImageAsset>>;

export const certificateAssets = [
  {
    src: "/images/clinic/certificate-01.jpg",
    width: 877,
    height: 609,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-02.jpg",
    width: 874,
    height: 619,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-03.jpg",
    width: 889,
    height: 632,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-04.jpg",
    width: 852,
    height: 627,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-05.jpg",
    width: 635,
    height: 886,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-06.jpg",
    width: 845,
    height: 628,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-07.jpg",
    width: 873,
    height: 609,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-08.jpg",
    width: 633,
    height: 886,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-09.jpg",
    width: 948,
    height: 668,
    mimeType: "image/jpeg",
  },
  {
    src: "/images/clinic/certificate-10.jpg",
    width: 891,
    height: 665,
    mimeType: "image/jpeg",
  },
] satisfies readonly VerifiedImageAsset[];

/** No verified entrance / ATB / second-floor image exists in the asset set. */
export const wayfindingAssets: readonly VerifiedImageAsset[] = [];

/** Files found in the image tree whose bytes are HTML, not raster images. */
export const knownInvalidImagePaths = [
  "/images/shop/sunglasses/sunglass-oakley-sport-03.jpg",
  "/images/shop/sunglasses/sunglass-tomford-luxury-05.jpg",
] satisfies readonly BrowserImagePath[];
