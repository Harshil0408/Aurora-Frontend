import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Aurora Admin',
  description: 'Secure admin sign in with two-factor authentication.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
