"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Container,
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
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import CategoryIcon from "@mui/icons-material/Category";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HistoryIcon from "@mui/icons-material/History";
import StoreIcon from "@mui/icons-material/Store";
import MailIcon from "@mui/icons-material/Mail";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";
import { mercatoTokens } from "@/lib/theme";
import {
  SELLER_CREATE_STORE_PATH,
  SELLER_HOME_PATH,
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

/** Mirrors the admin rail — same width, density, and interaction language. */
export const SELLER_SIDEBAR_WIDTH = 264;

interface SellerNavItem {
  label: string;
  suffix: string;
  icon: React.ReactNode;
  perm?: string;
  badge?: string;
}

const SELLER_SECTIONS: { title: string; items: SellerNavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        suffix: "dashboard",
        icon: <GridViewIcon fontSize="small" />,
      },
    ],
  },
  {
    title: "Store",
    items: [
  {
    label: "Media",
    suffix: "media",
    icon: <PhotoLibraryIcon fontSize="small" />,
    perm: "media:view",
  },
  {
    label: "Categories",
    suffix: "categories",
    icon: <CategoryIcon fontSize="small" />,
    perm: "category:view",
  },
      {
        label: "Settings",
        suffix: "settings",
        icon: <SettingsIcon fontSize="small" />,
        perm: "store:update",
      },
    ],
  },
  {
    title: "Team & Access",
    items: [
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
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Billing",
        suffix: "billing",
        icon: <AccountBalanceWalletIcon fontSize="small" />,
        perm: "billing:read",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Activity",
        suffix: "activity",
        icon: <HistoryIcon fontSize="small" />,
        perm: "store:read",
      },
    ],
  },
];

function BrandMark({ href }: { href: string }) {
  return (
    <Box
      component={Link}
      href={href}
      aria-label="Aurora seller home"
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
          Seller console
        </Typography>
      </Box>
    </Box>
  );
}

function SellerNavRow({
  label,
  href,
  icon,
  active,
  badge,
  onNavigate,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: string;
  onNavigate?: () => void;
}) {
  return (
    <ListItemButton
      component={Link}
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
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
          transition:
            "background-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms cubic-bezier(0.16,1,0.3,1)",
          "& svg": { fontSize: "1rem" },
        }}
      >
        {icon}
      </Box>
      <ListItemText
        primary={label}
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
      {badge ? (
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
            bgcolor: "primary.light",
            color: "primary.dark",
            border: 1,
            borderColor: "transparent",
          }}
        >
          {badge}
        </Box>
      ) : null}
    </ListItemButton>
  );
}

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

function SellerSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? "";
  const { can, roleKey } = useSellerCan();
  const email = useAppSelector((s: RootState) => s.sellerAuth.email);
  const active = useAppSelector((s: RootState) => s.sellerStore.active);
  const { data: invitationsData } = useSellerPendingInvitationsQuery();
  const invitationCount = invitationsData?.data.length ?? 0;
  const displayName = email ? (email.split("@")[0] ?? "Seller") : "Seller";
  const initials = displayName.slice(0, 2).toUpperCase();
  const homeHref = storeId
    ? sellerStorePath(storeId, "dashboard")
    : SELLER_HOME_PATH;

  const visibleSections = SELLER_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.perm || can(item.perm)),
  })).filter((section) => section.items.length > 0);

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
        <BrandMark href={homeHref} />
        {storeId ? <StoreSwitcher onNavigate={onNavigate} /> : null}
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
        {storeId ? (
          visibleSections.map((section) => (
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
                  const href = sellerStorePath(storeId, item.suffix);
                  const activeRow =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <SellerNavRow
                      key={item.suffix}
                      label={item.label}
                      href={href}
                      icon={item.icon}
                      active={activeRow}
                      onNavigate={onNavigate}
                    />
                  );
                })}
              </List>
            </Box>
          ))
        ) : (
          <Box component="section" aria-label="Workspace" sx={{ px: 1.25 }}>
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
              Workspace
            </Typography>
            <List
              disablePadding
              sx={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <SellerNavRow
                label="My stores"
                href={SELLER_HOME_PATH}
                icon={<StoreIcon fontSize="small" />}
                active={pathname === SELLER_HOME_PATH}
                onNavigate={onNavigate}
              />
              <SellerNavRow
                label="Invitations"
                href={SELLER_INVITATIONS_PATH}
                icon={<MailIcon fontSize="small" />}
                active={pathname === SELLER_INVITATIONS_PATH}
                badge={
                  invitationCount > 0 ? String(invitationCount) : undefined
                }
                onNavigate={onNavigate}
              />
            </List>
          </Box>
        )}
      </Box>
      <Box
        aria-label={email ? `Signed in as ${email}` : "Signed in as guest"}
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
            {active?.name ?? displayName}
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
            {roleKey ? `${roleKey} · ` : ""}
            {email ?? "Seller"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function SellerTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const email = useAppSelector((s: RootState) => s.sellerAuth.email);
  const { signOut, signingOut } = useSellerSignOut();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          height: 64,
          px: { xs: 1.5, sm: 2.5 },
          minWidth: 0,
          maxWidth: 1360,
          mx: "auto",
          width: "100%",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <IconButton
            aria-label="Open navigation"
            onClick={onMenuClick}
            sx={{
              display: { lg: "none" },
              width: 36,
              height: 36,
              borderRadius: 2,
              flex: "none",
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              aria-hidden
              sx={{
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              Aurora · Seller console
            </Typography>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Seller console
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 280,
              display: { xs: "none", sm: "block" },
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
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              flex: "none",
              cursor: "pointer",
              transition:
                "background-color 200ms cubic-bezier(0.16,1,0.3,1), transform 150ms cubic-bezier(0.16,1,0.3,1)",
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          borderRadius: 8,
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
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <SellerTopbar onMenuClick={() => setMobileOpen(true)} />
        <Container
          component="main"
          id="main-content"
          maxWidth={false}
          sx={{
            maxWidth: 1360,
            mx: "auto",
            px: { xs: 2, md: 3 },
            pt: 3,
            pb: 8,
            flex: 1,
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
