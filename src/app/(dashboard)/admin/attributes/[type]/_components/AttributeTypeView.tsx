'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { Can, RbacGuard, usePermissions, AccessDenied } from '@/components/auth/RbacGuard';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { SearchField, SegmentedFilter, TableCard } from '@/components/ui/controls';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { normaliseApiError } from '@/types/api';
import type { Attribute, AttributeStatusFilter } from '@/types/attributes';
import { ATTRIBUTE_STATUS_LABEL } from '@/types/attributes';
import { useResetKey, formatDay } from '@/lib/utils';
import { ADMIN_PREFIX } from '@/lib/panels';
import { prettyAttributeType } from '@/lib/variables';
import { mercatoTokens } from '@/lib/theme';
import { useListAttributesQuery } from '@/services/attributesApi';
import {
  CreateAttributeModal,
  DeleteAttributeDialog,
  EditAttributeModal,
  StatusAttributeModal,
  type AttributeToast,
} from '../../_components/AttributeDialogs';

const PAGE_SIZE = 20;

type DialogState =
  | { kind: null }
  | { kind: 'create' }
  | { kind: 'edit'; row: Attribute }
  | { kind: 'status'; row: Attribute }
  | { kind: 'delete'; row: Attribute };

function statusTone(status: 'ACTIVE' | 'INACTIVE'): { bg: string; color: string } {
  return status === 'ACTIVE'
    ? { bg: mercatoTokens.goodSoft, color: mercatoTokens.good }
    : { bg: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong };
}

export function AttributeTypeView({ type }: { type: string }) {
  const { can } = usePermissions();
  const canUpdate = can('attribute.update');
  const canDelete = can('attribute.delete');

  const [tab, setTab] = useState<AttributeStatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ kind: null });
  const [toast, setToast] = useState<AttributeToast | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  // Page resets on any filter change (render-phase reset, not an effect).
  useResetKey(`${type}|${tab}|${debounced}`, () => setPage(1));

  const listArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      type,
      status: tab === 'ALL' ? undefined : tab,
      search: debounced || undefined,
    }),
    [page, type, tab, debounced],
  );
  const { data, isLoading, isFetching, isError, error, refetch } =
    useListAttributesQuery(listArgs);

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const title = prettyAttributeType(type);

  const closeDialog = () => setDialog({ kind: null });

  let body: React.ReactNode;
  if (isLoading) {
    body = <DataLoader label={`Loading ${title.toLowerCase()}`} />;
  } else if (isError) {
    const norm = normaliseApiError(error);
    body =
      norm.status === 403 ? (
        <AccessDenied
          title="Attributes are restricted"
          description="You don't hold attribute.read — ask an administrator for lookup-catalog access."
          onRetry={() => refetch()}
        />
      ) : (
        <FallbackUI
          tone="error"
          title={norm.status === 400 ? 'That filter was rejected' : "Couldn't load entries"}
          description={norm.message}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      );
  } else {
    body = (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label={`${title} entries`}>
          <TableHead>
            <TableRow>
              <TableCell width={72}>Order</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Code</TableCell>
              <TableCell width={110}>Status</TableCell>
              <TableCell width={150}>Updated</TableCell>
              <TableCell width={132} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const tone = statusTone(row.status);
              const dimmed = row.status === 'INACTIVE';
              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={dimmed ? { opacity: 0.62 } : undefined}
                >
                  <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    {row.sortOrder}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.label}
                      </Typography>
                      {row.isSystem ? (
                        <Chip size="small" label="system" color="info" sx={{ height: 20, fontSize: '0.66rem' }} />
                      ) : null}
                    </Box>
                    {row.description ? (
                      <Typography color="text.secondary" sx={{ fontSize: '0.74rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {row.description}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {row.key}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
                    {row.value ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={ATTRIBUTE_STATUS_LABEL[row.status]}
                      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {formatDay(row.updatedAt)}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'inline-flex', gap: 0.25 }}>
                      <Tooltip title={canUpdate ? `Edit ${row.label}` : 'Needs attribute.update'}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Edit ${row.label}`}
                            disabled={!canUpdate}
                            onClick={() => setDialog({ kind: 'edit', row })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          canUpdate
                            ? row.status === 'ACTIVE'
                              ? `Deactivate ${row.label}`
                              : `Activate ${row.label}`
                            : 'Needs attribute.update'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            aria-label={row.status === 'ACTIVE' ? `Deactivate ${row.label}` : `Activate ${row.label}`}
                            disabled={!canUpdate}
                            onClick={() => setDialog({ kind: 'status', row })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <PowerSettingsNewIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {canDelete && !row.isSystem ? (
                        <Tooltip title={`Delete ${row.label}`}>
                          <IconButton
                            size="small"
                            aria-label={`Delete ${row.label}`}
                            onClick={() => setDialog({ kind: 'delete', row })}
                            sx={{ cursor: 'pointer', '&:hover': { color: 'error.main' } }}
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : canDelete ? (
                        <Tooltip title="System attributes cannot be deleted">
                          <span>
                            <IconButton size="small" aria-label={`Delete ${row.label} (disabled for system entries)`} disabled sx={{ cursor: 'not-allowed' }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <RbacGuard perm="attribute.read">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5, mb: 2 }}>
        <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: '0.8rem' }}>
          <Link href={`${ADMIN_PREFIX}/attributes`} style={{ textDecoration: 'none' }}>
            Attributes
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>{title}</Typography>
        </Breadcrumbs>

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
              {title}
              {isFetching && !isLoading ? (
                <Typography component="span" color="text.secondary" sx={{ fontSize: '0.78rem', ml: 1 }}>
                  updating…
                </Typography>
              ) : null}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem', mt: 0.25 }}>
              <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{type}</Typography>
              {' '}· sorted by display order, then name. Inactive entries stay listed but hide from live dropdowns.
            </Typography>
          </Box>
          <Can perm="attribute.create">
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialog({ kind: 'create' })}
            >
              Add {title.replace(/s$/, '')}
            </Button>
          </Can>
        </Box>

        <GuideAccordion title="How does this list work?">
          <HowRow n={1}>Search matches keys and display names as you type; status tabs filter active vs inactive.</HowRow>
          <HowRow n={2}>Display order decides dropdown position — lower numbers float to the top.</HowRow>
          <HowRow n={3}>Type and key are permanent once created; everything else can be edited any time.</HowRow>
        </GuideAccordion>

        <TableCard
          title={`${title} entries`}
          subtitle={pagination ? `${total} ${total === 1 ? 'entry' : 'entries'}` : undefined}
          toolbar={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <SegmentedFilter<AttributeStatusFilter>
                ariaLabel="Filter by status"
                value={tab}
                onChange={(v) => setTab(v)}
                options={[
                  { value: 'ALL', label: 'All' },
                  { value: 'ACTIVE', label: 'Active', dot: mercatoTokens.good },
                  { value: 'INACTIVE', label: 'Inactive', dot: mercatoTokens.accent },
                ]}
              />
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder={`Search ${title.toLowerCase()}…`}
                aria-label={`Search ${title.toLowerCase()}`}
                minWidth={220}
              />
            </Box>
          }
          empty={{
            when: !isLoading && !isError && rows.length === 0,
            title: debounced || tab !== 'ALL' ? 'No entries match' : `No ${title.toLowerCase()} yet`,
            description:
              debounced || tab !== 'ALL'
                ? 'Try a different search or status filter.'
                : 'Create the first entry — it appears in every dropdown bound to this list.',
            actionLabel: can('attribute.create') && !debounced && tab === 'ALL' ? `Add ${title.replace(/s$/, '')}` : undefined,
            onAction: can('attribute.create') && !debounced && tab === 'ALL' ? () => setDialog({ kind: 'create' }) : undefined,
          }}
          footer={
            pagination && totalPages > 1 ? (
              <>
                <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Page {pagination.page} of {totalPages}
                </Typography>
                <Button size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </>
            ) : undefined
          }
        >
          {body}
        </TableCard>
      </Box>

      <CreateAttributeModal
        open={dialog.kind === 'create'}
        onClose={closeDialog}
        lockedType={type}
        existingTypes={[type]}
        onToast={setToast}
      />
      <EditAttributeModal
        open={dialog.kind === 'edit'}
        onClose={closeDialog}
        attribute={dialog.kind === 'edit' ? dialog.row : null}
        onToast={setToast}
      />
      <StatusAttributeModal
        open={dialog.kind === 'status'}
        onClose={closeDialog}
        attribute={dialog.kind === 'status' ? dialog.row : null}
        onToast={setToast}
      />
      <DeleteAttributeDialog
        open={dialog.kind === 'delete'}
        onClose={closeDialog}
        attribute={dialog.kind === 'delete' ? dialog.row : null}
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
