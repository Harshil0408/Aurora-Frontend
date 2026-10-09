import type { Metadata } from 'next';
import { ActivityView } from './_components/ActivityView';

export const metadata: Metadata = {
  title: 'Activity — Aurora Seller',
  description: 'Store audit feed: changes, invitations, and role edits.',
};

/** Server component — interactivity lives in _components/ActivityView. */
export default function ActivityPage() {
  return <ActivityView />;
}
