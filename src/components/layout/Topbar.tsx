"use client";

import { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";

/** Sample notifications for the preview — wire to a notifications API later. */
const notifications = [
  { title: "Maple & Moss Candles applied to sell", time: "2 min ago" },
  { title: "Order #48213 flagged for payment check", time: "9 min ago" },
  { title: "Payout batch of $86,420 sent to 214 sellers", time: "26 min ago" },
];

/**
 * Sticky blurred topbar (reference): menu button, search with "/" shortcut,
 * notification bell with unread pip.
 */
export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

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

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(242, 240, 251, 0.84)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        backgroundImage: "none",
        boxShadow: "none",
        border: "none",
      }}
    >
      <Toolbar
        sx={{
          gap: 1.5,
          px: { xs: 2.5, md: 4 },
          maxHeight: { xs: 12, sm: 16 },
          py: 0.75,
        }}
      >
        <IconButton
          edge="start"
          aria-label="Open navigation"
          onClick={onMenuClick}
          sx={{
            display: { lg: "none" },
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 2.5,
            width: 38,
            height: 38,
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Box sx={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <TextField
            size="small"
            inputRef={searchRef}
            type="search"
            placeholder="Search sellers, orders, products…"
            aria-label="Search sellers, orders and products"
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
                sx: { fontSize: "0.86rem" },
              },
              htmlInput: {
                style: {
                  height: 36,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 44,
                },
              },
            }}
          />
          <Box
            component="kbd"
            aria-hidden
            sx={{
              position: "absolute",
              right: 10,
              top: 7,
              px: 1,
              py: 0.25,
              border: 1,
              borderColor: "divider",
              borderRadius: "7px",
              bgcolor: "action.hover",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            /
          </Box>
        </Box>
        <Box sx={{ flex: 1 }} />
        <IconButton
          aria-label="Notifications, 3 unread"
          aria-haspopup="menu"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 2.5,
            width: 38,
            height: 38,
          }}
        >
          <NotificationsIcon fontSize="small" />
          <Box
            component="span"
            aria-hidden
            sx={{
              position: "absolute",
              top: 8,
              right: 9,
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor: "error.main",
              border: "2px solid #fff",
            }}
          />
        </IconButton>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          aria-label="Notifications"
        >
          {notifications.map((n) => (
            <MenuItem
              key={n.title}
              onClick={() => setAnchor(null)}
              sx={{ maxWidth: 320 }}
            >
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, whiteSpace: "normal" }}
                >
                  {n.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
