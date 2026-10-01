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
  Tooltip,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { AccessDenied, usePermissions, useViewerIsSuperAdmin } from '@/components/auth/RbacGuard';
import { SearchField, SegmentedFilter, TableCard } from '@/components/ui/controls';
import { useListRolesQuery } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openRoleDialog, selectRole } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import type { Role, RoleStatus } from '@/types/rbac';
import { formatMonth } from '@/lib/utils';
import { mercatoTokens } from '@/lib/theme';

type StatusFilter = 'ALL' | RoleStatus;

function permTooltip(role: Role): string {
  if (role.permissions.length === 0) return 'No permissions granted';
  return role.permissions.join(', ');
}

/** Screen 1 — roles list: search + status filter + table + guarded row menu. */
export function RolesTable() {
  const dispatch = useAppDispatch();
  const { can } = usePermissions();
  const viewerIsSuperAdmin = useViewerIsSuperAdmin();
  const selectedKey = useAppSelector((s) => s.rbac.selectedRoleKey);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRole, setMenuRole] = useState<Role | null>(null);

  const { data, isLoading, isError, error, refetch } = useListRolesQuery();
  const roles = useMemo(() => data?.data ?? [], [data]);

  const counts = useMemo(
    () => ({
      total: roles.length,
      active: roles.filter((r) => r.status === 'ACTIVE').length,
      inactive: roles.filter((r) => r.status === 'INACTIVE').length,
    }),
    [roles],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.key.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roles, search, statusFilter]);

  const canCreate = can('role.create');
  const canUpdate = can('role.update');

  const openMenu = (e: React.MouseEvent<HTMLElement>, role: Role) => {
    setMenuRole(role);
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRole(null);
  };
  const act = (kind: 'clone' | 'status' | 'delete', role: Role) => {
    dispatch(selectRole(role.key));
    dispatch(openRoleDialog({ kind, roleKey: role.key }));
    closeMenu();
  };

  if (!isLoading && isError && normaliseApiError(error).status === 403) {
    return <AccessDenied description="You don't hold role.read — contact an administrator." />;
  }

  return (
    <TableCard
      title="Roles"
      subtitle={
        roles.length > 0
          ? `${roles.length} role${roles.length === 1 ? '' : 's'} · ${counts.inactive} inactive — select a row to edit its permissions below`
          : 'Roles live here once the first one is created.'
      }
      toolbar={
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <SegmentedFilter<StatusFilter>
            ariaLabel="Filter roles by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All', count: counts.total },
              { value: 'ACTIVE', label: 'Active', count: counts.active, dot: mercatoTokens.good },
              { value: 'INACTIVE', label: 'Inactive', count: counts.inactive, dot: mercatoTokens.faint },
            ]}
          />
          <Box sx={{ flex: 1 }} />
          <SearchField
            placeholder="Search name or key…"
            aria-label="Search roles by name or key"
            value={search}
            onChange={setSearch}
            minWidth={200}
          />
        </Box>
      }
      empty={{
        when: !isLoading && !isError && rows.length === 0,
        title: roles.length === 0 ? 'No roles yet' : 'No roles match these filters',
        description:
          roles.length === 0
            ? 'Create the first role to start granting permissions.'
            : 'Try a different name, status filter, or clear the search.',
      }}
    >
      {isLoading ? (
        <Box sx={{ mt: 1.5 }}>
          <DataLoader variant="skeleton" lines={4} label="Loading roles" />
        </Box>
      ) : isError ? (
        <Box sx={{ mt: 1.5 }}>
          <FallbackUI
            tone="error"
            title="Could not load roles"
            description={normaliseApiError(error).message}
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        </Box>
      ) : (
        <TableContainer sx={{ mt: 1.5, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
          <Table aria-label="Roles" sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Admins</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.key}
                  hover
                  selected={r.key === selectedKey}
                  sx={r.key === selectedKey ? { bgcolor: mercatoTokens.brandSoft } : undefined}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
                      {r.isSystem ? (
                        <Chip
                          label="System"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', bgcolor: mercatoTokens.text, color: '#fff' }}
                        />
                      ) : null}
                      {r.status === 'INACTIVE' ? (
                        <Chip
                          label="Inactive"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'action.hover', color: 'text.secondary' }}
                        />
                      ) : null}
                    </Box>
                    {r.description ? (
                      <Typography variant="caption" color="text.secondary">
                        {r.description}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace' }}>
                      {r.key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={permTooltip(r)} arrow>
                      <Typography sx={{ fontSize: '0.86rem', cursor: 'default' }}>
                        <b>{r.permissionCount}</b> permission{r.permissionCount === 1 ? '' : 's'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.86rem', fontVariantNumeric: 'tabular-nums' }}>
                      {r.assignedAdmins}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatMonth(r.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`Actions for ${r.name}`} aria-haspopup="menu" onClick={(e) => openMenu(e, r)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} aria-label="Role actions">
        <MenuItem
          onClick={() => {
            if (menuRole) dispatch(selectRole(menuRole.key));
            closeMenu();
            document.getElementById('role-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          View / edit permissions
        </MenuItem>
        {canCreate ? (
          <MenuItem onClick={() => menuRole && act('clone', menuRole)}>Clone</MenuItem>
        ) : null}
        {canUpdate && menuRole?.key !== 'super_admin' ? (
          <MenuItem onClick={() => menuRole && act('status', menuRole)}>
            {menuRole?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </MenuItem>
        ) : null}
        {canUpdate && viewerIsSuperAdmin && menuRole && !menuRole.isSystem && menuRole.assignedAdmins === 0 ? (
          <MenuItem onClick={() => act('delete', menuRole)} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        ) : null}
      </Menu>
    </TableCard>
  );
}
