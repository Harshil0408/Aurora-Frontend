"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Button } from "@mui/material";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/ui/controls";
import { ButtonLoader } from "@/components/ui/Loaders";
import { DataLoader } from "@/components/ui/DataLoader";
import { useSellerLoginMutation } from "@/services/sellerAuthApi";
import { setSellerSession } from "@/store/sellerAuthSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePostAuthRedirect } from "@/components/seller/usePostAuthRedirect";
import { sellerLoginSchema } from "@/lib/validations";
import { normaliseApiError } from "@/types/api";
import {
  SELLER_CREATE_STORE_PATH,
  SELLER_REGISTER_PATH,
} from "@/lib/panels";

function SellerLoginForm() {
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const continuePostAuth = usePostAuthRedirect();
  const [login, { isLoading }] = useSellerLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const registered = params.get("registered") === "1";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const parsed = sellerLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key === "email" || key === "password")
          fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      const res = await login(parsed.data).unwrap();
      dispatch(
        setSellerSession({
          accessToken: res.data.accessToken,
          expiresInSeconds: res.data.expiresInSeconds,
          email: res.data.user.email,
        }),
      );
      // Join intent beats everything: stashed invite → accept, else pending
      // inbox → last-used dashboard → create-store (never strand invitees).
      setResolving(true);
      await continuePostAuth(params.get("next"));
    } catch (err) {
      setResolving(false);
      setApiError(
        normaliseApiError(err as { status?: number; data?: unknown }).message,
      );
    }
  }

  return (
    <Box
      component="form"
      onSubmit={submit}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {registered ? (
        <Alert severity="success" role="status">
          Account created — sign in to open your seller workspace.
        </Alert>
      ) : null}
      {apiError ? (
        <Alert severity="error" role="alert">
          {apiError}
        </Alert>
      ) : null}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={Boolean(errors.email)}
        helperText={errors.email}
        hint="The email you registered with."
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={Boolean(errors.password)}
        helperText={errors.password}
        hint="5 wrong passwords locks the account for 15 minutes."
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isLoading || resolving}
        sx={{ mt: 0.5 }}
      >
        {isLoading || resolving ? (
          <ButtonLoader label={resolving ? "Opening your workspace" : "Signing in"} />
        ) : (
          "Sign in"
        )}
      </Button>
      <Alert severity="info" sx={{ mt: 0.5 }}>
        Joining with an invite link? Sign in with the invited email — the
        invitation is accepted automatically. New to selling?{" "}
        <Link href={SELLER_REGISTER_PATH}>Create a seller account</Link> — then{" "}
        <Link href={SELLER_CREATE_STORE_PATH}>open your first store</Link>.
      </Alert>
    </Box>
  );
}

function LoginContent() {
  return (
    <AuthCard
      eyebrow="Aurora seller"
      title="Welcome back"
      description="Sign in to manage your stores, team, and billing. Sessions last 5 minutes and refresh silently — sign out everywhere from any device if you lose one."
    >
      <SellerLoginForm />
    </AuthCard>
  );
}

export function SellerLoginView() {
  return (
    <Suspense fallback={<DataLoader label="Loading seller sign in" />}>
      <LoginContent />
    </Suspense>
  );
}
