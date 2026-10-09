import type { Metadata } from 'next';
import { StoresView } from './_components/StoresView';

export const metadata: Metadata = {
  title: 'My stores — Aurora Seller',
  description: 'All stores this seller account belongs to.',
};

/** Server component — interactivity lives in _components/StoresView. */
export default function StoresPage() {
  return <StoresView />;
}
