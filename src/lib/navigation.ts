export type NavigationMatch = "exact" | "prefix";

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly match: NavigationMatch;
}

export const primaryNavigation: readonly NavigationItem[] = [
  { label: "Services", href: "/services", match: "prefix" },
  { label: "Shop", href: "/shop", match: "exact" },
  { label: "About", href: "/about", match: "exact" },
  { label: "Contacts", href: "/contacts", match: "exact" },
];

export const programsNavigation: NavigationItem = {
  label: "Programs",
  href: "/services/programs",
  match: "exact",
};

export function normalizePathname(pathname: string): string {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] ?? "/";
  const withLeadingSlash = withoutQueryOrHash.startsWith("/")
    ? withoutQueryOrHash
    : `/${withoutQueryOrHash}`;
  const collapsedSlashes = withLeadingSlash.replace(/\/{2,}/g, "/");
  const withoutTrailingSlash = collapsedSlashes.replace(/\/+$/, "");

  return withoutTrailingSlash.length === 0 ? "/" : withoutTrailingSlash;
}

export function isNavigationItemActive(
  pathname: string,
  item: NavigationItem,
): boolean {
  const currentPath = normalizePathname(pathname);
  const targetPath = normalizePathname(item.href);

  if (item.match === "exact") {
    return currentPath === targetPath;
  }

  return (
    currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  );
}
