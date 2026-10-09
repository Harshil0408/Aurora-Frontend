'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button } from '@mui/material';
import { AuthCard } from '@/components/auth/AuthCard';
import { ButtonLoader } from '@/components/ui/Loaders';
import { DataLoader } from '@/components/ui/DataLoader';
import { useSellerAcceptInvitationMutation } from '@/services/sellerTeamApi';
import { useSellerMeQuery } from '@/services/sellerAuthApi';
import { useAppSelector } from '@/store/hooks';
import { useSellerSignOut } from '@/components/seller/SellerGuards';
import type { RootState } from '@/store';
import { clearInviteToken, stashInviteToken } from '@/lib/seller';
import { normaliseApiError } from '@/types/api';
import {
  SELLER_INVITATIONS_PATH,
  SELLER_LOGIN_PATH,
  SELLER_REGISTER_PATH,
  SELLER_HOME_PATH,
  sellerDashboardPath,
} from '@/lib/panels';

type AcceptState = 'working' | 'done' | 'expired' | 'wrong-email' | 'error';

function InviteAcceptContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const isAuthenticated = useAppSelector((s: RootState) => s.sellerAuth.isAuthenticated);
  const { data: meData } = useSellerMeQuery(undefined, { skip: !isAuthenticated });
  const [accept] = useSellerAcceptInvitationMutation();
  const { signOut, signingOut } = useSellerSignOut();
  const [state, setState] = useState<AcceptState>('working');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (token) stashInviteToken(token);
  }, [token]);

  // Logged in? Accept immediately — no extra click. The stash stays until a
  // terminal outcome so a reload or account switch resumes the same intent.
  useEffect(() => {
    if (!token || !isAuthenticated || attempted.current === `${token}:${attempt}`) return;
    attempted.current = `${token}:${attempt}`;
    let cancelled = false;
    void (async () => {
      try {
        const res = await accept({ token }).unwrap();
        if (cancelled) return;
        clearInviteToken();
        setState('done');
        router.replace(sellerDashboardPath(res.data.storeId));
      } catch (err) {
        if (cancelled) return;
        const norm = normaliseApiError(err as { status?: number; data?: unknown });
        if (norm.status === 403) {
          // Invite belongs to a different email — keep the stash for after
          // the account switch, and say exactly who is signed in.
          setState('wrong-email');
        } else if (norm.status === 400) {
          clearInviteToken();
          setState('expired');
        } else {
          setError(norm.message);
          setState('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, attempt, accept, router]);

  if (!token) {
    return (
      <AuthCard eyebrow="Team invitation" title="Invitation link is incomplete" description="This link has no invitation token. Ask the store owner to copy the invite link again from the Team page.">
        <Alert severity="warning">Missing <code>?token=…</code> in the URL — the invite link was truncated.</Alert>
      </AuthCard>
    );
  }

  if (!isAuthenticated) {
    const next = `/seller/invite/accept?token=${encodeURIComponent(token)}`;
    return (
      <AuthCard
        eyebrow="Team invitation"
        title="You've been invited"
        description="One account per human: sign in — or register with the invited email — and the invitation is accepted automatically. Joining never requires creating a store."
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Alert severity="info">
            Use the exact email the invitation was sent to. A different email gets a “signed in as someone else” error, never access.
          </Alert>
          <Button component={Link} href={`${SELLER_LOGIN_PATH}?next=${encodeURIComponent(next)}`} variant="contained">
            Sign in and join
          </Button>
          <Button component={Link} href={`${SELLER_REGISTER_PATH}?next=${encodeURIComponent(next)}`} variant="outlined">
            Create account and join
          </Button>
        </Box>
      </AuthCard>
    );
  }

  const signedInAs = meData?.data.email ?? 'your account';

  if (state === 'wrong-email') {
    const acceptUrl = `/seller/invite/accept?token=${encodeURIComponent(token)}`;
    return (
      <AuthCard
        eyebrow="Team invitation"
        title="This invite isn't for this account"
        description="Credentials belong to the human, never the owner — nobody can log in as someone else, so invites only work for the exact email."
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Alert severity="warning" role="alert">
            You&apos;re signed in as <strong>{signedInAs}</strong>, but this invitation was sent to a
            different email address. Switch to the invited account — your join intent is kept and
            resumes automatically.
          </Alert>
          <Button
            variant="contained"
            disabled={signingOut}
            onClick={() => signOut(`${SELLER_LOGIN_PATH}?next=${encodeURIComponent(acceptUrl)}`)}
          >
            {signingOut ? <ButtonLoader label="Signing out" /> : 'Switch account and join'}
          </Button>
          <Button component={Link} href={SELLER_INVITATIONS_PATH} variant="outlined">
            Review my invitations instead
          </Button>
        </Box>
      </AuthCard>
    );
  }

  if (state === 'expired') {
    return (
      <AuthCard
        eyebrow="Team invitation"
        title="Invitation no longer usable"
        description="It expired, was already accepted or declined, or was revoked. Declines are terminal — ask the owner for a fresh invite."
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Alert severity="info">Already joined? Head to your stores — the membership is there.</Alert>
          <Button component={Link} href={SELLER_INVITATIONS_PATH} variant="contained">
            Check my invitations
          </Button>
          <Button component={Link} href={SELLER_HOME_PATH} variant="outlined">
            My stores
          </Button>
        </Box>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Team invitation"
      title={state === 'done' ? 'Welcome aboard' : 'Joining your store'}
      description={state === 'done' ? 'Taking you to your new store…' : 'Accepting the invitation — one moment.'}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {state === 'error' && error ? <Alert severity="error" role="alert">{error}</Alert> : null}
        {state === 'error' ? (
          <Button variant="contained" onClick={() => { setAttempt((a) => a + 1); setError(null); setState('working'); }}>
            Try again
          </Button>
        ) : (
          <DataLoader label={state === 'done' ? 'Opening your new store' : 'Accepting invitation'} variant="inline" />
        )}
      </Box>
    </AuthCard>
  );
}

export function InviteAcceptView() {
  return (
    <Suspense fallback={<DataLoader label="Loading invitation" />}>
      <InviteAcceptContent />
    </Suspense>
  );
}
