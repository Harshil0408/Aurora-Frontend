"use client";

import { useState } from "react";
import { Box, Container } from "@mui/material";
import { mercatoTokens } from "@/lib/theme";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
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
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <Container
          component="main"
          id="main-content"
          maxWidth={false}
          sx={{ maxWidth: 1360, mx: "auto", px: { xs: 2, md: 3 }, pt: 3, pb: 8, flex: 1 }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
