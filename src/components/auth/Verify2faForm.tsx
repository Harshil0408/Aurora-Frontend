'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import PhonelinkLockIcon from '@mui/icons-material/PhonelinkLock';
import { useRouter } from 'next/navigation';
import { useResendEmailOtpMutation, useVerify2faMutation } from '@/services/authApi';
import { resetLoginFlow, setSession, setStage } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { normaliseApiError } from '@/types/api';
import { ButtonLoader } from '@/components/ui/Loaders';

/**
 * Step 2: second factor → session.
 * channel=totp → authenticator / recovery code. channel=email_otp → emailed
 * 6-digit code (auto-sent on login) + Resend. pendingToken expires in 5 min.
 */
export function Verify2faForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pendingToken = useAppSelector((s) => s.auth.pendingToken);
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const pendingChannel = useAppSelector((s) => s.auth.pendingChannel);
  const pendingExpiresAt = useAppSelector((s) => s.auth.pendingExpiresAt);
  const [verify, { isLoading }] = useVerify2faMutation();
  const [resend, { isLoading: resending }] = useResendEmailOtpMutation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const channel = pendingChannel ?? 'totp';
  const isEmail = channel === 'email_otp';

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = pendingExpiresAt ? Math.max(0, Math.round((pendingExpiresAt - now) / 1000)) : 0;
  const expired = pendingExpiresAt != null && secondsLeft <= 0;
  const cooldownLeft = Math.max(0, Math.round((cooldownUntil - now) / 1000));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!pendingToken || expired) {
      setError('Your sign-in session expired. Start again.');
      return;
    }
    const trimmed = code.trim().replace(/\s/g, '');
    if (!trimmed) {
      setError(isEmail ? 'Enter the 6-digit code from the email.' : 'Enter the 6-digit code from your authenticator app.');
      return;
    }
    try {
      const res = await verify({ pendingToken, code: trimmed }).unwrap();
      dispatch(setSession({ accessToken: res.data.accessToken, expiresInSeconds: res.data.expiresInSeconds }));
      if (res.data.method === 'recovery') {
        router.replace('/security?recovery=1');
        return;
      }
      const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
      router.replace(next);
    } catch (err) {
      const raw = (err as { status?: number; data?: unknown })?.data ?? err;
      const n = normaliseApiError({ status: (err as { status?: number })?.status, data: raw });
      const msg = typeof n.message === 'string' ? n.message : '';
      if ((err as { status?: number })?.status === 400 && /not set up|log in directly/i.test(msg)) {
        dispatch(resetLoginFlow());
        router.replace('/login');
        return;
      }
      setError(
        n.code === 'RATE_LIMITED'
          ? 'Too many attempts. Wait a few minutes and retry.'
          : isEmail
            ? 'That code did not work or expired. Check the latest email and retry.'
            : 'That code did not work. Check your authenticator and retry.',
      );
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    if (!pendingToken) {
      setError('Your sign-in session expired. Start again.');
      return;
    }
    try {
      await resend({ pendingToken }).unwrap();
      setCooldownUntil(Date.now() + 30_000);
      setInfo('A fresh code is on its way — only the latest email code works.');
    } catch (err) {
      const n = normaliseApiError({ status: (err as { status?: number })?.status, data: (err as { data?: unknown })?.data });
      setError(
        n.code === 'RATE_LIMITED'
          ? 'Too many resends. Wait a few minutes and retry.'
          : /not enabled/i.test(n.message)
            ? 'Email codes were turned off for this account. Sign in again.'
            : 'Could not resend the code. Try again shortly.',
      );
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
      {info ? <Alert severity="success" role="status">{info}</Alert> : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={isEmail ? <MarkEmailReadIcon /> : <PhonelinkLockIcon />}
          label={isEmail ? 'Email code' : 'Authenticator app'}
          color="primary"
          variant="outlined"
          size="small"
        />
        {pendingExpiresAt ? (
          <Typography variant="caption" color={expired ? 'error.main' : 'text.secondary'} aria-live="polite">
            {expired ? 'Session expired — start again' : `Code window expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
          </Typography>
        ) : null}
      </Box>

      {pendingEmail ? (
        <Typography variant="body1" color="text.secondary">
          Verifying identity for <strong style={{ color: 'inherit' }}>{pendingEmail}</strong>.{' '}
          {isEmail
            ? 'We emailed a 6-digit code on sign-in — only the latest code works (10 min, 5 attempts).'
            : 'Codes refresh every 30 seconds. A recovery code works too.'}
        </Typography>
      ) : null}

      <TextField
        label={isEmail ? '6-digit email code' : '6-digit code'}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        fullWidth
        slotProps={{ htmlInput: { maxLength: 64 } }}
        helperText={isEmail ? undefined : 'Lost your device? Enter a recovery code instead.'}
      />
      <Button type="submit" variant="contained" size="large" disabled={isLoading || expired} aria-busy={isLoading}>
        {isLoading ? <ButtonLoader label="Verifying" /> : 'Verify and sign in'}
      </Button>

      {isEmail ? (
        <Button
          variant="outlined"
          disabled={resending || cooldownLeft > 0 || expired}
          onClick={onResend}
          aria-busy={resending}
        >
          {resending ? 'Resending…' : cooldownLeft > 0 ? `Resend code (${cooldownLeft}s)` : 'Resend code'}
        </Button>
      ) : null}

      <Box sx={{ display: 'flex', gap: 1 }}>
        {!isEmail ? (
          <Button variant="text" onClick={() => dispatch(setStage('enroll'))}>
            Set up authenticator instead
          </Button>
        ) : null}
        <Box sx={{ flex: 1 }} />
        <Button variant="text" color="inherit" onClick={() => dispatch(resetLoginFlow())}>
          Back
        </Button>
      </Box>
    </Box>
  );
}
