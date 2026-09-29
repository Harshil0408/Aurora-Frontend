"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import ShieldIcon from "@mui/icons-material/Shield";
import { mercatoTokens } from "@/lib/theme";
import { useMeQuery } from "@/services/authApi";
import { logoutAllThunk, logoutThunk } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const PAGE_META: Record<string, { title: string; blurb: string }> = {
  "/dashboard": { title: "Dashboard", blurb: "Live overview" },
  "/admins": { title: "Admins", blurb: "Team access & roles" },
  "/roles": { title: "Roles & Permissions", blurb: "What each role can do" },
  "/activity": { title: "Activity Log", blurb: "Audit trail" },
  "/sessions": { title: "Sessions", blurb: "Active sign-ins" },
  "/security": { title: "Security", blurb: "Password & 2FA" },
  "/themes": { title: "Themes", blurb: "Brand appearance" },
};

function pageMeta(pathname: string | null): { title: string; blurb: string } {
  if (pathname != null) {
    const exact = PAGE_META[pathname];
    if (exact) return exact;
    const segment = pathname.split("/").filter(Boolean).pop();
    if (segment) {
      const title = segment
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
      return { title, blurb: "Aurora console" };
    }
  }
  return { title: "Dashboard", blurb: "Live overview" };
}

const notifications = [
  { title: "Maple & Moss Candles applied to sell", time: "2 min ago" },
  { title: "Order #48213 flagged for payment check", time: "9 min ago" },
  { title: "Payout batch of $86,420 sent to 214 sellers", time: "26 min ago" },
];

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchRef = useRef<HTMLInputElement>(null);
  const [bellAnchor, setBellAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [allRead, setAllRead] = useState(false);
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: meData } = useMeQuery(undefined, { skip: !isAuthenticated });

  const meta = pageMeta(pathname);
  const unread = allRead ? 0 : notifications.length;
  const meEmail = meData?.data.email ?? pendingEmail ?? null;
  const primaryRole = meData?.data.roles[0] ?? "Super Admin";
  const displayName = meEmail ? (meEmail.split("@")[0] ?? "Admin") : "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target != null && /^(INPUT|TEXTAREA)$/.test(target.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async (global: boolean) => {
    setProfileAnchor(null);
    await dispatch(global ? logoutAllThunk() : logoutThunk());
    router.replace("/login");
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          height: 60,
          px: { xs: 1.5, sm: 2.5 },
          minWidth: 0,
        }}
      >
        {/* Left — nav trigger + current section */}
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
                fontSize: "0.64rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.disabled",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              Aurora · {meta.title}
            </Typography>
            <Typography
              data-testid="topbar-title"
              sx={{
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta.title}
            </Typography>
          </Box>
        </Box>

        {/* Center — search */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: { xs: "none", sm: "flex" },
            justifyContent: "center",
          }}
        >
          <Box sx={{ position: "relative", width: "100%", maxWidth: 440 }}>
            <TextField
              size="small"
              inputRef={searchRef}
              type="search"
              placeholder={`Search ${meta.title.toLowerCase()}…`}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "text.disabled" }}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: "0.84rem",
                    bgcolor: "action.hover",
                    "& fieldset": { borderColor: "transparent" },
                  },
                },
                htmlInput: {
                  "aria-label": "Search",
                  style: { height: 34, paddingTop: 0, paddingBottom: 0, paddingRight: 40 },
                },
              }}
            />
            <Box
              component="kbd"
              aria-hidden
              sx={{
                position: "absolute",
                right: 10,
                top: 8,
                px: 0.875,
                py: 0.125,
                border: 1,
                borderColor: "divider",
                borderRadius: "6px",
                bgcolor: "background.paper",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              /
            </Box>
          </Box>
        </Box>

        {/* Right — status, notifications, profile */}
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
          <Box
            sx={{
              display: { xs: "none", md: "inline-flex" },
              alignItems: "center",
              gap: 1,
              flex: "none",
              px: 1.25,
              height: 32,
              borderRadius: 9999,
              bgcolor: mercatoTokens.goodSoft,
              color: mercatoTokens.good,
              fontSize: "0.74rem",
              fontWeight: 800,
            }}
            aria-label="All systems live"
          >
            <Box
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: mercatoTokens.good,
              }}
            />
            Live
          </Box>

          <IconButton
            aria-label={
              unread > 0
                ? `Notifications, ${unread} unread`
                : "Notifications, all read"
            }
            aria-haspopup="menu"
            onClick={(e) => setBellAnchor(e.currentTarget)}
            sx={{ width: 36, height: 36, borderRadius: 2, flex: "none" }}
          >
            <NotificationsIcon fontSize="small" />
            {unread > 0 ? (
              <Box
                component="span"
                aria-hidden
                sx={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  minWidth: 16,
                  height: 16,
                  px: 0.375,
                  borderRadius: 9999,
                  bgcolor: "error.main",
                  color: "#fff",
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  border: "2px solid",
                  borderColor: "background.paper",
                }}
              >
                {unread}
              </Box>
            ) : null}
          </IconButton>
        <Menu
          anchorEl={bellAnchor}
          open={Boolean(bellAnchor)}
          onClose={() => setBellAnchor(null)}
          aria-label="Notifications"
          slotProps={{ paper: { sx: { width: 340, maxWidth: "calc(100vw - 32px)", p: 0 } } }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", flex: 1 }}>
              Notifications
            </Typography>
            {unread > 0 ? (
              <Button
                size="small"
                onClick={() => setAllRead(true)}
                sx={{ fontSize: "0.74rem", minHeight: 0 }}
              >
                Mark all read
              </Button>
            ) : null}
          </Box>
          <Divider />
          {notifications.map((n) => (
            <MenuItem
              key={n.title}
              onClick={() => setBellAnchor(null)}
              sx={{ alignItems: "flex-start", gap: 1, py: 1.25, whiteSpace: "normal" }}
            >
              {!allRead ? (
                <Box
                  aria-hidden
                  sx={{
                    mt: 0.625,
                    width: 8,
                    height: 8,
                    flex: "none",
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                  }}
                />
              ) : null}
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.84rem", whiteSpace: "normal" }}>
                  {n.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ my: 1.5, display: { xs: "none", sm: "block" } }}
        />

        <Button
          aria-haspopup="menu"
          aria-label={`Account menu for ${displayName}`}
          onClick={(e) => setProfileAnchor(e.currentTarget)}
          color="inherit"
          sx={{
            flex: "none",
            minWidth: 0,
            gap: 1,
            p: 0.5,
            pr: { xs: 0.5, sm: 1 },
            borderRadius: 9999,
            textTransform: "none",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: "0.7rem",
              fontWeight: 800,
              bgcolor: "primary.main",
            }}
          >
            {initials}
          </Avatar>
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              minWidth: 0,
              maxWidth: 120,
              textAlign: "left",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 700,
                lineHeight: 1.2,
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
                fontSize: "0.66rem",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {primaryRole}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon
            fontSize="small"
            sx={{ color: "text.disabled", display: { xs: "none", sm: "block" } }}
          />
        </Button>
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          aria-label="Account menu"
          slotProps={{ paper: { sx: { width: 280, maxWidth: "calc(100vw - 32px)", p: 0 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.88rem",
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
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meEmail ?? "Administrator"}
            </Typography>
            <Chip
              label={primaryRole}
              size="small"
              sx={{
                mt: 1,
                height: 22,
                fontSize: "0.68rem",
                bgcolor: "primary.light",
                color: "primary.dark",
              }}
            />
          </Box>
          <Divider />
          <MenuItem
            component={Link}
            href="/security"
            onClick={() => setProfileAnchor(null)}
          >
            <ShieldIcon fontSize="small" style={{ marginRight: 10 }} />
            Security settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => signOut(false)}>
            <LogoutIcon fontSize="small" style={{ marginRight: 10 }} />
            Sign out this session
          </MenuItem>
          <MenuItem onClick={() => signOut(true)}>
            <LogoutIcon fontSize="small" style={{ marginRight: 10 }} />
            Sign out everywhere
          </MenuItem>
        </Menu>
        </Box>
      </Box>
    </Box>
  );
}
