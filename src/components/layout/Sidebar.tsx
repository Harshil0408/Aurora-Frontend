"use client";

import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import SettingsIcon from "@mui/icons-material/Settings";
import { hexToRgba, mercatoTokens } from "@/lib/theme";
import { Logo } from "@/components/ui/Logo";
import { useMeQuery } from "@/services/authApi";
import { useAppSelector } from "@/store/hooks";

/** Roomy rail width — flush to the viewport edge, no floating margins. */
export const SIDEBAR_WIDTH = 272;

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  quietBadge?: boolean;
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
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
        href: "/admins",
        icon: <AdminPanelSettingsIcon fontSize="small" />,
      },
      {
        label: "Roles & Permissions",
        href: "/roles",
        icon: <VpnKeyIcon fontSize="small" />,
      },
      {
        label: "Activity Log",
        href: "/activity",
        icon: <HistoryIcon fontSize="small" />,
      },
      {
        label: "Sessions",
        href: "/sessions",
        icon: <DevicesIcon fontSize="small" />,
      },
      {
        label: "Security",
        href: "/security",
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
        label: "Themes",
        href: "/themes",
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
      href="/dashboard"
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
        position: "relative",
        borderRadius: 2.5,
        px: 1,
        py: 0.625,
        gap: 1,
        color: active ? "primary.dark" : "text.secondary",
        bgcolor: active ? mercatoTokens.brandSoft : "transparent",
        transition: "background-color 200ms ease, color 200ms ease",
        "&:hover": {
          bgcolor: active ? mercatoTokens.brandSoft : mercatoTokens.surface2,
          color: active ? "primary.dark" : "text.primary",
        },
        "&.Mui-disabled": { opacity: 1 },
        "&:focus-visible": {
          outline: `2px solid ${mercatoTokens.accent}`,
          outlineOffset: 2,
        },
      }}
    >
      {active ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 9999,
            bgcolor: "primary.main",
            boxShadow: `0 4px 12px -2px ${hexToRgba(mercatoTokens.brand, 0.7)}`,
          }}
        />
      ) : null}
      <Box
        aria-hidden
        sx={{
          display: "grid",
          placeItems: "center",
          flex: "none",
          width: 30,
          height: 30,
          borderRadius: "10px",
          bgcolor: active ? "primary.main" : mercatoTokens.surface2,
          color: active ? "#fff" : "primary.main",
          border: 1,
          borderColor: active ? "transparent" : "divider",
          boxShadow: active
            ? `0 8px 16px -8px ${hexToRgba(mercatoTokens.brand, 0.8)}`
            : "none",
          transition: "background-color 200ms ease, color 200ms ease",
          "& svg": { fontSize: "1.05rem" },
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
            bgcolor: item.quietBadge
              ? mercatoTokens.surface2
              : mercatoTokens.accentSoft,
            color: item.quietBadge
              ? "text.secondary"
              : mercatoTokens.accentStrong,
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: meData } = useMeQuery(undefined, { skip: !isAuthenticated });

  const meEmail = meData?.data.email ?? pendingEmail ?? null;
  const displayName = meEmail ? (meEmail.split("@")[0] ?? "Admin") : "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

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
        {sections.map((section) => (
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
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "text.disabled",
              }}
            >
              {section.title}
            </Typography>
            <List
              disablePadding
              sx={{ display: "flex", flexDirection: "column", gap: 1 / 8 }}
            >
              {section.items.map((item) => {
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
            borderRadius: "11px",
            background: `linear-gradient(135deg, ${mercatoTokens.brand} 0%, ${mercatoTokens.brandStrong} 100%)`,
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
        <SidebarContent />
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
      <SidebarContent onNavigate={onClose} />
    </Drawer>
  );
}
