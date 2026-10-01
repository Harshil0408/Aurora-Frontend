'use client';

import { useState } from 'react';
import { Box, Snackbar, Typography } from '@mui/material';
import { PermissionsTable } from './PermissionsTable';
import {
  DefinePermissionModal,
  DeletePermissionDialog,
  EditPermissionModal,
  PermissionStatusModal,
} from './PermissionModals';

/** Permissions screen — catalog table plus define/edit/status/delete dialogs. */
export function PermissionsSection() {
  const [toast, setToast] = useState<string | null>(null);
  const notify = (msg: string) => setToast(msg);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
        Every authorizable action, defined at runtime. New keys work immediately — no deploy.
      </Typography>

      <PermissionsTable />

      <DefinePermissionModal notify={notify} />
      <EditPermissionModal notify={notify} />
      <PermissionStatusModal notify={notify} />
      <DeletePermissionDialog notify={notify} />

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
