'use client';

import { useMemo, useState } from 'react';
import { Box, Paper, Snackbar, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { RolesTable } from './RolesTable';
import { RoleDetail } from './RoleDetail';
import { CreateRoleModal } from './CreateRoleModal';
import { CloneRoleModal } from './CloneRoleModal';
import { RoleStatusModal } from './RoleStatusModal';
import { DeleteRoleDialog } from './DeleteRoleDialog';
import { EditRoleMetaModal } from './EditRoleMetaModal';
import { useListRolesQuery } from '@/services/rbacApi';
import { mercatoTokens } from '@/lib/theme';

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

/** Roles screen — summary strip, list table, detail matrix, and all role dialogs. */
export function RolesSection() {
  const [toast, setToast] = useState<string | null>(null);
  const notify = (msg: string) => setToast(msg);

  const { data } = useListRolesQuery();
  const roles = useMemo(() => data?.data ?? [], [data]);
  const systemCount = roles.filter((r) => r.isSystem).length;
  const inactiveCount = roles.filter((r) => r.status === 'INACTIVE').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Summary strip */}
      <Paper component="section" aria-label="Roles summary" sx={{ py: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              borderRadius: 2.5,
              bgcolor: mercatoTokens.brandSoft,
              color: 'primary.dark',
              flex: 'none',
            }}
          >
            <GroupIcon fontSize="small" />
          </Box>
          <MiniStat value={String(roles.length)} label="Total roles" />
          <MiniStat value={String(systemCount)} label="System" />
          <MiniStat value={String(roles.length - systemCount)} label="Custom" />
          <MiniStat value={String(inactiveCount)} label="Inactive" />
        </Box>
      </Paper>

      <RolesTable />
      <RoleDetail notify={notify} />

      <CreateRoleModal notify={notify} />
      <CloneRoleModal notify={notify} />
      <RoleStatusModal notify={notify} />
      <DeleteRoleDialog notify={notify} />
      <EditRoleMetaModal notify={notify} />

      <Snackbar
        open={toast != null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
