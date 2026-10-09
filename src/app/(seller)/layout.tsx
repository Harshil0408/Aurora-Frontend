import type { Metadata } from 'next';
import { SellerSessionGuard } from '@/components/seller/SellerGuards';
import { SellerShell } from '@/components/seller/SellerShell';

export const metadata: Metadata = {
  title: 'Seller console — Aurora',
  description: 'Manage your stores, team, roles, and billing.',
};

/** Seller workspace shell: session gate → store switcher + nav. */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerSessionGuard>
      <SellerShell>{children}</SellerShell>
    </SellerSessionGuard>
  );
}
