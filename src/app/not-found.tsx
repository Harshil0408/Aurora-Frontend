import Link from 'next/link';
import { ADMIN_HOME_PATH } from '@/lib/panels';

/**
 * 404 — also rendered for pages the viewer has no permission to see.
 * RBAC page guards call `notFound()`, so unheld modules look non-existent
 * rather than forbidden. Keep the copy neutral: never confirm nor deny
 * whether the path exists.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <div>
        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          Error 404
        </p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.5rem 0' }}>
          This page could not be found
        </h1>
        <p style={{ opacity: 0.7, maxWidth: 440, margin: '0 auto 1.25rem' }}>
          It may have moved, or you may not have access to it. If you believe
          this is a mistake, contact an administrator.
        </p>
        <Link
          href={ADMIN_HOME_PATH}
          style={{
            display: 'inline-block',
            padding: '0.6rem 1.25rem',
            borderRadius: 9999,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
