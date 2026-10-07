"use client";

import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Logo } from "@/components/ui/Logo";

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      sx={{ width: size, height: size, flex: "none" }}
    >
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </Box>
  );
}

function StoreIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      sx={{ width: 18, height: 18, flex: "none" }}
    >
      <path d="M4 9 5.5 4h13L20 9" />
      <path d="M4 9h16v2.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0A2.5 2.5 0 0 1 4 11.5V9Z" />
      <path d="M5.5 13.5V19h13v-5.5" />
      <path d="M9.5 19v-4h5v4" />
    </Box>
  );
}

function UsersIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      sx={{ width: 18, height: 18, flex: "none" }}
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 5.8" />
      <path d="M17.5 14.5c2.1.7 3.5 2.6 3.5 5" />
    </Box>
  );
}

function ShieldCheckIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      sx={{ width: 18, height: 18, flex: "none" }}
    >
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 7.4 7 9.3 4.1-1.9 7-5 7-9.3V5.8L12 3Z" />
      <path d="m9.2 11.6 2 2 3.6-4" />
    </Box>
  );
}

const PANEL_POINTS = [
  {
    icon: <StoreIcon />,
    title: "Orders, products, customers",
    sub: "Every sale and catalogue change in one place.",
  },
  {
    icon: <UsersIcon />,
    title: "Roles with clear limits",
    sub: "Give each teammate exactly the access they need.",
  },
  {
    icon: <ShieldCheckIcon />,
    title: "Two-factor on every login",
    sub: "Authenticator or email code — your call.",
  },
];

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
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* Left — brand panel. Compact strip on mobile, full story on desktop. */}
      <Box
        sx={(t) => ({
          position: "relative",
          overflow: "clip",
          flex: "none",
          width: { xs: "100%", md: 440, lg: 540 },
          minHeight: { xs: "auto", md: "100dvh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: { xs: "flex-start", md: "center" },
          gap: { xs: 2, md: 4 },
          px: { xs: 2.5, md: 5 },
          py: { xs: 3, md: 6 },
          color: t.palette.primary.contrastText,
          background: `linear-gradient(165deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 62%, ${t.palette.info.main} 135%)`,
        })}
      >
        {/* Decorative rings + dot field, all white-on-brand. */}
        <Box
          aria-hidden="true"
          component="svg"
          viewBox="0 0 400 400"
          sx={{
            position: "absolute",
            bottom: -140,
            right: -120,
            width: { xs: 280, md: 400 },
            height: { xs: 280, md: 400 },
            pointerEvents: "none",
            color: "#ffffff",
            opacity: 0.16,
          }}
        >
          {[180, 140, 100, 60].map((r, i) => (
            <circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={i === 3 ? 2 : 1.4}
              strokeDasharray={i === 1 ? "4 8" : undefined}
            />
          ))}
        </Box>
        <Box
          aria-hidden="true"
          component="svg"
          viewBox="0 0 220 120"
          sx={{
            position: "absolute",
            top: { xs: 12, md: 32 },
            right: { xs: 16, md: 32 },
            width: { xs: 120, md: 180 },
            pointerEvents: "none",
            color: "#ffffff",
            opacity: 0.28,
            display: { xs: "none", sm: "block" },
          }}
        >
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={12 + col * 22}
                cy={12 + row * 22}
                r={1.8}
                fill="currentColor"
              />
            )),
          )}
        </Box>
        {/* Diagonal sheen across the top. */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 28%, transparent 45%)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Logo size={40} />
          <Box>
            <Typography
              sx={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.15rem",
                lineHeight: 1.1,
                color: "inherit",
              }}
            >
              Aurora
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: alpha("#ffffff", 0.78) }}
            >
              Admin console
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: "relative" }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: { xs: "1.25rem", md: "1.9rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: "inherit",
            }}
          >
            Run your entire store from one secure console.
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              lineHeight: 1.55,
              color: alpha("#ffffff", 0.82),
              display: { xs: "none", sm: "block" },
            }}
          >
            Sign in to manage orders, products, teammates and settings —
            guarded by two-factor authentication on every account.
          </Typography>
        </Box>

        <Box
          component="ul"
          sx={{
            position: "relative",
            m: 0,
            p: 0,
            listStyle: "none",
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          {PANEL_POINTS.map((p) => (
            <Box
              component="li"
              key={p.title}
              sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  bgcolor: alpha("#ffffff", 0.16),
                  border: `1px solid ${alpha("#ffffff", 0.28)}`,
                }}
              >
                {p.icon}
              </Box>
              <Box sx={{ pt: 0.25 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {p.title}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.8rem", color: alpha("#ffffff", 0.75) }}
                >
                  {p.sub}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            position: "relative",
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
            mt: "auto",
            pt: 4,
            fontSize: "0.78rem",
            fontWeight: 600,
            color: alpha("#ffffff", 0.8),
          }}
        >
          <LockIcon />
          Protected by two-factor authentication
        </Box>
      </Box>

      {/* Right — form side. */}
      <Box
        sx={(t) => ({
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          backgroundImage: [
            `radial-gradient(560px 380px at 85% 8%, ${alpha(t.palette.primary.main, 0.08)}, transparent 70%)`,
            `radial-gradient(480px 360px at 10% 95%, ${alpha(t.palette.info.main, 0.07)}, transparent 70%)`,
          ].join(", "),
          px: 2.5,
          py: { xs: 4, md: 6 },
        })}
      >
        {/* Faint dot texture so the light side is not flat. */}
        <Box
          aria-hidden="true"
          sx={(t) => ({
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.55,
            backgroundImage: `radial-gradient(${alpha(t.palette.text.primary, 0.12)} 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(560px 420px at 50% 45%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(560px 420px at 50% 45%, black 20%, transparent 75%)",
          })}
        />
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <Paper
            component="main"
            sx={{
              width: "100%",
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
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
          <Typography
            component="p"
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 2,
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              fontWeight: 600,
            }}
          >
            <LockIcon />
            Protected by two-factor authentication
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
