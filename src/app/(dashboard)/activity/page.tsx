import type { Metadata } from 'next';
import { ActivityView } from './_components/ActivityView';

export const metadata: Metadata = {
  title: 'Activity Log — Aurora Admin',
  description: 'Who changed what, when, and from where.',
};

/** Server component — interactivity lives in _components/ActivityView. */
export default function ActivityPage() {
  return <ActivityView />;
}
