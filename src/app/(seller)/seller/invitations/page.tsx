import type { Metadata } from 'next';
import { InvitationsView } from './_components/InvitationsView';

export const metadata: Metadata = {
  title: 'Invitations — Aurora Seller',
  description: 'Accept or decline pending store invitations.',
};

/** Server component — interactivity lives in _components/InvitationsView. */
export default function InvitationsPage() {
  return <InvitationsView />;
}
