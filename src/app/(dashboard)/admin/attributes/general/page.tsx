import type { Metadata } from 'next';
import { GeneralAttributesView } from './_components/GeneralAttributesView';

export const metadata: Metadata = {
  title: 'General Lookups — Aurora Admin',
  description: 'Shared platform lists: store categories, languages, payment types, currencies, countries, timezones.',
};

/** Server component — interactivity lives in _components/GeneralAttributesView. */
export default function GeneralAttributesPage() {
  return <GeneralAttributesView />;
}
