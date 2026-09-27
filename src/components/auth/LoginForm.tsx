"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/services/authApi";
import { setPending, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { loginSchema } from "@/lib/validations";
import { normaliseApiError } from "@/types/api";
import { ButtonLoader } from "@/components/ui/Loaders";

/**
 * Step 1: email + password.
 * Branches on requires2fa — false → direct session + redirect,
 * true → pendingToken + channel (totp | email_otp) → verify stage.
 * Generic error copy (no enumeration).
 */
export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setFieldErrors({});
    try {
      const res = await login({
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
      }).unwrap();
      if (res.data.requires2fa === false) {
        dispatch(
          setSession({
            accessToken: res.data.accessToken,
            expiresInSeconds: res.data.expiresInSeconds,
          }),
        );
        const next =
          new URLSearchParams(window.location.search).get("next") ||
          "/dashboard";
        router.replace(next);
        return;
      }
      dispatch(
        setPending({
          pendingToken: res.data.pendingToken,
          expiresInSeconds: res.data.expiresInSeconds,
          email: parsed.data.email.toLowerCase(),
          channel: res.data.channel,
        }),
      );
    } catch (err) {
      const n = normaliseApiError(
        (err as { status?: number; data?: unknown })?.data
          ? {
              status: (err as { status?: number }).status,
              data: (err as { data?: unknown }).data,
            }
          : err,
      );
      setApiError(
        n.code === "RATE_LIMITED"
          ? "Too many attempts. Try again in a few minutes."
          : "Invalid email or password.",
      );
    }
  };

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {apiError ? (
        <Alert severity="error" role="alert">
          {apiError}
        </Alert>
      ) : null}
      <TextField
        label="Work email"
        type="email"
        autoComplete="username"
        autoFocus
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={Boolean(fieldErrors.email)}
        helperText={fieldErrors.email}
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={Boolean(fieldErrors.password)}
        helperText={fieldErrors.password}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? <ButtonLoader label="Signing in" /> : "Sign in"}
      </Button>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        <MuiLink
          component={Link}
          href="/forgot-password"
          underline="hover"
          color="primary"
        >
          Forgot your password?
        </MuiLink>
      </Typography>
    </Box>
  );
}
