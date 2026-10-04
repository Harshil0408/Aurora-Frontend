'use client';

import { useCallback, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { Box, Button, Paper, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { PageLoader } from '@/components/ui/Loaders';
import { useMyPermissionsQuery } from '@/services/rbacApi';
import { useMeQuery } from '@/services/authApi';
import { useAppSelector } from '@/store/hooks';
import { isSuperAdminKey } from '@/types/admins';
import { mercatoTokens } from '@/lib/theme';

/**
 * Viewer permission set — source for the `can()` / `canAny()` UX checks.
 * Backed by RTK Query (`Me` tag): any RBAC mutation invalidates it, login
 * remounts it, and `refetchOnFocus` surfaces multi-tab revocations.
 * Frontend checks are UX only; the backend re-authorizes every request.
 */
export function usePermissions() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data, isLoading, isError, error, refetch } = useMyPermissionsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnFocus: true,
  });
  const set = useMemo(() => new Set(data?.data.permissions ?? []), [data]);
  const can = useCallback((key: string) => set.has(key), [set]);
  const canAny = useCallback((...keys: string[]) => keys.some((k) => set.has(k)), [set]);
  const errStatus = (error as { status?: number } | undefined)?.status;
  // A 403 on permissions/me means "no rights at all" — treat as empty set
  // so page guards 404 instead of spinning or crashing.
  const isForbidden = errStatus === 403;
  return { permissions: set, can, canAny, isLoading, isError, error, refetch, isForbidden };
}

/** True when the signed-in admin holds the Super Admin role. */
export function useViewerIsSuperAdmin(): boolean {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data } = useMeQuery(undefined, { skip: !isAuthenticated });
  return useMemo(() => (data?.data.roles ?? []).some((r) => isSuperAdminKey(r)), [data]);
}

/** Inline 403 — never log out, never retry blindly. */
export function AccessDenied({
  title = 'Access Denied',
  description = 'Your access changed or was never granted — contact an administrator.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Paper
      role="alert"
      aria-label={title}
      sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 0.5 }}
    >
      <Box
        aria-hidden
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          borderRadius: 3,
          bgcolor: mercatoTokens.badSoft,
          color: mercatoTokens.bad,
        }}
      >
        <LockIcon />
      </Box>
      <Typography variant="h2">{title}</Typography>
      <Typography color="text.secondary" sx={{ fontSize: '0.88rem', textAlign: 'center', maxWidth: 460 }}>
        {description}
      </Typography>
      {onRetry ? (
        <Button size="small" variant="outlined" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Paper>
  );
}

/**
 * Conditional renderer — hides UI the viewer cannot use.
 * Returns null while permissions resolve (never flash a forbidden button).
 * Use for every action button / menu item behind a permission.
 */
export function Can({
  perm,
  anyOf,
  children,
}: {
  perm?: string;
  anyOf?: string[];
  children: React.ReactNode;
}) {
  const { can, canAny, isLoading } = usePermissions();
  if (isLoading) return null;
  const ok = perm ? can(perm) : anyOf ? canAny(...anyOf) : true;
  if (!ok) return null;
  return <>{children}</>;
}

/**
 * Screen gate — renders children only when the viewer holds the key.
 * Missing access renders the Next.js 404 (`notFound()`), so unheld modules
 * look non-existent even when visited directly by URL.
 */
export function RbacGuard({
  perm,
  anyOf,
  children,
}: {
  perm?: string;
  anyOf?: string[];
  children: React.ReactNode;
}) {
  const { can, canAny, isLoading } = usePermissions();
  if (isLoading) return <PageLoader label="Checking your permissions" />;
  const ok = perm ? can(perm) : anyOf ? canAny(...anyOf) : true;
  if (!ok) notFound();
  return <>{children}</>;
}
