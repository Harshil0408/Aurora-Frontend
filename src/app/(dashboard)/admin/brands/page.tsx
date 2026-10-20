import type { Metadata } from 'next';
import { BrandsView } from './_components/BrandsView';

export const metadata: Metadata = {
  title: 'Brands',
  description: 'The brand master: CRUD, merges, seller requests, and authorisations.',
};

/** Server component — interactivity lives in _components/BrandsView. */
export default function BrandsPage() {
  return <BrandsView />;
}
