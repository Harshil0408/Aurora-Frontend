import type { Metadata } from 'next';
import { SellerRegisterView } from './_components/SellerRegisterView';

export const metadata: Metadata = {
  title: 'Create seller account — Aurora',
  description: 'Register for an Aurora seller account.',
};

/** Server component — interactivity lives in _components/SellerRegisterView. */
export default function SellerRegisterPage() {
  return <SellerRegisterView />;
}
