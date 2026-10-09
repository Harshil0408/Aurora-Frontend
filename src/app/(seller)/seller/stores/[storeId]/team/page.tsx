import type { Metadata } from 'next';
import { TeamView } from './_components/TeamView';

export const metadata: Metadata = {
  title: 'Team — Aurora Seller',
  description: 'Invite members, manage roles, and track invitations.',
};

/** Server component — interactivity lives in _components/TeamView. */
export default function TeamPage() {
  return <TeamView />;
}
