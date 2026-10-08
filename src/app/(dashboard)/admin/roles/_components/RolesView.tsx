'use client';

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { RbacGuard, usePermissions } from '@/components/auth/RbacGuard';
import { SegmentedFilter } from '@/components/ui/controls';
import { RolesSection } from './roles/RolesSection';
import { PermissionsSection } from './permissions/PermissionsSection';
import { useAppDispatch } from '@/store/hooks';
import { openRoleDialog } from '@/store/rbacSlice';

type Section = 'roles' | 'permissions';

/**
 * Roles & Permissions — two separate screens behind one switcher, both gated
 * on `role.read`. Section state is local (single use); the selected role and
 * open dialogs live in the Redux `rbac` slice shared by every component below.
 */
export function RolesView() {
  const [section, setSection] = useState<Section>('roles');
  const dispatch = useAppDispatch();
  const { can } = usePermissions();
  const canCreate = can('role.create');

  return (
    <RbacGuard perm="role.read">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="h1" component="h1">
            Roles &amp; Permissions
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
            Roles bundle permissions for admins; the catalog defines every authorizable action.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <SegmentedFilter<Section>
            ariaLabel="Choose Roles or Permissions screen"
            value={section}
            onChange={setSection}
            options={[
              { value: 'roles', label: 'Roles', ariaLabel: 'Show Roles screen' },
              { value: 'permissions', label: 'Permissions', ariaLabel: 'Show Permissions screen' },
            ]}
          />
          <Box sx={{ flex: 1 }} />
          {section === 'roles' && canCreate ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => dispatch(openRoleDialog({ kind: 'create' }))}
            >
              Create Role
            </Button>
          ) : null}
        </Box>

        {section === 'roles' ? <RolesSection /> : <PermissionsSection />}
      </Box>
    </RbacGuard>
  );
}
