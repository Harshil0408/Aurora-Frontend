import type { Metadata } from 'next';
import { SecurityView } from './_components/SecurityView';

export const metadata: Metadata = {
  title: 'Security — Aurora Admin',
  description: 'Two-factor methods, password, and your roles and access.',
};

/** Server component — interactivity lives in _components/SecurityView. */
export default function SecurityPage() {
  return <SecurityView />;
}
