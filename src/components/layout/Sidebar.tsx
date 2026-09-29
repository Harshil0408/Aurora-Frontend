"use client";

import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import { hexToRgba, mercatoTokens } from "@/lib/theme";
import { Logo } from "@/components/ui/Logo";
import { logoutAllThunk, logoutThunk } from "@/store/authSlice";
import { useMeQuery } from "@/services/authApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export const SIDEBAR_WIDTH = 288;

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
    <Box sx={{ px: 1 }}>
      <Box
        component={Link}
        href="/dashboard"
        aria-label="Aurora admin home"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          textDecoration: "none",
          borderRadius: 3,
          py: 0.5,
        }}
      >
        <Logo size={40} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h2"
            component="span"
            sx={{
              display: "block",
              fontSize: "1.28rem",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Aurora
          </Typography>
          <Typography
            variant="caption"
            component="span"
            sx={{
              display: "block",
              mt: 0.25,
              fontSize: "0.68rem",
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
        borderRadius: "14px",
        px: 1.25,
        py: 0.875,
        gap: 1.25,
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
            top: 10,
            bottom: 10,
            width: 4,
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
          width: 34,
          height: 34,
          borderRadius: "11px",
          bgcolor: active ? "primary.main" : mercatoTokens.surface2,
          color: active ? "#fff" : "primary.main",
          border: 1,
          borderColor: active ? "transparent" : "divider",
          boxShadow: active
            ? `0 8px 16px -8px ${hexToRgba(mercatoTokens.brand, 0.8)}`
            : "none",
          transition: "background-color 200ms ease, color 200ms ease",
        }}
      >
        {item.icon}
      </Box>
      <ListItemText
        primary={item.label}
        slotProps={{
          primary: {
            sx: {
              fontSize: "0.9rem",
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
            px: 1.1,
            py: 0.3,
            borderRadius: 9999,
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.01em",
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
            px: 1,
            py: 0.3,
            borderRadius: 9999,
            fontSize: "0.66rem",
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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: meData } = useMeQuery(undefined, { skip: !isAuthenticated });
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const doLogout = async (global: boolean) => {
    setAnchor(null);
    onNavigate?.();
    await dispatch(global ? logoutAllThunk() : logoutThunk());
    router.replace("/login");
  };

  const meEmail = meData?.data.email ?? pendingEmail ?? null;
  const primaryRole = meData?.data.roles[0] ?? "Super Admin";
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
        py: 2.5,
        px: 1.75,
      }}
    >
      <BrandMark />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          flex: 1,
          overflowY: "auto",
          mt: 2.5,
          pr: 0.5,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: mercatoTokens.line,
            borderRadius: 9999,
          },
        }}
      >
        {sections.map((section) => (
          <Box
            key={section.title}
            component="section"
            aria-label={section.title}
          >
            <Typography
              variant="caption"
              component="p"
              sx={{
                px: 1.5,
                pb: 0.75,
                fontSize: "0.68rem",
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
              sx={{ display: "flex", flexDirection: "column", gap: 2 / 8 }}
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
      <Box sx={{ pt: 1.5, mt: 1, borderTop: 1, borderColor: "divider" }}>
        <Box
          component="button"
          type="button"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="menu"
          aria-label="Account menu"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            p: 1.25,
            borderRadius: "18px",
            background: `linear-gradient(135deg, ${mercatoTokens.brandSoft} 0%, ${mercatoTokens.surface2} 100%)`,
            border: 1,
            borderColor: "divider",
            color: "text.primary",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            transition: "border-color 200ms ease, box-shadow 200ms ease",
            "&:hover": {
              borderColor: mercatoTokens.lineStrong,
              boxShadow: mercatoTokens.shadow1,
            },
            "&:focus-visible": {
              outline: `2px solid ${mercatoTokens.accent}`,
              outlineOffset: 2,
            },
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${mercatoTokens.brand} 0%, ${mercatoTokens.brandStrong} 100%)`,
              fontSize: "0.88rem",
              fontWeight: 800,
              boxShadow: `0 8px 16px -8px ${hexToRgba(mercatoTokens.brand, 0.8)}`,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: "0.88rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mt: 0.375,
                minWidth: 0,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: "none",
                  maxWidth: "60%",
                }}
              >
                {meEmail ?? "Administrator"}
              </Typography>
              <Chip
                label={primaryRole}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  bgcolor: "primary.main",
                  color: "#fff",
                }}
              />
            </Box>
          </Box>
          <ChevronRightIcon
            fontSize="small"
            sx={{ color: "text.disabled", flex: "none" }}
          />
        </Box>
      </Box>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        aria-label="Account menu"
      >
        <MenuItem onClick={() => doLogout(false)}>
          <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Sign out
          this session
        </MenuItem>
        <MenuItem onClick={() => doLogout(true)}>
          <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Sign out
          everywhere
        </MenuItem>
      </Menu>
    </Box>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const panelSx = () => ({
  bgcolor: "background.paper",
  backgroundImage: `linear-gradient(180deg, ${mercatoTokens.surface} 0%, ${mercatoTokens.surface2} 100%)`,
  border: 1,
  borderColor: "divider",
  boxShadow: mercatoTokens.shadow1,
  overflow: "hidden",
});

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  if (isDesktop) {
    return (
      <Box
        sx={{
          ...panelSx(),
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: "sticky",
          top: 14,
          height: "calc(100dvh - 28px)",
          ml: "14px",
          my: "14px",
          borderRadius: "28px",
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
          ...panelSx(),
          width: 296,
          borderRadius: "0 28px 28px 0",
        },
      }}
    >
      <SidebarContent onNavigate={onClose} />
    </Drawer>
  );
}

export function SidebarScrim({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <Box
      onClick={onClose}
      aria-hidden
      sx={{
        display: { xs: "block", lg: "none" },
        position: "fixed",
        inset: 0,
        zIndex: (t) => t.zIndex.drawer - 1,
        bgcolor: hexToRgba(mercatoTokens.text, 0.45),
      }}
    />
  );
}
