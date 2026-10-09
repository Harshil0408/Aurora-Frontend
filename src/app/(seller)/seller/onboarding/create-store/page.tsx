import type { Metadata } from 'next';
import { CreateStoreView } from './_components/CreateStoreView';

export const metadata: Metadata = {
  title: 'Create store — Aurora Seller',
  description: 'Open a new store on a 14-day Starter trial.',
};

/** Server component — interactivity lives in _components/CreateStoreView. */
export default function CreateStorePage() {
  return <CreateStoreView />;
}
