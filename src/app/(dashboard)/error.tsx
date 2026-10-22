'use client';

import { FallbackUI } from '@/components/ui/FallbackUI';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <FallbackUI
      tone="error"
      title="This page hit an error"
      description="Something went wrong while loading this section. Your session is still active — try again."
      actionLabel="Try again"
      onAction={reset}
    />
  );
}
