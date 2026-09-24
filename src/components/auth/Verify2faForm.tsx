'use client';

import { useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useVerify2faMutation } from '@/services/authApi';
import { resetLoginFlow, setSession, setStage } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { normaliseApiError } from '@/types/api';
import { ButtonLoader } from '@/components/ui/Loaders';

/** Step 2: TOTP or recovery code → accessToken (session issued, cookie set). */
export function Verify2faForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pendingToken = useAppSelector((s) => s.auth.pendingToken);
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const [verify, { isLoading }] = useVerify2faMutation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pendingToken) {
      setError('Your sign-in session expired. Start again.');
      return;
    }
    const trimmed = code.trim().replace(/\s/g, '');
    if (!trimmed) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    try {
      const res = await verify({ pendingToken, code: trimmed }).unwrap();
      dispatch(setSession({ accessToken: res.data.accessToken, expiresInSeconds: res.data.expiresInSeconds }));
      const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
      router.replace(next);
    } catch (err) {
      const n = normaliseApiError({ status: (err as { status?: number })?.status, data: (err as { data?: unknown })?.data });
      setError(n.code === 'RATE_LIMITED' ? 'Too many attempts. Wait a few minutes and retry.' : 'That code did not work. Check your authenticator and retry.');
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
      {pendingEmail ? (
        <Typography variant="body1" color="text.secondary">
          Verifying identity for <strong style={{ color: 'inherit' }}>{pendingEmail}</strong>. Codes refresh every 30 seconds.
        </Typography>
      ) : null}
      <TextField
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        fullWidth
        slotProps={{ htmlInput: { maxLength: 32 } }}
      />
      <Button type="submit" variant="contained" size="large" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? <ButtonLoader label="Verifying" /> : 'Verify and sign in'}
      </Button>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="text" onClick={() => dispatch(setStage('enroll'))}>
          Set up authenticator instead
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="text" color="inherit" onClick={() => dispatch(resetLoginFlow())}>
          Back
        </Button>
      </Box>
    </Box>
  );
}
