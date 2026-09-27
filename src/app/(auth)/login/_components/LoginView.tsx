"use client";

import { Alert } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Enroll2fa } from "@/components/auth/Enroll2fa";
import { LoginForm } from "@/components/auth/LoginForm";
import { Verify2faForm } from "@/components/auth/Verify2faForm";
import { useAppSelector } from "@/store/hooks";
import { DataLoader } from "@/components/ui/DataLoader";

function LoginContent() {
  const stage = useAppSelector((s) => s.auth.stage);
  const channel = useAppSelector((s) => s.auth.pendingChannel);
  const params = useSearchParams();
  const justReset = params.get("reset") === "1";
  const justChanged = params.get("changed") === "1";
  const justDisabled = params.get("disabled") === "1";

  if (stage === "verify") {
    const isEmail = channel === "email_otp";
    return (
      <AuthCard
        eyebrow="Step 2 of 2 · Two-factor"
        title={isEmail ? "Check your email" : "Check your authenticator"}
        description={
          isEmail
            ? "Enter the 6-digit code we emailed on sign-in to finish."
            : "Enter the code to finish signing in."
        }
      >
        <Verify2faForm />
      </AuthCard>
    );
  }
  if (stage === "enroll" || stage === "confirm-enroll") {
    return (
      <AuthCard
        eyebrow="First sign in · Two-factor"
        title="Link your authenticator"
        description="Optional but recommended — link an authenticator to harden this admin account."
      >
        <Enroll2fa />
      </AuthCard>
    );
  }
  return (
    <AuthCard
      eyebrow="Aurora admin"
      title="Welcome back"
      description="Sign in with your admin credentials to continue. If two-factor is on, we will ask for a code next."
    >
      {justReset ? (
        <Alert severity="success" role="status">
          Password reset. Sign in with your new password.
        </Alert>
      ) : null}
      {justChanged ? (
        <Alert severity="success" role="status">
          Password changed. Sign in again.
        </Alert>
      ) : null}
      {justDisabled ? (
        <Alert severity="info" role="status">
          Two-factor was turned off and all sessions were revoked. Sign in
          again — no code needed now.
        </Alert>
      ) : null}
      <LoginForm />
    </AuthCard>
  );
}

export function LoginView() {
  return (
    <Suspense fallback={<DataLoader label="Loading sign in" />}>
      <LoginContent />
    </Suspense>
  );
}
