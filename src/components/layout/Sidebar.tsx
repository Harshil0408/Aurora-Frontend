"use client";

import {
  Avatar,
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import GridViewIcon from "@mui/icons-material/GridView";
import BarChartIcon from "@mui/icons-material/BarChart";
import StoreIcon from "@mui/icons-material/Store";
import GroupIcon from "@mui/icons-material/Group";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PercentIcon from "@mui/icons-material/Percent";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import HistoryIcon from "@mui/icons-material/History";
import DevicesIcon from "@mui/icons-material/Devices";
import ShieldIcon from "@mui/icons-material/Shield";
import PaletteIcon from "@mui/icons-material/Palette";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DatasetIcon from "@mui/icons-material/Dataset";
import SettingsIcon from "@mui/icons-material/Settings";
import { mercatoTokens } from "@/lib/theme";
import { ADMIN_HOME_PATH, ADMIN_PREFIX } from "@/lib/panels";
import { Logo } from "@/components/ui/Logo";
import { useMeQuery } from "@/services/authApi";
import { useAppSelector } from "@/store/hooks";
import { usePermissions } from "@/components/auth/RbacGuard";

/** Compact premium rail — flush to the viewport edge, Linear-style density. */
export const SIDEBAR_WIDTH = 264;

interface NavChild {
  label: string;
  href: string;
  /** Matches `?scope=` on the overview page; omitted for plain paths. */
  scope?: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  quietBadge?: boolean;
  /** Permission key required to see this item (hidden otherwise). */
  perm?: string;
  /** Nested links rendered as an expandable accordion group. */
  children?: NavChild[];
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: ADMIN_HOME_PATH,
        icon: <GridViewIcon fontSize="small" />,
      },
      { label: "Analytics", icon: <BarChartIcon fontSize="small" /> },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { label: "Sellers", icon: <StoreIcon fontSize="small" />, badge: "12" },
      { label: "Users", icon: <GroupIcon fontSize="small" /> },
      {
        label: "Products",
        icon: <Inventory2Icon fontSize="small" />,
        badge: "3 reported",
        quietBadge: true,
      },
      { label: "Orders", icon: <ShoppingBagIcon fontSize="small" /> },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Admins",
        href: `${ADMIN_PREFIX}/admins`,
        icon: <AdminPanelSettingsIcon fontSize="small" />,
        perm: "admin.read",
      },
      {
        label: "Roles & Permissions",
        href: `${ADMIN_PREFIX}/roles`,
        icon: <VpnKeyIcon fontSize="small" />,
        perm: "role.read",
      },
      {
        label: "Activity Log",
        href: `${ADMIN_PREFIX}/activity`,
        icon: <HistoryIcon fontSize="small" />,
        perm: "audit.read",
      },
      {
        label: "Sessions",
        href: `${ADMIN_PREFIX}/sessions`,
        icon: <DevicesIcon fontSize="small" />,
        perm: "session.read",
      },
      {
        label: "Security",
        href: `${ADMIN_PREFIX}/security`,
        icon: <ShieldIcon fontSize="small" />,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payouts", icon: <AccountBalanceWalletIcon fontSize="small" /> },
      { label: "Commissions", icon: <PercentIcon fontSize="small" /> },
      { label: "Subscriptions", icon: <AutorenewIcon fontSize="small" /> },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Health", icon: <MonitorHeartIcon fontSize="small" /> },
      {
        label: "Attributes",
        href: `${ADMIN_PREFIX}/attributes`,
        icon: <DatasetIcon fontSize="small" />,
        perm: "attribute.read",
        children: [
          { label: "All types", href: `${ADMIN_PREFIX}/attributes` },
          { label: "Admin", href: `${ADMIN_PREFIX}/attributes?scope=admin`, scope: "admin" },
          { label: "Seller", href: `${ADMIN_PREFIX}/attributes?scope=seller`, scope: "seller" },
          { label: "Users", href: `${ADMIN_PREFIX}/attributes?scope=user`, scope: "user" },
          { label: "General", href: `${ADMIN_PREFIX}/attributes/general` },
        ],
      },
      {
        label: "Themes",
        href: `${ADMIN_PREFIX}/themes`,
        icon: <PaletteIcon fontSize="small" />,
      },
      { label: "Settings", icon: <SettingsIcon fontSize="small" /> },
    ],
  },
];

function BrandMark() {
  return (
    <Box
      component={Link}
      href={ADMIN_HOME_PATH}
      aria-label="Aurora admin home"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1,
        py: 0.5,
        textDecoration: "none",
        borderRadius: 2,
        minWidth: 0,
      }}
    >
      <Logo size={32} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h2"
          component="span"
          sx={{
            display: "block",
            fontSize: "1.05rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Aurora
        </Typography>
        <Typography
          variant="caption"
          component="span"
          sx={{
            display: "block",
            mt: 0.125,
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "primary.main",
          }}
        >
          Admin console
        </Typography>
      </Box>
    </Box>
  );
}

function NavRow({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const disabled = item.href == null;
  return (
    <ListItemButton
      component={item.href ? Link : "button"}
      href={item.href}
      onClick={onNavigate}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      title={disabled ? `${item.label} — coming soon` : undefined}
      sx={{
        borderRadius: 2,
        px: 1,
        py: 0.75,
        gap: 1.25,
        cursor: "pointer",
        color: active ? "text.primary" : "text.secondary",
        bgcolor: active ? "action.selected" : "transparent",
        fontWeight: active ? 700 : 600,
        transition:
          "background-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms cubic-bezier(0.16,1,0.3,1), transform 150ms cubic-bezier(0.16,1,0.3,1)",
        "&:hover": {
          bgcolor: active ? "action.selected" : "action.hover",
          color: "text.primary",
        },
        "&:active": { transform: "scale(0.98)" },
        "&.Mui-disabled": { opacity: 1 },
        "&:focus-visible": {
          outline: `2px solid ${mercatoTokens.brand}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: "grid",
          placeItems: "center",
          flex: "none",
          width: 28,
          height: 28,
          borderRadius: 2,
          bgcolor: active ? "primary.main" : "transparent",
          color: active ? "#fff" : "text.secondary",
          border: 1,
          borderColor: active ? "transparent" : "divider",
          boxShadow: active ? "0 1px 2px rgba(16, 24, 40, 0.2)" : "none",
          transition:
            "background-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms cubic-bezier(0.16,1,0.3,1)",
          "& svg": { fontSize: "1rem" },
        }}
      >
        {item.icon}
      </Box>
      <ListItemText
        primary={item.label}
        slotProps={{
          primary: {
            sx: {
              fontSize: "0.84rem",
              fontWeight: active ? 700 : 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          },
        }}
      />
      {item.badge ? (
        <Box
          component="span"
          sx={{
            ml: "auto",
            flex: "none",
            px: 0.875,
            py: 0.25,
            borderRadius: 9999,
            fontSize: "0.66rem",
            fontWeight: 800,
            bgcolor: item.quietBadge ? mercatoTokens.surface2 : "primary.light",
            color: item.quietBadge ? "text.secondary" : "primary.dark",
            border: 1,
            borderColor: item.quietBadge ? "divider" : "transparent",
          }}
        >
          {item.badge}
        </Box>
      ) : null}
      {disabled ? (
        <Box
          component="span"
          sx={{
            ml: item.badge ? 0 : "auto",
            flex: "none",
            px: 0.75,
            py: 0.25,
            borderRadius: 9999,
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            bgcolor: mercatoTokens.surface2,
            color: "text.disabled",
            border: 1,
            borderColor: "divider",
          }}
        >
          Soon
        </Box>
      ) : null}
    </ListItemButton>
  );
}

function NavParent({
  item,
  pathname,
  scope,
  onNavigate,
}: {
  item: NavItem;
  pathname: string | null;
  scope: string | null;
  onNavigate?: () => void;
}) {
  const base = item.href ?? "";
  const active =
    base !== "" &&
    pathname != null &&
    (pathname === base || pathname.startsWith(`${base}/`));
  const [open, setOpen] = useState(active);
  const children = item.children ?? [];
  const isChildActive = (c: NavChild) => {
    const childPath = c.href.split("?")[0];
    if (pathname == null) return false;
    if (c.scope != null) {
      // Scoped overview links share one path — the ?scope= picks the winner.
      return pathname === childPath && scope === c.scope;
    }
    if (childPath.endsWith("/general")) {
      return pathname === childPath || pathname.startsWith(`${childPath}/`);
    }
    // "All types": active only when no scope is selected.
    return pathname === childPath && scope == null;
  };
  return (
    <Box>
      <ListItemButton
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        sx={{
          borderRadius: 2,
          px: 1,
          py: 0.75,
          gap: 1.25,
          cursor: "pointer",
          color: active ? "text.primary" : "text.secondary",
          bgcolor: active ? "action.selected" : "transparent",
          fontWeight: active ? 700 : 600,
          transition:
            "background-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms cubic-bezier(0.16,1,0.3,1), transform 150ms cubic-bezier(0.16,1,0.3,1)",
          "&:hover": {
            bgcolor: active ? "action.selected" : "action.hover",
            color: "text.primary",
          },
          "&:active": { transform: "scale(0.98)" },
          "&:focus-visible": {
            outline: `2px solid ${mercatoTokens.brand}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "grid",
            placeItems: "center",
            flex: "none",
            width: 28,
            height: 28,
            borderRadius: 2,
            bgcolor: active ? "primary.main" : "transparent",
            color: active ? "#fff" : "text.secondary",
            border: 1,
            borderColor: active ? "transparent" : "divider",
            boxShadow: active ? "0 1px 2px rgba(16, 24, 40, 0.2)" : "none",
            "& svg": { fontSize: "1rem" },
          }}
        >
          {item.icon}
        </Box>
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                fontSize: "0.84rem",
                fontWeight: active ? 700 : 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
          }}
        />
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            ml: "auto",
            flex: "none",
            color: "text.disabled",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List
          disablePadding
          aria-label={`${item.label} subsections`}
          sx={{ display: "flex", flexDirection: "column", gap: "2px", mt: 0.5, ml: 2.5, pl: 1.25, borderLeft: 1, borderColor: "divider" }}
        >
          {children.map((c) => {
            const childActive = isChildActive(c);
            return (
              <ListItemButton
                key={c.label}
                component={Link}
                href={c.href}
                onClick={onNavigate}
                aria-current={childActive ? "page" : undefined}
                sx={{
                  borderRadius: 2,
                  px: 1.25,
                  py: 0.625,
                  cursor: "pointer",
                  color: childActive ? "text.primary" : "text.secondary",
                  bgcolor: childActive ? "action.selected" : "transparent",
                  transition:
                    "background-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms cubic-bezier(0.16,1,0.3,1)",
                  "&:hover": {
                    bgcolor: childActive ? "action.selected" : "action.hover",
                    color: "text.primary",
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${mercatoTokens.brand}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <ListItemText
                  primary={c.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.8rem",
                        fontWeight: childActive ? 700 : 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope = searchParams?.get("scope");
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: meData } = useMeQuery(undefined, { skip: !isAuthenticated });

  const meEmail = meData?.data.email ?? pendingEmail ?? null;
  const displayName = meEmail ? (meEmail.split("@")[0] ?? "Admin") : "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const { can } = usePermissions();
  // Gated items stay hidden until permissions resolve — never flash a link
  // the viewer cannot open (page guards would 404 it anyway).
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.perm || can(item.perm)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        py: 1.75,
      }}
    >
      <Box sx={{ px: 1.25 }}>
        <BrandMark />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          mt: 2,
          scrollbarWidth: "thin",
          scrollbarColor: `${mercatoTokens.brand} transparent`,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: mercatoTokens.brand,
            borderRadius: 9999,
          },
        }}
      >
        {visibleSections.map((section) => (
          <Box
            key={section.title}
            component="section"
            aria-label={section.title}
            sx={{ px: 1.25 }}
          >
            <Typography
              variant="caption"
              component="p"
              sx={{
                px: 1.25,
                pb: 0.5,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {section.title}
            </Typography>
            <List
              disablePadding
              sx={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {section.items.map((item) => {
                if (item.children != null && item.children.length > 0) {
                  return (
                    <NavParent
                      key={item.label}
                      item={item}
                      pathname={pathname}
                      scope={scope}
                      onNavigate={onNavigate}
                    />
                  );
                }
                const active =
                  item.href != null &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`));
                return (
                  <NavRow
                    key={item.label}
                    item={item}
                    active={active}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
      <Box
        aria-label={meEmail ? `Signed in as ${meEmail}` : "Signed in as guest"}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mt: 1,
          mx: 1.25,
          pt: 1.25,
          px: 0.75,
          borderTop: 1,
          borderColor: "divider",
          minWidth: 0,
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: "primary.main",
            fontSize: "0.74rem",
            fontWeight: 800,
            flex: "none",
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.8rem",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              fontSize: "0.68rem",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meEmail ?? "Administrator"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  if (isDesktop) {
    return (
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100dvh",
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          overflow: "hidden",
          display: { xs: "none", lg: "block" },
        }}
      >
        <Suspense fallback={null}>
          <SidebarContent />
        </Suspense>
      </Box>
    );
  }
  return (
    <Drawer
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: "block", lg: "none" },
        "& .MuiDrawer-paper": {
          width: 280,
          bgcolor: "background.paper",
          backgroundImage: "none",
        },
      }}
    >
      <Suspense fallback={null}>
        <SidebarContent onNavigate={onClose} />
      </Suspense>
    </Drawer>
  );
}
