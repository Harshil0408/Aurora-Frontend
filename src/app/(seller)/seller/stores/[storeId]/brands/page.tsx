import type { Metadata } from 'next';
import { SellerBrandsView } from './_components/SellerBrandsView';

export const metadata: Metadata = {
  title: 'Brands',
  description: 'The marketplace brand master: browse, request, authorise.',
};

/** Server component — interactivity lives in _components/SellerBrandsView. */
export default function SellerBrandsPage() {
  return <SellerBrandsView />;
}
