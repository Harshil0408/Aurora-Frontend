import type { Metadata } from 'next';
import { AttributesView } from './_components/AttributesView';
import type { AttributeScopeParam } from './_components/AttributesView';

export const metadata: Metadata = {
  title: 'Attributes — Aurora Admin',
  description: 'Global lookup catalog: every platform dropdown, namespaced by type.',
};

const VALID_SCOPES: AttributeScopeParam[] = ['admin', 'seller', 'user'];

/** Server component — interactivity lives in _components/AttributesView. */
export default async function AttributesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const resolved = await searchParams;
  const raw = resolved?.scope;
  const scope: AttributeScopeParam | null =
    raw != null && (VALID_SCOPES as string[]).includes(raw) ? (raw as AttributeScopeParam) : null;
  return <AttributesView scope={scope} />;
}
