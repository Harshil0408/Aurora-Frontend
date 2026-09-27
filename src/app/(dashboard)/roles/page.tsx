import type { Metadata } from 'next';
import { RolesView } from './_components/RolesView';

export const metadata: Metadata = {
  title: 'Roles & Permissions — Aurora Admin',
  description: 'System and custom roles with their permission sets.',
};

/** Server component — interactivity lives in _components/RolesView. */
export default function RolesPage() {
  return <RolesView />;
}
