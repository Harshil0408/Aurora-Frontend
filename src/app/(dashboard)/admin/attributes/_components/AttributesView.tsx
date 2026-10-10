'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Snackbar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DatasetIcon from '@mui/icons-material/Dataset';
import { AccessDenied, Can, RbacGuard, usePermissions } from '@/components/auth/RbacGuard';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { SegmentedFilter } from '@/components/ui/controls';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { normaliseApiError } from '@/types/api';
import { ADMIN_PREFIX } from '@/lib/panels';
import { prettyAttributeType, scopeOfAttributeType } from '@/lib/variables';
import { useAttributeTypesQuery } from '@/services/attributesApi';
import { CreateAttributeModal, type AttributeToast } from './AttributeDialogs';

export type AttributeScopeParam = 'admin' | 'seller' | 'user';

export function AttributesView({ scope }: { scope: AttributeScopeParam | null }) {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can('attribute.create');
  const { data, isLoading, isError, error, refetch } = useAttributeTypesQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<AttributeToast | null>(null);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const counts = useMemo(() => {
    const by: Record<string, number> = { admin: 0, seller: 0, user: 0 };
    for (const r of rows) {
      const s = scopeOfAttributeType(r.type);
      if (s !== 'general') by[s] += 1;
    }
    return by;
  }, [rows]);
  const totalEntries = useMemo(() => rows.reduce((n, r) => n + r.count, 0), [rows]);
  const visible = useMemo(
    () => (scope == null ? rows : rows.filter((r) => scopeOfAttributeType(r.type) === scope)),
    [rows, scope],
  );

  if (isLoading) return <DataLoader label="Loading lookup types" />;
  if (isError) {
    const norm = normaliseApiError(error);
    if (norm.status === 403) {
      return (
        <RbacGuard perm="attribute.read">
          <AccessDenied
            title="Attributes are restricted"
            description="You don't hold attribute.read — ask an administrator for lookup-catalog access."
            onRetry={() => refetch()}
          />
        </RbacGuard>
      );
    }
    return (
      <FallbackUI
        tone="error"
        title="Couldn't load lookup types"
        description={norm.message}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <RbacGuard perm="attribute.read">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h1" sx={{ fontSize: '1.3rem', letterSpacing: '-0.01em' }}>
              Attributes
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem', mt: 0.25 }}>
              One catalog behind every platform dropdown — {rows.length} types · {totalEntries} entries.
              {scope ? ` Filtered to ${scope === 'user' ? 'shopper' : scope} lookups.` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              component={Link}
              href={`${ADMIN_PREFIX}/attributes/general`}
            >
              General catalog
            </Button>
            <Can perm="attribute.create">
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                Add entry
              </Button>
            </Can>
          </Box>
        </Box>

        <GuideAccordion title="What are attributes? How do they work?">
          <HowRow n={1}>
            Every dropdown on the platform — payment options, countries, languages — reads from this one catalog,
            namespaced by <strong>type</strong>.
          </HowRow>
          <HowRow n={2}>
            Pick a type card to manage its entries: search, filter by status, add, edit, deactivate, or delete.
          </HowRow>
          <HowRow n={3}>
            A <strong>key</strong> is unique per type only — <strong>upi</strong> can live under both payment_type and
            payout_method without colliding.
          </HowRow>
        </GuideAccordion>

        <SegmentedFilter
          ariaLabel="Filter lookup types by audience"
          value={scope ?? ''}
          onChange={(v) =>
            router.push(v === '' ? `${ADMIN_PREFIX}/attributes` : `${ADMIN_PREFIX}/attributes?scope=${v}`)
          }
          options={[
            { value: '', label: 'All' },
            { value: 'admin', label: 'Admin', count: counts.admin },
            { value: 'seller', label: 'Seller', count: counts.seller },
            { value: 'user', label: 'Users', count: counts.user },
          ]}
        />

        {visible.length === 0 ? (
          <FallbackUI
            title={rows.length === 0 ? 'No lookup types yet' : `No ${scope} lookup types`}
            description={
              rows.length === 0
                ? 'Create the first attribute — it becomes the first card on this wall.'
                : 'Nothing here matches this audience yet. Entries without a recognized prefix live under Admin.'
            }
            actionLabel={canCreate ? 'Create the first attribute' : undefined}
            onAction={canCreate ? () => setCreateOpen(true) : undefined}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            }}
          >
            {visible.map((row) => (
              <Card
                key={row.type}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  transition: 'box-shadow 200ms ease, border-color 200ms ease',
                  '&:hover': { boxShadow: 2, borderColor: 'primary.light' },
                }}
              >
                <CardActionArea
                  component={Link}
                  href={`${ADMIN_PREFIX}/attributes/${encodeURIComponent(row.type)}`}
                  sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box
                      aria-hidden
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        flex: 'none',
                      }}
                    >
                      <DatasetIcon fontSize="small" />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prettyAttributeType(row.type)}
                    </Typography>
                    <ArrowForwardIcon fontSize="small" sx={{ color: 'text.disabled', flex: 'none' }} />
                  </Box>
                  <Typography
                    component="code"
                    sx={{ fontFamily: 'monospace', fontSize: '0.74rem', color: 'text.secondary' }}
                  >
                    {row.type}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`${row.count} ${row.count === 1 ? 'entry' : 'entries'}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip size="small" label={scopeOfAttributeType(row.type)} variant="outlined" />
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <CreateAttributeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existingTypes={rows.map((r) => r.type)}
        onToast={setToast}
      />
      <Snackbar
        open={toast != null}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.kind ?? 'success'} onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.text}
        </Alert>
      </Snackbar>
    </RbacGuard>
  );
}
