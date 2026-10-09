"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HistoryIcon from "@mui/icons-material/History";
import StoreIcon from "@mui/icons-material/Store";
import MailIcon from "@mui/icons-material/Mail";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { hexToRgba, mercatoTokens } from "@/lib/theme";
import {
  SELLER_CREATE_STORE_PATH,
  SELLER_INVITATIONS_PATH,
  sellerStorePath,
} from "@/lib/panels";
import { Logo } from "@/components/ui/Logo";
import { useSellerCan, useSellerSignOut } from "@/components/seller/SellerGuards";
import {
  useSellerStoresQuery,
  useSellerSwitchStoreMutation,
} from "@/services/sellerStoresApi";
import { useSellerPendingInvitationsQuery } from "@/services/sellerTeamApi";
import { setActiveStore } from "@/store/sellerStoreSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { normaliseApiError } from "@/types/api";

export const SELLER_SIDEBAR_WIDTH = 272;

interface SellerNavItem {
  label: string;
  suffix: string;
  icon: React.ReactNode;
  perm?: string;
}

const NAV: SellerNavItem[] = [
  {
    label: "Dashboard",
    suffix: "dashboard",
    icon: <GridViewIcon fontSize="small" />,
  },
  {
    label: "Settings",
    suffix: "settings",
    icon: <SettingsIcon fontSize="small" />,
    perm: "store:update",
  },
  {
    label: "Team",
    suffix: "team",
    icon: <GroupIcon fontSize="small" />,
    perm: "staff:invite",
  },
  {
    label: "Roles",
    suffix: "roles",
    icon: <VpnKeyIcon fontSize="small" />,
    perm: "role:read",
  },
  {
    label: "Billing",
    suffix: "billing",
    icon: <AccountBalanceWalletIcon fontSize="small" />,
    perm: "billing:read",
  },
  {
    label: "Activity",
    suffix: "activity",
    icon: <HistoryIcon fontSize="small" />,
    perm: "store:read",
  },
];

function StoreSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams<{ storeId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const active = useAppSelector((s: RootState) => s.sellerStore.active);
  const { data, isLoading } = useSellerStoresQuery();
  const [switchStore, { isLoading: switching }] =
    useSellerSwitchStoreMutation();
  const [error, setError] = useState<string | null>(null);
  const stores = data?.data ?? [];
  const currentId = params?.storeId ?? active?.storeId ?? "";

  if (stores.length === 0 && !isLoading) {
    return (
      <Button
        component={Link}
        href={SELLER_CREATE_STORE_PATH}
        onClick={onNavigate}
        size="small"
        variant="outlined"
        startIcon={<AddIcon fontSize="small" />}
        fullWidth
      >
        Create your store
      </Button>
    );
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="seller-store-switcher-label">Store</InputLabel>
      <Select
        labelId="seller-store-switcher-label"
        label="Store"
        value={stores.some((s) => s.storeId === currentId) ? currentId : ""}
        disabled={isLoading || switching || stores.length === 0}
        onChange={async (e) => {
          const storeId = String(e.target.value);
          if (!storeId || storeId === currentId) return;
          setError(null);
          try {
            const res = await switchStore({ storeId }).unwrap();
            dispatch(
              setActiveStore({
                storeId: res.data.storeId,
                name: res.data.name,
                slug: res.data.slug,
                status: res.data.status,
                roleKey: res.data.roleKey,
                permissions: res.data.permissions,
                subscription: res.data.subscription,
              }),
            );
            onNavigate?.();
            router.push(sellerStorePath(storeId, "dashboard"));
          } catch (err) {
            setError(
              normaliseApiError(err as { status?: number; data?: unknown })
                .message,
            );
          }
        }}
      >
        {stores.map((s) => (
          <MenuItem key={s.storeId} value={s.storeId}>
            {s.name} · {s.roleName}
          </MenuItem>
        ))}
      </Select>
      {error ? (
        <Typography
          role="alert"
          color="error"
          sx={{ fontSize: "0.72rem", mt: 0.5 }}
        >
          {error}
        </Typography>
      ) : null}
    </FormControl>
  );
}

function SellerInvitationsRow({
  onNavigate,
  active,
}: {
  onNavigate?: () => void;
  active: boolean;
}) {
  const { data } = useSellerPendingInvitationsQuery();
  const count = data?.data.length ?? 0;
  return (
    <ListItemButton
      component={Link}
      href={SELLER_INVITATIONS_PATH}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      sx={{ borderRadius: 2.5, cursor: "pointer" }}
    >
      <Box
        aria-hidden
        sx={{
          display: "grid",
          placeItems: "center",
          width: 30,
          height: 30,
          borderRadius: "10px",
          bgcolor: active ? "primary.main" : mercatoTokens.surface2,
          color: active ? "#fff" : "primary.main",
          mr: 1,
        }}
      >
        <MailIcon fontSize="small" />
      </Box>
      <ListItemText
        primary="Invitations"
        slotProps={{
          primary: { sx: { fontSize: "0.84rem", fontWeight: active ? 700 : 600 } },
        }}
      />
      {count > 0 ? (
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
            bgcolor: mercatoTokens.accentSoft,
            color: mercatoTokens.accentStrong,
          }}
        >
          {count}
        </Box>
      ) : null}
    </ListItemButton>
  );
}

function SellerSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? "";
  const { can, roleKey } = useSellerCan();
  const email = useAppSelector((s: RootState) => s.sellerAuth.email);
  const active = useAppSelector((s: RootState) => s.sellerStore.active);
  const displayName = email ? (email.split("@")[0] ?? "Seller") : "Seller";
  const visible = NAV.filter((item) => !item.perm || can(item.perm));

  return (
    <Box
      component="nav"
      aria-label="Seller navigation"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        py: 1.75,
      }}
    >
      <Box sx={{ px: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          component={Link}
          href={
            storeId ? sellerStorePath(storeId, "dashboard") : "/seller/stores"
          }
          aria-label="Seller home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 1,
            py: 0.5,
            textDecoration: "none",
            borderRadius: 2,
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
              Seller console
            </Typography>
          </Box>
        </Box>
        {storeId ? <StoreSwitcher onNavigate={onNavigate} /> : null}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          mt: 2,
          px: 1.25,
        }}
      >
        {storeId ? (
          <List
            disablePadding
            sx={{ display: "flex", flexDirection: "column", gap: 1 / 8 }}
          >
            {visible.map((item) => {
              const href = sellerStorePath(storeId, item.suffix);
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <ListItemButton
                  key={item.suffix}
                  component={Link}
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  sx={{
                    position: "relative",
                    borderRadius: 2.5,
                    px: 1,
                    py: 0.625,
                    gap: 1,
                    color: isActive ? "primary.dark" : "text.secondary",
                    bgcolor: isActive ? mercatoTokens.brandSoft : "transparent",
                    transition: "background-color 200ms ease, color 200ms ease",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: isActive
                        ? mercatoTokens.brandSoft
                        : mercatoTokens.surface2,
                      color: isActive ? "primary.dark" : "text.primary",
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${mercatoTokens.accent}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  {isActive ? (
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
                      bgcolor: isActive
                        ? "primary.main"
                        : mercatoTokens.surface2,
                      color: isActive ? "#fff" : "primary.main",
                      border: 1,
                      borderColor: isActive ? "transparent" : "divider",
                      "& svg": { fontSize: "1.05rem" },
                    }}
                  >
                    {item.icon}
                  </Box>
                  <ListItemText
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "0.84rem",
                          fontWeight: isActive ? 700 : 600,
                        },
                      },
                    }}
                    primary={item.label}
                  />
                </ListItemButton>
              );
            })}
          </List>
        ) : (
          <List disablePadding>
            <ListItemButton
              component={Link}
              href="/seller/stores"
              onClick={onNavigate}
              sx={{ borderRadius: 2.5, cursor: "pointer" }}
            >
              <Box
                aria-hidden
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 30,
                  height: 30,
                  borderRadius: "10px",
                  bgcolor: mercatoTokens.surface2,
                  color: "primary.main",
                  mr: 1,
                }}
              >
                <StoreIcon fontSize="small" />
              </Box>
              <ListItemText
                primary="My stores"
                slotProps={{
                  primary: { sx: { fontSize: "0.84rem", fontWeight: 600 } },
                }}
              />
            </ListItemButton>
            <SellerInvitationsRow
              onNavigate={onNavigate}
              active={pathname === SELLER_INVITATIONS_PATH}
            />
          </List>
        )}
      </Box>
      <Box
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
          {displayName.slice(0, 2).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.8rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {active?.name ?? displayName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              fontSize: "0.68rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {roleKey ? `${roleKey} · ` : ""}
            {email ?? "Seller"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const email = useAppSelector((s: RootState) => s.sellerAuth.email);
  const { signOut, signingOut } = useSellerSignOut();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          lg: "auto minmax(0, 1fr)",
          xs: "minmax(0, 1fr)",
        },
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: -9999,
          top: 8,
          zIndex: 1300,
          background: mercatoTokens.brand,
          color: "#fff",
          padding: "10px 16px",
          borderRadius: 10,
          fontWeight: 600,
        }}
        onFocus={(e) => {
          (e.target as HTMLAnchorElement).style.left = "12px";
        }}
        onBlur={(e) => {
          (e.target as HTMLAnchorElement).style.left = "-9999px";
        }}
      >
        Skip to content
      </a>
      {isDesktop ? (
        <Box
          sx={{
            width: SELLER_SIDEBAR_WIDTH,
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
          <SellerSidebarContent />
        </Box>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
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
          <SellerSidebarContent onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          component="header"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: { xs: 2.5, md: 4 },
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            top: 0,
            zIndex: 1100,
          }}
        >
          {!isDesktop ? (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              Menu
            </Button>
          ) : null}
          <Typography variant="h2" sx={{ fontSize: "1rem" }}>
            Seller console
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 280,
            }}
          >
            {email ?? ""}
          </Typography>
          <IconButton
            size="small"
            aria-label="Sign out of the seller console"
            title="Sign out"
            disabled={signingOut}
            onClick={() => signOut()}
            sx={{ cursor: "pointer" }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box
          component="main"
          id="main-content"
          sx={{
            maxWidth: 1560,
            width: "100%",
            mx: "auto",
            px: { xs: 2.5, md: 4 },
            pt: 1,
            pb: 7,
            flex: 1,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
