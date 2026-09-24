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
  const params = useSearchParams();
  const justReset = params.get("reset") === "1";
  const justChanged = params.get("changed") === "1";

  if (stage === "verify") {
    return (
      <AuthCard
        eyebrow="Step 2 of 2 · Two-factor"
        title="Check your authenticator"
        description="Enter the code to finish signing in."
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
        description="Two-factor is mandatory for admins."
      >
        <Enroll2fa />
      </AuthCard>
    );
  }
  return (
    <AuthCard
      eyebrow="Aurora admin"
      title="Welcome back"
      description="Sign in with your admin credentials to continue."
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
      <LoginForm />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<DataLoader label="Loading sign in" />}>
      <LoginContent />
    </Suspense>
  );
}
