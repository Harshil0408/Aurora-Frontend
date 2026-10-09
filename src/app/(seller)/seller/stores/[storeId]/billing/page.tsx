import type { Metadata } from 'next';
import { BillingView } from './_components/BillingView';

export const metadata: Metadata = {
  title: 'Billing — Aurora Seller',
  description: 'Subscription, trial countdown, and plan catalog.',
};

/** Server component — interactivity lives in _components/BillingView. */
export default function BillingPage() {
  return <BillingView />;
}
