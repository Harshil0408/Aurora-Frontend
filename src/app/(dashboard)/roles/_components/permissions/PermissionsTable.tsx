'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { AccessDenied, usePermissions, useViewerIsSuperAdmin } from '@/components/auth/RbacGuard';
import { SearchField, SegmentedFilter, TableCard } from '@/components/ui/controls';
import { useListPermissionsQuery } from '@/services/rbacApi';
import { useAppDispatch } from '@/store/hooks';
import { openPermissionDialog } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import type { Permission, PermissionStatus } from '@/types/rbac';
import { formatMonth } from '@/lib/utils';
import { mercatoTokens } from '@/lib/theme';

type StatusFilter = 'ALL' | PermissionStatus;

/** Permissions catalog table — search + status filter + guarded row menu. */
export function PermissionsTable() {
  const dispatch = useAppDispatch();
  const { can } = usePermissions();
  const viewerIsSuperAdmin = useViewerIsSuperAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPerm, setMenuPerm] = useState<Permission | null>(null);

  const { data, isLoading, isError, error, refetch } = useListPermissionsQuery(undefined);
  const permissions = useMemo(() => data?.data ?? [], [data]);

  const counts = useMemo(
    () => ({
      total: permissions.length,
      active: permissions.filter((p) => p.status === 'ACTIVE').length,
      inactive: permissions.filter((p) => p.status === 'INACTIVE').length,
    }),
    [permissions],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return permissions.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (
        q &&
        !p.key.toLowerCase().includes(q) &&
        !(p.label ?? '').toLowerCase().includes(q) &&
        !p.module.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [permissions, search, statusFilter]);

  const canUpdate = can('role.update');

  const openMenu = (e: React.MouseEvent<HTMLElement>, perm: Permission) => {
    setMenuPerm(perm);
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuPerm(null);
  };

  if (!isLoading && isError && normaliseApiError(error).status === 403) {
    return <AccessDenied description="You don't hold role.read — contact an administrator." />;
  }

  return (
    <TableCard
      title="Permission catalog"
      subtitle={
        permissions.length > 0
          ? `${permissions.length} permission${permissions.length === 1 ? '' : 's'} · ${counts.inactive} disabled — keys are permanent, labels are editable`
          : 'Permissions live here once the first one is defined.'
      }
      toolbar={
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <SegmentedFilter<StatusFilter>
            ariaLabel="Filter permissions by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All', count: counts.total },
              { value: 'ACTIVE', label: 'Active', count: counts.active, dot: mercatoTokens.good },
              { value: 'INACTIVE', label: 'Disabled', count: counts.inactive, dot: mercatoTokens.faint },
            ]}
          />
          <Box sx={{ flex: 1 }} />
          <SearchField
            placeholder="Search key, label, or module…"
            aria-label="Search permissions"
            value={search}
            onChange={setSearch}
            minWidth={220}
          />
        </Box>
      }
      empty={{
        when: !isLoading && !isError && rows.length === 0,
        title: permissions.length === 0 ? 'No permissions yet' : 'No permissions match these filters',
        description:
          permissions.length === 0
            ? 'Define the first permission — it becomes assignable to roles immediately.'
            : 'Try a different term or status filter.',
      }}
    >
      {isLoading ? (
        <Box sx={{ mt: 1.5 }}>
          <DataLoader variant="skeleton" lines={4} label="Loading permissions" />
        </Box>
      ) : isError ? (
        <Box sx={{ mt: 1.5 }}>
          <FallbackUI
            tone="error"
            title="Could not load permissions"
            description={normaliseApiError(error).message}
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        </Box>
      ) : (
        <TableContainer sx={{ mt: 1.5, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
          <Table aria-label="Permissions" sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Permission</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.key} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{p.label ?? p.key}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'ui-monospace, monospace' }}>
                      {p.key}
                    </Typography>
                    {p.description ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {p.description}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Chip label={p.module} size="small" variant="outlined" sx={{ height: 22 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={p.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                        size="small"
                        sx={
                          p.status === 'ACTIVE'
                            ? { height: 22, fontSize: '0.7rem', bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }
                            : { height: 22, fontSize: '0.7rem', bgcolor: 'action.hover', color: 'text.secondary' }
                        }
                      />
                      {p.isSystem ? (
                        <Chip label="System" size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: mercatoTokens.text, color: '#fff' }} />
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.86rem', fontVariantNumeric: 'tabular-nums' }}>
                      {p.roleCount}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatMonth(p.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`Actions for ${p.key}`} aria-haspopup="menu" onClick={(e) => openMenu(e, p)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} aria-label="Permission actions">
        {canUpdate ? (
          <MenuItem
            onClick={() => {
              if (menuPerm) dispatch(openPermissionDialog({ kind: 'edit', permissionKey: menuPerm.key }));
              closeMenu();
            }}
          >
            Edit label
          </MenuItem>
        ) : null}
        {canUpdate ? (
          <MenuItem
            onClick={() => {
              if (menuPerm) dispatch(openPermissionDialog({ kind: 'status', permissionKey: menuPerm.key }));
              closeMenu();
            }}
          >
            {menuPerm?.status === 'ACTIVE' ? 'Disable' : 'Re-enable'}
          </MenuItem>
        ) : null}
        {canUpdate && viewerIsSuperAdmin && menuPerm && !menuPerm.isSystem && menuPerm.roleCount === 0 ? (
          <MenuItem
            onClick={() => {
              if (menuPerm) dispatch(openPermissionDialog({ kind: 'delete', permissionKey: menuPerm.key }));
              closeMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        ) : null}
      </Menu>
    </TableCard>
  );
}
