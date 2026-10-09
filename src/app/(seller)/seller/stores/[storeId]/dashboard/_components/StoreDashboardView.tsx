'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { DataLoader } from '@/components/ui/DataLoader';
import { useSellerStoreDetailQuery, useSellerCompleteOnboardingMutation } from '@/services/sellerStoresApi';
import { useSellerPendingInvitationsQuery } from '@/services/sellerTeamApi';
import { useSellerCan, SellerForbidden } from '@/components/seller/SellerGuards';
import { onboardingChecklist, subscriptionLabel, trialBannerFor, trialDaysLeft } from '@/lib/seller';
import { normaliseApiError } from '@/types/api';
import { SELLER_INVITATIONS_PATH, sellerStorePath } from '@/lib/panels';

export function StoreDashboardView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  const { data, isLoading, isError, error, refetch } = useSellerStoreDetailQuery(storeId, { skip: !storeId });
  const [complete, { isLoading: completing }] = useSellerCompleteOnboardingMutation();
  const { data: pendingData } = useSellerPendingInvitationsQuery();
  const pendingCount = pendingData?.data.length ?? 0;

  if (isLoading) return <DataLoader label="Loading store overview" variant="skeleton" />;
  if (isError) {
    const norm = normaliseApiError(error as { status?: number; data?: unknown });
    if (norm.status === 403) return <SellerForbidden onResync={() => refetch()} />;
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => refetch()}>Retry</Button>}>
        Couldn&apos;t load this store — {norm.message}
      </Alert>
    );
  }

  const detail = data?.data;
  if (!detail) return <DataLoader label="Loading store overview" />;

  const checklist = onboardingChecklist(detail);
  const doneCount = checklist.filter((c) => c.done).length;
  const banner = trialBannerFor(detail.subscription);
  const left = trialDaysLeft(detail.subscription?.trialEnd);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>{detail.name}</Typography>
          <Chip size="small" label={detail.roleName} color="primary" variant="outlined" />
          <Chip size="small" label={detail.status} variant="outlined" />
        </Box>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          {detail.slug} · {detail.memberCount} member{detail.memberCount === 1 ? '' : 's'} · {detail.currency} · {detail.timezone}
        </Typography>
      </Box>

      {detail.status !== 'ACTIVE' ? (
        <Alert severity="warning">
          This store is <strong>{detail.status}</strong>. Some actions may be restricted until the status returns to active.
        </Alert>
      ) : null}

      {banner ? <Alert severity={banner.tone === 'warn' ? 'warning' : 'info'}>{banner.text}</Alert> : null}

      {pendingCount > 0 ? (
        <Alert severity="info" action={<Button size="small" color="inherit" component={Link} href={SELLER_INVITATIONS_PATH}>Review</Button>}>
          You have {pendingCount} pending store invitation{pendingCount === 1 ? '' : 's'} — joining never requires creating a store.
        </Alert>
      ) : null}

      {detail.onboardingCompletedAt == null ? (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography variant="h2" sx={{ fontSize: '1.05rem' }}>Finish setting up — {doneCount} of {checklist.length} done</Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.25 }}>
                  What it is: a short checklist that unlocks the full dashboard. How it works: each row resolves itself as you complete that part of the store.
                </Typography>
              </Box>
              {can('store:update') && doneCount >= 3 ? (
                <Button
                  size="small"
                  variant="contained"
                  disabled={completing}
                  onClick={async () => { try { await complete(storeId).unwrap(); refetch(); } catch {} }}
                >
                  {completing ? 'Finishing…' : 'Mark setup complete'}
                </Button>
              ) : null}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
              {checklist.map((c) => (
                <Box key={c.key} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  {c.done ? <CheckCircleIcon fontSize="small" color="success" /> : <RadioButtonUncheckedIcon fontSize="small" color="disabled" />}
                  <Box>
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 600 }}>{c.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.hint}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Subscription</Typography>
            <Typography variant="h2" sx={{ fontSize: '1.1rem', mt: 0.25 }}>
              {subscriptionLabel(detail.subscription)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {detail.subscription?.status === 'TRIALING' && left != null ? `${left} trial day${left === 1 ? '' : 's'} left` : 'Plan upgrades arrive with payments'}
            </Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Team</Typography>
            <Typography variant="h2" sx={{ fontSize: '1.1rem', mt: 0.25 }}>{detail.memberCount} member{detail.memberCount === 1 ? '' : 's'}</Typography>
            <Typography variant="caption" color="text.secondary">Your role: {detail.roleName}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Catalog</Typography>
            <Typography variant="h2" sx={{ fontSize: '1.1rem', mt: 0.25 }}>Products API</Typography>
            <Typography variant="caption" color="text.secondary">Coming in the next increment</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Orders</Typography>
            <Typography variant="h2" sx={{ fontSize: '1.1rem', mt: 0.25 }}>Orders API</Typography>
            <Typography variant="caption" color="text.secondary">Coming in the next increment</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h2" sx={{ fontSize: '1.05rem' }}>Next steps</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.25, mb: 1 }}>
            Deep links into each workspace area. Pages you lack permission for stay hidden in the sidebar but are listed here with their requirement.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {can('store:update') ? <Button component={Link} href={sellerStorePath(storeId, 'settings')} size="small" variant="outlined">Store settings</Button> : null}
            {can('staff:invite') ? <Button component={Link} href={sellerStorePath(storeId, 'team')} size="small" variant="outlined">Invite teammates</Button> : null}
            {can('role:read') ? <Button component={Link} href={sellerStorePath(storeId, 'roles')} size="small" variant="outlined">Roles & permissions</Button> : null}
            {can('billing:read') ? <Button component={Link} href={sellerStorePath(storeId, 'billing')} size="small" variant="outlined">Billing & trial</Button> : null}
            {can('store:read') ? <Button component={Link} href={sellerStorePath(storeId, 'activity')} size="small" variant="outlined">Activity feed</Button> : null}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
