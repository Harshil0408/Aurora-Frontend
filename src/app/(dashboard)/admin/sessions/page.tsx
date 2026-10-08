import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DataLoader } from '@/components/ui/DataLoader';
import { SessionsView } from './_components/SessionsView';

export const metadata: Metadata = {
  title: 'Sessions — Aurora Admin',
  description: 'Active admin sign-ins across browsers and devices.',
};

/**
 * Server component — streams the shell instantly and resolves the client
 * view (which fetches sessions via RTK Query) inside Suspense.
 * True server-side data prefetch is not possible here: the access token
 * lives only in browser memory and the refresh cookie is scoped to the
 * backend domain, so the Next.js server has no credentials to call
 * /admin/auth/sessions with. Initial data therefore loads client-side.
 */
export default function SessionsPage() {
  return (
    <Suspense fallback={<DataLoader label="Loading sessions" />}>
      <SessionsView />
    </Suspense>
  );
}
