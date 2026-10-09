import type { Metadata } from 'next';
import { InviteAcceptView } from './_components/InviteAcceptView';

export const metadata: Metadata = {
  title: 'Accept invitation — Aurora Seller',
  description: 'Accept a team invitation to join a store.',
};

/** Server component — interactivity lives in _components/InviteAcceptView. */
export default function InviteAcceptPage() {
  return <InviteAcceptView />;
}
