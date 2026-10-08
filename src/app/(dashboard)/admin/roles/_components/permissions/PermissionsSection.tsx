'use client';

import { Box, Typography } from '@mui/material';
import { PermissionsTable } from './PermissionsTable';

/**
 * Permissions screen — read-only catalog reference. Keys are code-defined +
 * seeded by the backend (no create/edit/delete API), so this screen explains
 * that and links granting to the Roles matrix.
 */
export function PermissionsSection() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
        Every authorizable action, defined in code and seeded by the backend. Keys
        can&apos;t be created, edited, or deleted from the admin panel — to change
        what a role can do, edit its matrix on the Roles screen.
      </Typography>

      <PermissionsTable />
    </Box>
  );
}
