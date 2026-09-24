"use client";

import { useState } from "react";
import { Alert, Box, Button, TextField } from "@mui/material";
import { useForgotPasswordMutation } from "@/services/authApi";
import { forgotPasswordSchema } from "@/lib/validations";
import { ButtonLoader } from "@/components/ui/Loaders";

export function ForgotPasswordForm() {
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.email?.[0]);
      return;
    }
    setFieldError(undefined);
    try {
      await forgot({ email: parsed.data.email.toLowerCase() }).unwrap();
    } finally {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <Alert severity="success" role="status">
        If the account exists, a reset link was sent. Check your inbox — the
        link expires in 1 hour.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Work email"
        type="email"
        autoComplete="username"
        autoFocus
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={Boolean(fieldError)}
        helperText={fieldError}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? <ButtonLoader label="Sending" /> : "Send reset link"}
      </Button>
    </Box>
  );
}
