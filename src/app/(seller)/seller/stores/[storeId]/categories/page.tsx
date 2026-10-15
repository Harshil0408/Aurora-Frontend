import type { Metadata } from 'next';
import { SellerCategoriesView } from './_components/SellerCategoriesView';

export const metadata: Metadata = {
  title: 'Categories — Aurora Seller',
  description: 'Browse the marketplace taxonomy, request categories, and manage restricted access.',
};

/** Server component — interactivity lives in _components/SellerCategoriesView. */
export default function SellerCategoriesPage() {
  return <SellerCategoriesView />;
}
