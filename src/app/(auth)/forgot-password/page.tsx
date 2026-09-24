import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password — Aurora Admin',
  description: 'Request an admin password reset link.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard eyebrow="Account recovery" title="Forgot password" description="We will email you a one-hour reset link if the account exists.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
