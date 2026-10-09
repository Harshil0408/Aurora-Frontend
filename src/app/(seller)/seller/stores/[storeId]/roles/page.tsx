import type { Metadata } from 'next';
import { RolesView } from './_components/RolesView';

export const metadata: Metadata = {
  title: 'Roles & permissions — Aurora Seller',
  description: 'Custom roles and the live permission matrix.',
};

/** Server component — interactivity lives in _components/RolesView. */
export default function RolesPage() {
  return <RolesView />;
}
