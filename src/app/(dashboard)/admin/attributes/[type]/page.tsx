import type { Metadata } from 'next';
import { AttributeTypeView } from './_components/AttributeTypeView';

export const metadata: Metadata = {
  title: 'Lookup Entries — Aurora Admin',
  description: 'Search, add, edit, and toggle entries of one attribute type.',
};

/** Server component — interactivity lives in _components/AttributeTypeView. */
export default async function AttributeTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const resolved = await params;
  const type = decodeURIComponent(resolved?.type ?? '');
  return <AttributeTypeView type={type} />;
}
