'use client';

import { FallbackUI } from '@/components/ui/FallbackUI';

/** Route-level error boundary for the auth group. */
export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <FallbackUI
        tone="error"
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. Try again, or go back to sign in."
        actionLabel="Try again"
        onAction={reset}
      />
    </main>
  );
}
