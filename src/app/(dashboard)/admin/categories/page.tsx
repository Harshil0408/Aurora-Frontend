import type { Metadata } from 'next';
import { CategoriesView } from './_components/CategoriesView';

export const metadata: Metadata = {
  title: 'Categories — Aurora Admin',
  description: 'Product taxonomy: tree, seller requests, and restricted access.',
};

/** Server component — interactivity lives in _components/CategoriesView. */
export default function CategoriesPage() {
  return <CategoriesView />;
}
