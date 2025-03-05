import type { NavItemConfig } from "@/types/layout";

export function isNavItemActive({
  disabled,
  external,
  href,
  matcher,
  pathname
}: Pick<NavItemConfig, "disabled" | "external" | "href" | "matcher"> & {
  pathname: string;
}): boolean {
  if (disabled || !href || external) {
    return false;
  }

  if (matcher) {
    if (matcher.type === "startsWith") {
      return pathname ? pathname.startsWith(matcher.href) : false;
    }

    if (matcher.type === "equals") {
      return pathname === matcher.href;
    }

    return false;
  }

  // For parent routes with nested children, check if the current path starts with the href
  // This helps highlight parent items when a child route is active
  if (href.endsWith("/") || href.split("/").length <= 4) {
    return pathname.startsWith(href);
  }

  return pathname === href;
}
