import type { Metadata } from 'next';
import { SellerLoginView } from './_components/SellerLoginView';

export const metadata: Metadata = {
  title: 'Seller sign in — Aurora',
  description: 'Sign in to your Aurora seller workspace.',
};

/** Server component — interactivity lives in _components/SellerLoginView. */
export default function SellerLoginPage() {
  return <SellerLoginView />;
}
