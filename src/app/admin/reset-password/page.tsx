import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';

export const metadata: Metadata = {
  title: 'Reset password — Aurora Admin',
  description: 'Set a new admin password from your reset email link.',
};

/**
 * Mail-link target: the reset email points here
 * (/admin/reset-password?token=…). Same form as /reset-password —
 * token comes from the query string and is never stored.
 */
function AdminResetContent({ token }: { token: string }) {
  if (!token) {
    return (
      <AuthCard eyebrow="Account recovery" title="Link incomplete" description="Open the reset link from your email.">
        <FallbackUI tone="error" title="Missing reset token" description="The link needs a token query parameter. Request a fresh link." />
      </AuthCard>
    );
  }
  return (
    <AuthCard eyebrow="Account recovery" title="Set a new password" description="Min 12 characters. All sessions are revoked after reset.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = '' } = await searchParams;
  return (
    <Suspense fallback={<DataLoader label="Loading reset form" />}>
      <AdminResetContent token={token} />
    </Suspense>
  );
}
