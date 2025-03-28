import * as React from "react";
import RouterLink from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { Typography } from "@stories/typography/Typography";
import { ArrowSquareOut as ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { CaretDown as CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRight as CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";

import type { NavItemConfig } from "@/types/layout";
import { isNavItemActive } from "@/utils/is-nav-item-active";

import { icons } from "../../utils/nav-icons";
import { WorkspacesSwitch } from "../../../../workspaces-switch";
import { useNavConfig } from "../../hook/useNavConfig";

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useNavConfig();

  // Fallback to router.pathname if usePathname() returns undefined
  const currentPath = pathname || router.pathname;

  return (
    <Box
      sx={{
        bgcolor: "var(--SideNav-background)",
        borderRight: "1px solid #E8E8E8",
        color: "var(--SideNav-color)",
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        height: "calc(100vh - var(--MainNav-height))",
        minWidth: "var(--SideNav-width)",
        position: "sticky",
        top: "var(--MainNav-height)"
      }}
    >
      <Stack spacing={2} sx={{ py: 1.5, px: 2 }}>
        <WorkspacesSwitch />
      </Stack>
      <Box
        component="nav"
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          paddingTop: "8px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" }
        }}
      >
        {renderNavGroups({ items, pathname: currentPath })}
      </Box>
      <Stack spacing={2} sx={{ padding: "10px", paddingLeft: "40px" }}>
        <Typography variant="mono-small" color="var(--SideNav-footer-color)">
          &copy; {new Date().getFullYear()}, FONOSTER. V0.3.4
        </Typography>
      </Stack>
    </Box>
  );
}

function renderNavGroups({
  items,
  pathname
}: {
  items: NavItemConfig[];
  pathname: string;
}): React.JSX.Element {
  const children = items.reduce(
    (acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
      acc.push(
        <Stack component="li" key={curr.key} spacing={1.5}>
          {curr.title ? (
            <div>
              <Typography variant="drawer-label">{curr.title}</Typography>
            </div>
          ) : null}
          <div>{renderNavItems({ depth: 0, items: curr.items, pathname })}</div>
        </Stack>
      );

      return acc;
    },
    []
  );

  return (
    <Stack component="ul" sx={{ listStyle: "none", margin: 0, padding: 0 }}>
      {children}
    </Stack>
  );
}

function renderNavItems({
  depth = 0,
  items = [],
  pathname
}: {
  depth: number;
  items?: NavItemConfig[];
  pathname: string;
}): React.JSX.Element {
  const children = items.reduce(
    (acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
      const { items: childItems, key, ...item } = curr;

      // Check if current pathname matches this item or any of its nested children
      const shouldForceOpen = (
        items: NavItemConfig[] | undefined,
        path: string
      ): boolean => {
        if (!items) return false;

        // Check if any direct child matches
        const directMatch = items.some(
          (childItem) => childItem.href && path.startsWith(childItem.href)
        );
        if (directMatch) return true;

        // Check nested children recursively
        return items.some(
          (childItem) =>
            childItem.items && shouldForceOpen(childItem.items, path)
        );
      };

      const forceOpen = childItems
        ? shouldForceOpen(childItems, pathname)
        : false;

      acc.push(
        <NavItem
          depth={depth}
          forceOpen={forceOpen}
          key={key}
          pathname={pathname}
          {...item}
        >
          {childItems
            ? renderNavItems({ depth: depth + 1, pathname, items: childItems })
            : null}
        </NavItem>
      );

      return acc;
    },
    []
  );

  return (
    <Stack
      component="ul"
      data-depth={depth}
      spacing={1}
      sx={{ listStyle: "none", m: 0, p: 0 }}
    >
      {children}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, "items"> {
  children?: React.ReactNode;
  depth: number;
  forceOpen?: boolean;
  pathname: string;
}

function NavItem({
  children,
  depth,
  disabled,
  external,
  forceOpen = false,
  href,
  icon,
  label,
  matcher,
  pathname,
  title
}: NavItemProps): React.JSX.Element {
  const [open, setOpen] = React.useState<boolean>(forceOpen);

  // Update open state when forceOpen changes
  React.useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  const active = isNavItemActive({
    disabled,
    external,
    href,
    matcher,
    pathname
  });
  const Icon = icon ? icons[icon] : null;
  const ExpandIcon = open ? CaretDownIcon : CaretRightIcon;
  const isBranch = children && !href;
  const showChildren = Boolean(children && open);

  return (
    <Box component="li" data-depth={depth} sx={{ userSelect: "none" }}>
      <Box
        {...(isBranch
          ? {
              onClick: (): void => {
                setOpen(!open);
              },
              onKeyUp: (event: React.KeyboardEvent<HTMLDivElement>): void => {
                if (event.key === "Enter" || event.key === " ") {
                  setOpen(!open);
                }
              },
              role: "button"
            }
          : {
              ...(href
                ? {
                    component: external ? "a" : RouterLink,
                    href,
                    target: external ? "_blank" : undefined,
                    rel: external ? "noreferrer" : undefined
                  }
                : { role: "button" })
            })}
        sx={{
          alignItems: "center",
          borderRadius: 1,
          color: "var(--NavItem-color)",
          cursor: "pointer",
          display: "flex",
          flex: "0 0 auto",
          gap: 1,
          p: "6px 16px",
          position: "relative",
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease-in-out",
          ...(disabled && {
            bgcolor: "var(--NavItem-disabled-background)",
            color: "var(--NavItem-disabled-color)",
            cursor: "not-allowed"
          }),
          ...(active && {
            bgcolor: "var(--NavItem-active-background)",
            color: "var(--NavItem-active-color)",
            ...(depth > 0 && {
              "&::before": {
                bgcolor: "var(--NavItem-children-indicator)",
                borderRadius: "2px",
                content: '" "',
                height: "20px",
                left: "-14px",
                position: "absolute",
                width: "3px"
              }
            })
          }),
          ...(open && { color: "var(--NavItem-open-color)" }),
          "&:hover": {
            ...(!disabled &&
              !active && {
                bgcolor: "#00ab5514",
                color: "var(--NavItem-hover-color)",
                transform: "translateX(4px)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              })
          }
        }}
        tabIndex={0}
      >
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            flex: "0 0 auto"
          }}
        >
          {Icon ? (
            <Icon
              fill={
                active
                  ? "var(--NavItem-icon-active-color)"
                  : "var(--NavItem-icon-color)"
              }
              fontSize="var(--icon-fontSize-md)"
              weight={forceOpen || active ? "fill" : undefined}
            />
          ) : null}
        </Box>
        <Box sx={{ flex: "1 1 auto" }}>
          <Typography component="span" variant="drawer-label">
            {title}
            {active && (
              <Box
                sx={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#39E19E",
                  display: "inline-block",
                  marginLeft: "8px"
                }}
              />
            )}
          </Typography>
        </Box>
        {label ? <Chip color="primary" label={label} size="small" /> : null}
        {external ? (
          <Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}>
            <ArrowSquareOutIcon
              color="var(--NavItem-icon-color)"
              fontSize="var(--icon-fontSize-sm)"
            />
          </Box>
        ) : null}
        {isBranch ? (
          <Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}>
            <ExpandIcon
              color="var(--NavItem-expand-color)"
              fontSize="var(--icon-fontSize-sm)"
            />
          </Box>
        ) : null}
      </Box>
      {showChildren ? (
        <Box sx={{ pl: "24px" }}>
          <Box
            sx={{
              borderLeft: "1px solid var(--NavItem-children-border)",
              pl: "12px"
            }}
          >
            {children}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
