import { NotFoundPanel } from '@/components/ui/NotFoundPanel';

/**
 * 404 — also rendered for pages the viewer has no permission to see.
 * RBAC page guards call `notFound()`, so unheld modules look non-existent
 * rather than forbidden.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
      }}
    >
      <NotFoundPanel />
    </main>
  );
}
