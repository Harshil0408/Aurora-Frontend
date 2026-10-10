"use client";

import { useId } from "react";
import { Box } from "@mui/material";
import { mercatoTokens } from "@/lib/theme";

export function Logo({
  size = 38,
  label = "Aurora",
}: {
  size?: number;
  label?: string;
}) {
  const id = useId();
  const gradId = `aurora-g-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      role="img"
      aria-label={label}
      sx={{ width: size, height: size, flex: "none" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mercatoTokens.brand} />
          <stop offset="1" stopColor={mercatoTokens.brandStrong} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
      <path
        d="M9.5 23 L16 9.5 L22.5 23"
        stroke="#ffffff"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.4 18.6 H19.6"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="23.5" cy="8" r="1.6" fill="#ffffff" fillOpacity="0.9" />
    </Box>
  );
}
