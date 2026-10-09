'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { DataLoader } from '@/components/ui/DataLoader';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { ButtonLoader } from '@/components/ui/Loaders';
import {
  useSellerAcceptInvitationMutation,
  useSellerDeclineInvitationMutation,
  useSellerPendingInvitationsQuery,
} from '@/services/sellerTeamApi';
import { useSellerMeQuery } from '@/services/sellerAuthApi';
import { useSellerSignOut } from '@/components/seller/SellerGuards';
import { clearInviteToken } from '@/lib/seller';
import { normaliseApiError } from '@/types/api';
import {
  SELLER_CREATE_STORE_PATH,
  SELLER_HOME_PATH,
  SELLER_LOGIN_PATH,
  sellerDashboardPath,
} from '@/lib/panels';

function InvitationsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const wrongEmail = params.get('wrongEmail') === '1';
  const { data: meData } = useSellerMeQuery();
  const { data, isLoading, isError, error, refetch } = useSellerPendingInvitationsQuery();
  const [accept, { isLoading: accepting }] = useSellerAcceptInvitationMutation();
  const [decline, { isLoading: declining }] = useSellerDeclineInvitationMutation();
  const { signOut, signingOut } = useSellerSignOut();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

  const signedInAs = meData?.data.email ?? 'your account';

  if (isLoading) return <DataLoader label="Loading your invitations" variant="skeleton" />;
  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => refetch()}>Retry</Button>}>
        Couldn&apos;t load invitations — {normaliseApiError(error as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  const pending = data?.data ?? [];

  async function runAccept(invitationId: string) {
    setBusyId(invitationId);
    setNotice(null);
    try {
      const res = await accept({ invitationId }).unwrap();
      clearInviteToken();
      router.replace(sellerDashboardPath(res.data.storeId));
    } catch (err) {
      const norm = normaliseApiError(err as { status?: number; data?: unknown });
      if (norm.status === 403) {
        setNotice({
          tone: 'error',
          text: `You're signed in as ${signedInAs}, but that invitation belongs to a different email. Switch account to join it.`,
        });
      } else {
        // 400 (already handled/expired/revoked) or network — resync the inbox.
        setNotice({ tone: 'info', text: `That invitation can't be accepted (${norm.message}). The list below is up to date.` });
        refetch();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function runDecline(invitationId: string, storeName: string) {
    setBusyId(invitationId);
    setNotice(null);
    try {
      await decline(invitationId).unwrap();
      setNotice({ tone: 'success', text: `Declined the ${storeName} invitation. Declines are terminal — the owner must send a fresh invite to re-invite you.` });
      refetch();
    } catch (err) {
      setNotice({ tone: 'error', text: normaliseApiError(err as { status?: number; data?: unknown }).message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Invitations</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          {pending.length} pending invitation{pending.length === 1 ? '' : 's'} for {signedInAs}. Joining never requires creating a store.
        </Typography>
      </Box>

      {wrongEmail ? (
        <Alert
          severity="warning"
          role="alert"
          action={
            <Button
              size="small"
              color="inherit"
              disabled={signingOut}
              onClick={() => signOut(`${SELLER_LOGIN_PATH}?next=${encodeURIComponent('/seller/invitations')}`)}
            >
              {signingOut ? 'Signing out…' : 'Switch account'}
            </Button>
          }
        >
          You&apos;re signed in as <strong>{signedInAs}</strong>, but the invitation link you opened was
          sent to a different email. Switch to the invited account — your join intent is kept.
        </Alert>
      ) : null}

      <GuideAccordion title="How joining works">
        <HowRow n={1}>Your login belongs to you alone — the owner invited by email + role and never sees your password.</HowRow>
        <HowRow n={2}>Accept joins the store with the shown role; decline is terminal for that invitation (the owner re-invites with a fresh one).</HowRow>
        <HowRow n={3}>Lost the email? This inbox lists everything sent to your address — no link needed.</HowRow>
      </GuideAccordion>

      {notice ? <Alert severity={notice.tone} role={notice.tone === 'error' ? 'alert' : 'status'} onClose={() => setNotice(null)}>{notice.text}</Alert> : null}

      {pending.length === 0 ? (
        <Card>
          <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h2" sx={{ fontSize: '1.05rem' }}>No pending invitations</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.86rem' }}>
              Nothing is waiting for {signedInAs}. New invites appear here automatically.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Button component={Link} href={SELLER_HOME_PATH} size="small" variant="contained">My stores</Button>
              <Button component={Link} href={SELLER_CREATE_STORE_PATH} size="small" variant="outlined">Create a store</Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={1.5}>
          {pending.map((inv) => {
            const busy = busyId === inv.id;
            return (
              <Grid key={inv.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MailIcon fontSize="small" color="primary" />
                      <Typography variant="h2" sx={{ fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.storeName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip size="small" color="primary" label={inv.roleName} variant="outlined" />
                      <Chip size="small" label={inv.slug} variant="outlined" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Invited as {inv.roleKey} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        disabled={busy || accepting || declining}
                        onClick={() => runAccept(inv.id)}
                      >
                        {busy && accepting ? <ButtonLoader label="Joining" /> : 'Accept'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        fullWidth
                        disabled={busy || accepting || declining}
                        onClick={() => runDecline(inv.id, inv.storeName)}
                      >
                        {busy && declining ? <ButtonLoader label="Declining" /> : 'Decline'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export function InvitationsView() {
  return (
    <Suspense fallback={<DataLoader label="Loading invitations" />}>
      <InvitationsContent />
    </Suspense>
  );
}
