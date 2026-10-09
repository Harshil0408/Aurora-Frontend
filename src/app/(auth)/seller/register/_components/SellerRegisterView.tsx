"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Button } from "@mui/material";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/ui/controls";
import { ButtonLoader } from "@/components/ui/Loaders";
import { DataLoader } from "@/components/ui/DataLoader";
import { useSellerRegisterMutation } from "@/services/sellerAuthApi";
import { setSellerSession } from "@/store/sellerAuthSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePostAuthRedirect } from "@/components/seller/usePostAuthRedirect";
import { sellerRegisterSchema } from "@/lib/validations";
import { normaliseApiError } from "@/types/api";
import { SELLER_LOGIN_PATH } from "@/lib/panels";

function SellerRegisterForm() {
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const continuePostAuth = usePostAuthRedirect();
  const [register, { isLoading }] = useSellerRegisterMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const parsed = sellerRegisterSchema.safeParse({
      email,
      password,
      name: name.trim() ? name.trim() : undefined,
    });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key === "email" || key === "password" || key === "name")
          fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      const res = await register(parsed.data).unwrap();
      dispatch(
        setSellerSession({
          accessToken: res.data.accessToken,
          expiresInSeconds: res.data.expiresInSeconds,
          email: res.data.user.email,
        }),
      );
      // Joining via invite link? Registration alone is enough — the stashed
      // token auto-accepts next, so invitees never land on create-store.
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
        hint="Used for sign-in and team invitations."
      />
      <FormField
        label="Display name (optional)"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={Boolean(errors.name)}
        helperText={errors.name}
        hint="Defaults to the part before @ in your email."
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={Boolean(errors.password)}
        helperText={errors.password}
        hint="At least 12 characters. Your account is usable immediately."
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isLoading || resolving}
        sx={{ mt: 0.5 }}
      >
        {isLoading || resolving ? (
          <ButtonLoader
            label={resolving ? "Opening your workspace" : "Creating account"}
          />
        ) : (
          "Create seller account"
        )}
      </Button>
      <Alert severity="info" sx={{ mt: 0.5 }}>
        Invited to a store? Use the invited email — one account per human, and
        the invitation is accepted automatically. Already selling?{" "}
        <Link href={SELLER_LOGIN_PATH}>Sign in</Link> instead.
      </Alert>
    </Box>
  );
}

export function SellerRegisterView() {
  return (
    <Suspense fallback={<DataLoader label="Loading seller sign up" />}>
      <AuthCard
        eyebrow="Aurora seller"
        title="Start selling"
        description="One account, many stores. Register once, then create your first store — it opens on a 14-day Starter trial, no card needed."
      >
        <SellerRegisterForm />
      </AuthCard>
    </Suspense>
  );
}
