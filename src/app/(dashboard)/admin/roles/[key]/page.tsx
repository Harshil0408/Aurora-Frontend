import type { Metadata } from 'next';
import { RoleDetailPageView } from './_components/RoleDetailPageView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const roleKey = decodeURIComponent(key);
  return {
    title: `Role ${roleKey} — Aurora Admin`,
    description: `Permission matrix and management for the ${roleKey} role.`,
  };
}

/** Server component — interactivity lives in _components/RoleDetailPageView. */
export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  return <RoleDetailPageView roleKey={decodeURIComponent(key)} />;
}
