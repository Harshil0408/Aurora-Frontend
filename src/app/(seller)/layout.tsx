import type { Metadata } from 'next';
import { SellerSessionGuard } from '@/components/seller/SellerGuards';
import { SellerShell } from '@/components/seller/SellerShell';

export const metadata: Metadata = {
  // Seller console uses its own brand suffix (overrides the root template).
  title: { template: '%s — Aurora Seller', absolute: 'Seller console — Aurora' },
  description: 'Manage your stores, team, roles, and billing.',
  // Private console — never indexed (headers add X-Robots-Tag too).
  robots: { index: false, follow: false },
};

/** Seller workspace shell: session gate → store switcher + nav. */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerSessionGuard>
      <SellerShell>{children}</SellerShell>
    </SellerSessionGuard>
  );
}
