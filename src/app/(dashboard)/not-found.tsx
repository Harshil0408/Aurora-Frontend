import { NotFoundPanel } from '@/components/ui/NotFoundPanel';

/**
 * 404 inside the admin group — also rendered when RBAC page guards call
 * `notFound()`, so unheld modules look non-existent rather than forbidden.
 */
export default function AdminNotFound() {
  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <NotFoundPanel />
    </main>
  );
}
