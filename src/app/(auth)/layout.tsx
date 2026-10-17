import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Auth pages are private console surfaces — never indexed.
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
