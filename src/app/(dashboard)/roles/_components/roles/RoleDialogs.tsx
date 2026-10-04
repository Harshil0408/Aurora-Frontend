'use client';

import { CreateRoleModal } from './CreateRoleModal';
import { CloneRoleModal } from './CloneRoleModal';
import { RoleStatusModal } from './RoleStatusModal';
import { DeleteRoleDialog } from './DeleteRoleDialog';
import { EditRoleMetaModal } from './EditRoleMetaModal';

/**
 * All role dialogs in one place — rendered by both the roles list and the
 * role detail page, so actions like "Edit name" work wherever they open.
 */
export function RoleDialogs({
  notify,
  onRoleDeleted,
}: {
  notify: (msg: string) => void;
  /** Called after a successful delete (e.g. leave the detail page). */
  onRoleDeleted?: () => void;
}) {
  return (
    <>
      <CreateRoleModal />
      <CloneRoleModal />
      <RoleStatusModal notify={notify} />
      <DeleteRoleDialog notify={notify} onDeleted={onRoleDeleted} />
      <EditRoleMetaModal notify={notify} />
    </>
  );
}
