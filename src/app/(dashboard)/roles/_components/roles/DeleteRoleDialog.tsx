'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/controls';
import { useDeleteRoleMutation, useRoleDetailQuery } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeRoleDialog, selectRole } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import { machineCode } from '@/lib/utils';

/** Delete role — type-to-confirm proof; 409 names the blocking admin count. */
export function DeleteRoleDialog({
  notify,
  onDeleted,
}: {
  notify: (msg: string) => void;
  onDeleted?: () => void;
}) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activeRoleDialog) === 'delete';
  const roleKey = useAppSelector((s) => s.rbac.dialogRoleKey);
  const selectedKey = useAppSelector((s) => s.rbac.selectedRoleKey);
  const { data } = useRoleDetailQuery(roleKey ?? '', { skip: !open || !roleKey });
  const role = data?.data ?? null;

  const [error, setError] = useState<string | null>(null);
  const [triggerDelete, { isLoading }] = useDeleteRoleMutation();

  const close = () => {
    setError(null);
    dispatch(closeRoleDialog());
  };

  const confirm = async () => {
    if (!role) return;
    setError(null);
    try {
      await triggerDelete(role.key).unwrap();
      if (selectedKey === role.key) dispatch(selectRole(null));
      close();
      notify(`Role ${role.name} deleted. Logged to Activity log.`);
      onDeleted?.();
    } catch (err) {
      if (machineCode(err) === 'ROLE_HAS_ASSIGNMENTS') {
        setError(
          `Still assigned to ${role.assignedAdmins} admin${role.assignedAdmins === 1 ? '' : 's'} — remove the role from them first.`,
        );
      } else {
        setError(normaliseApiError(err).message);
      }
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={close}
      onConfirm={() => void confirm()}
      loading={isLoading}
      error={error}
      title={`Delete role — ${role?.name ?? ''}?`}
      confirmWord={role?.key ?? ''}
      confirmLabel="Delete role"
      consequence={
        <>
          <b>{role?.name}</b> disappears permanently with its{' '}
          <b>{role?.permissionCount ?? 0} permission grant{role?.permissionCount === 1 ? '' : 's'}</b>.
          Admins holding it keep their other roles; the key can never be reused with history.
        </>
      }
      description={
        <>
          Only roles with <b>zero assigned admins</b> can go. Type the role key to prove it, then
          confirm. Still assigned? <Link href="/admins">Open Admins</Link> to unassign first.
        </>
      }
    />
  );
}
