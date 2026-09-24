'use client';

import { useState } from 'react';
import { Alert, Box, Button, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useResetPasswordMutation } from '@/services/authApi';
import { resetPasswordSchema } from '@/lib/validations';
import { normaliseApiError } from '@/types/api';
import { ButtonLoader } from '@/components/ui/Loaders';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [reset, { isLoading }] = useResetPasswordMutation();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = resetPasswordSchema.safeParse({ newPassword: pw, confirmPassword: confirm });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.newPassword?.[0] ?? parsed.error.flatten().fieldErrors.confirmPassword?.[0]);
      return;
    }
    setFieldError(undefined);
    try {
      await reset({ token, newPassword: parsed.data.newPassword }).unwrap();
      router.replace('/login?reset=1');
    } catch (err) {
      const n = normaliseApiError({ status: (err as { status?: number })?.status, data: (err as { data?: unknown })?.data });
      setApiError(n.status === 400 ? 'This link is invalid, expired, or the password was used recently. Request a new link.' : n.message);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {apiError ? <Alert severity="error" role="alert">{apiError}</Alert> : null}
      <TextField
        label="New password (12+ characters)"
        type="password"
        autoComplete="new-password"
        autoFocus
        required
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        error={Boolean(fieldError)}
        helperText={fieldError ?? 'Min 12 characters. Last 5 passwords cannot be reused.'}
        fullWidth
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={isLoading || !token} aria-busy={isLoading}>
        {isLoading ? <ButtonLoader label="Resetting" /> : 'Reset password'}
      </Button>
    </Box>
  );
}
