import type { Metadata } from 'next';
import { DashboardView } from './_components/DashboardView';

export const metadata: Metadata = {
  title: 'Dashboard — Aurora Admin',
  description: 'Marketplace performance across sellers, shoppers, and revenue.',
};

/** Server component — interactivity lives in _components/DashboardView. */
export default function DashboardPage() {
  return <DashboardView />;
}
