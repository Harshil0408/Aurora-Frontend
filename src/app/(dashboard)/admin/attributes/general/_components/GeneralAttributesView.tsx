'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  Chip,
  Snackbar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PublicIcon from '@mui/icons-material/Public';
import PaymentsIcon from '@mui/icons-material/Payments';
import TranslateIcon from '@mui/icons-material/Translate';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { AccessDenied, RbacGuard, usePermissions } from '@/components/auth/RbacGuard';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { normaliseApiError } from '@/types/api';
import { ADMIN_PREFIX } from '@/lib/panels';
import { GENERAL_ATTRIBUTE_TYPES } from '@/lib/variables';
import { useAttributeTypesQuery } from '@/services/attributesApi';
import { CreateAttributeModal, type AttributeToast } from '../../_components/AttributeDialogs';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  store_category: <StorefrontIcon fontSize="small" />,
  language: <TranslateIcon fontSize="small" />,
  payment_type: <PaymentsIcon fontSize="small" />,
  currency: <AttachMoneyIcon fontSize="small" />,
  country: <PublicIcon fontSize="small" />,
  timezone: <ScheduleIcon fontSize="small" />,
};

export function GeneralAttributesView() {
  const { can } = usePermissions();
  const canCreate = can('attribute.create');
  const { data, isLoading, isError, error, refetch } = useAttributeTypesQuery();
  const [createType, setCreateType] = useState<string | null>(null);
  const [toast, setToast] = useState<AttributeToast | null>(null);

  const countByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data?.data ?? []) map.set(row.type, row.count);
    return map;
  }, [data]);

  if (isLoading) return <DataLoader label="Loading general lookups" />;
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
        title="Couldn't load general lookups"
        description={norm.message}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <RbacGuard perm="attribute.read">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5, mb: 2 }}>
        <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: '0.8rem' }}>
          <Link href={`${ADMIN_PREFIX}/attributes`} style={{ textDecoration: 'none' }}>
            Attributes
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>General</Typography>
        </Breadcrumbs>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1" sx={{ fontSize: '1.3rem', letterSpacing: '-0.01em' }}>
            General lookups
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.84rem', mt: 0.25 }}>
            Shared platform lists every audience uses — seller store categories, languages, payment types,
            currencies, countries, and timezones.
          </Typography>
        </Box>

        <GuideAccordion title="What lives here? How do I use it?">
          <HowRow n={1}>
            These six lists are the platform&apos;s shared vocabulary — seller onboarding, checkout, and
            storefronts all read from them.
          </HowRow>
          <HowRow n={2}>
            Open a card to add entries (e.g. a new payment type), reorder them with sort order, or deactivate
            ones going out of use.
          </HowRow>
          <HowRow n={3}>
            A missing card means that list has no entries yet — create the first one inline with the Add button.
          </HowRow>
        </GuideAccordion>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          {GENERAL_ATTRIBUTE_TYPES.map((g) => {
            const count = countByType.get(g.type);
            const missing = count == null;
            return (
              <Card
                key={g.type}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderStyle: missing ? 'dashed' : 'solid',
                  transition: 'box-shadow 200ms ease, border-color 200ms ease',
                  '&:hover': { boxShadow: 2, borderColor: 'primary.light' },
                }}
              >
                <CardActionArea
                  component={Link}
                  href={`${ADMIN_PREFIX}/attributes/${encodeURIComponent(g.type)}`}
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
                      {TYPE_ICONS[g.type] ?? <PublicIcon fontSize="small" />}
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', flex: 1, minWidth: 0 }}>
                      {g.label}
                    </Typography>
                    <ArrowForwardIcon fontSize="small" sx={{ color: 'text.disabled', flex: 'none' }} />
                  </Box>
                  <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {g.hint}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                    {missing ? (
                      <Chip size="small" label="Not created yet" variant="outlined" />
                    ) : (
                      <Chip
                        size="small"
                        label={`${count} ${count === 1 ? 'entry' : 'entries'}`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary' }}>
                      {g.type}
                    </Typography>
                  </Box>
                </CardActionArea>
                {missing && canCreate ? (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateType(g.type)}
                    >
                      Create first {g.label.toLowerCase()}
                    </Button>
                  </Box>
                ) : null}
              </Card>
            );
          })}
        </Box>
      </Box>

      <CreateAttributeModal
        open={createType != null}
        onClose={() => setCreateType(null)}
        lockedType={createType ?? undefined}
        existingTypes={GENERAL_ATTRIBUTE_TYPES.map((g) => g.type)}
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
