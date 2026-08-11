import { defaultLocale, isLocale, type Locale } from "./config";

interface InternalPathParts {
  readonly pathname: string;
  readonly suffix: string;
}

function splitInternalPath(path: string): InternalPathParts {
  const suffixIndex = path.search(/[?#]/);
  const rawPathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : path.slice(suffixIndex);
  const withLeadingSlash = rawPathname.startsWith("/")
    ? rawPathname
    : `/${rawPathname}`;
  const pathname = withLeadingSlash.replace(/\/{2,}/g, "/") || "/";

  return { pathname, suffix };
}

function firstPathSegment(pathname: string): string | undefined {
  return pathname.split("/").filter(Boolean)[0];
}

export function localeFromPath(path: string): Locale {
  const { pathname } = splitInternalPath(path);
  const segment = firstPathSegment(pathname);

  return isLocale(segment) ? segment : defaultLocale;
}

export function stripLocalePrefix(path: string): string {
  const { pathname, suffix } = splitInternalPath(path);
  const segment = firstPathSegment(pathname);

  if (!isLocale(segment)) {
    return `${pathname}${suffix}`;
  }

  const prefix = `/${segment}`;
  const withoutPrefix = pathname.slice(prefix.length);
  const unprefixedPath = withoutPrefix.length === 0 ? "/" : withoutPrefix;

  return `${unprefixedPath}${suffix}`;
}

export function localizePath(path: string, locale: Locale): string {
  const { pathname: unprefixedPathname, suffix } = splitInternalPath(
    stripLocalePrefix(path),
  );

  if (locale === defaultLocale) {
    return `${unprefixedPathname}${suffix}`;
  }

  const localizedPathname =
    unprefixedPathname === "/"
      ? `/${locale}/`
      : `/${locale}${unprefixedPathname}`;

  return `${localizedPathname}${suffix}`;
}

export function getLocalePath(path: string, locale: Locale): string {
  return localizePath(path, locale);
}
