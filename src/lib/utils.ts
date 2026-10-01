import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { normaliseApiError } from '@/types/api';

/** "Mar 2023" — short month stamp for table cells. */
export function formatMonth(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM yyyy');
  } catch {
    return iso;
  }
}

/** Machine code from `error.code` (HTTP enum sits in `error.code`). */
export function machineCode(err: unknown): string | undefined {
  const code = normaliseApiError(err).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Reset-on-change for dialog/draft state (render-phase, no effect).
 * Runs `reset` when `key` changes — e.g. form prefill when async data
 * arrives, or draft resync when another role is selected. Prefer this over
 * `setState` inside `useEffect` (banned by `react-hooks/set-state-in-effect`).
 */
export function useResetKey(key: string | null, reset: () => void): void {
  // NOTE: `last` starts as null (never a real key) so mount-with-data still
  // syncs — initializing from `key` would skip the first reset when data is
  // already present on mount (e.g. cached queries, tests).
  const [last, setLast] = useState<string | null>(null);
  if (key !== last) {
    setLast(key);
    reset();
  }
}

/** "Mar 4, 2026 · 14:02" — full stamp for detail rows. "—" when empty. */
export function formatDay(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · HH:mm');
  } catch {
    return iso;
  }
}
