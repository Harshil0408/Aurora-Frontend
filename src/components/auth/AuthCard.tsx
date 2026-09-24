"use client";

import { Box, Paper, Typography } from "@mui/material";
import { Logo } from "@/components/ui/Logo";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2.5,
        py: 6,
      }}
    >
      <Paper
        component="main"
        sx={{
          width: "100%",
          maxWidth: 480,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Logo size={38} />
          <Box>
            <Typography
              sx={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.1,
              }}
            >
              Aurora
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Admin console
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography
            variant="caption"
            component="p"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "primary.main",
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h1" component="h1" sx={{ mt: 1 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        </Box>
        {children}
      </Paper>
    </Box>
  );
}
