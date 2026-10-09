'use client';

import { useParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { TableCard } from '@/components/ui/controls';
import { DataLoader } from '@/components/ui/DataLoader';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { useSellerPlansQuery, useSellerSubscriptionQuery } from '@/services/sellerBillingApi';
import { SellerForbidden, useSellerCan } from '@/components/seller/SellerGuards';
import { formatPricePaise, trialDaysLeft } from '@/lib/seller';
import { normaliseApiError } from '@/types/api';

export function BillingView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  if (!can('billing:read')) return <Box sx={{ mt: 0.5 }}><SellerForbidden /></Box>;
  return <BillingContent storeId={storeId} />;
}

function BillingContent({ storeId }: { storeId: string }) {
  const plans = useSellerPlansQuery();
  const sub = useSellerSubscriptionQuery(storeId, { skip: !storeId });

  if (plans.isLoading || sub.isLoading) return <DataLoader label="Loading billing" variant="skeleton" />;
  const err = plans.error ?? sub.error;
  if (err) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => { plans.refetch(); sub.refetch(); }}>Retry</Button>}>
        Couldn&apos;t load billing — {normaliseApiError(err as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  const subscription = sub.data?.data ?? null;
  const list = plans.data?.data ?? [];
  const left = trialDaysLeft(subscription?.trialEnd);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Billing</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          Trial-first SaaS: every store starts on Starter. Checkout arrives in the payments increment.
        </Typography>
      </Box>

      <GuideAccordion title="How billing works">
        <HowRow n={1}>New stores get a 14-day Starter trial automatically — no card, no checkout click.</HowRow>
        <HowRow n={2}>The countdown below reads the server&apos;s trialEnd date; features aren&apos;t gated yet.</HowRow>
        <HowRow n={3}>Past-due means grace period, not lockout. Plan buttons stay display-only until payments land.</HowRow>
      </GuideAccordion>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h2" sx={{ fontSize: '1.05rem' }}>Current subscription</Typography>
              {subscription ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip size="small" color="primary" label={subscription.plan ? subscription.plan.name : 'No plan'} />
                    <Chip size="small" variant="outlined" label={subscription.status} />
                    <Chip size="small" variant="outlined" label={subscription.billingCycle} />
                  </Box>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 800 }}>
                    {subscription.plan ? (
                      <>
                        {formatPricePaise(subscription.plan.pricePaise, subscription.plan.currency)}
                        <Typography component="span" variant="caption" color="text.secondary"> /month</Typography>
                      </>
                    ) : (
                      subscription.status
                    )}
                  </Typography>
                  {subscription.status === 'TRIALING' ? (
                    <Alert severity="info">
                      {left == null ? 'Trial active.' : left === 0 ? 'Trial ends today.' : `${left} trial day${left === 1 ? '' : 's'} left (until ${subscription.trialEnd ? new Date(subscription.trialEnd).toLocaleDateString() : '—'}).`}
                    </Alert>
                  ) : null}
                  {subscription.status === 'PAST_DUE' ? (
                    <Alert severity="warning">Past due — update billing when checkout opens to avoid interruption.</Alert>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    Limits: {subscription.plan ? Object.entries(subscription.plan.limits).map(([k, v]) => `${k} ${v}`).join(' · ') || '—' : 'Plan details unavailable for this subscription.'}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>No subscription yet — one is created automatically with the Starter trial.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <TableCard
            title="Plans"
            subtitle={`${list.length} plans ordered by price · checkout opens soon`}
            empty={{ when: list.length === 0, title: 'No plans published', description: 'Plans appear here once the catalog is active.' }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Billing plans">
                <TableHead>
                  <TableRow>
                    <TableCell>Plan</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Limits</TableCell>
                    <TableCell>Trial</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((p) => {
                    const isCurrent = subscription?.plan != null && subscription.plan.key === p.key;
                    return (
                      <TableRow key={p.key}>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
                          {formatPricePaise(p.pricePaise, p.currency)}<Typography component="span" variant="caption" color="text.secondary">/{p.billingCycle === 'monthly' ? 'mo' : p.billingCycle}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{Object.entries(p.limits).map(([k, v]) => `${k} ${v}`).join(' · ')}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }}>{p.trialDays > 0 ? `${p.trialDays} days` : '—'}</TableCell>
                        <TableCell align="right">
                          {isCurrent ? (
                            <Chip size="small" color="primary" label="Current" />
                          ) : (
                            <Button size="small" variant="outlined" disabled title="Checkout opens with the payments increment">
                              {p.pricePaise === 0 ? 'Downgrade (soon)' : 'Upgrade (soon)'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        </Grid>
      </Grid>
    </Box>
  );
}
