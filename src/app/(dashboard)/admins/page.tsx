import type { Metadata } from 'next';
import { AdminsView } from './_components/AdminsView';

export const metadata: Metadata = {
  title: 'Admins — Aurora Admin',
  description: 'Create admin accounts, change statuses, and manage role assignments.',
};

/** Server component — interactivity lives in _components/AdminsView. */
export default function AdminsPage() {
  return <AdminsView />;
}
