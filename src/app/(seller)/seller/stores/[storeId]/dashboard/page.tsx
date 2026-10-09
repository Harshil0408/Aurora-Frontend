import type { Metadata } from 'next';
import { StoreDashboardView } from './_components/StoreDashboardView';

export const metadata: Metadata = {
  title: 'Store dashboard — Aurora Seller',
  description: 'Onboarding, subscription, and workspace overview for one store.',
};

/** Server component — interactivity lives in _components/StoreDashboardView. */
export default function StoreDashboardPage() {
  return <StoreDashboardView />;
}
