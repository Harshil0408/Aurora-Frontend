'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { RbacGuard } from '@/components/auth/RbacGuard';
import { RoleDetail } from '../../_components/roles/RoleDetail';
import { RoleDialogs } from '../../_components/roles/RoleDialogs';

/**
 * Role detail page — reached from the roles table ("View / edit
 * permissions") and from create/clone flows. Hosts the role header,
 * permission matrix + save bar, back navigation, and the role dialogs.
 */
export function RoleDetailPageView({ roleKey }: { roleKey: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const notify = (msg: string) => setToast(msg);

  return (
    <RbacGuard perm="role.read">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ mt: 0.5 }}>
          <Button
            component={Link}
            href="/roles"
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{ ml: -1 }}
          >
            All roles
          </Button>
        </Box>

        <RoleDetail roleKey={roleKey} notify={notify} />

        <RoleDialogs notify={notify} onRoleDeleted={() => router.push('/roles')} />

        <Snackbar
          open={toast != null}
          autoHideDuration={4000}
          onClose={() => setToast(null)}
          message={toast ?? ''}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </RbacGuard>
  );
}
