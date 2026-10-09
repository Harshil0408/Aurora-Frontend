'use client';

import { useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { DataLoader } from '@/components/ui/DataLoader';
import { PageLoader } from '@/components/ui/Loaders';
import {
  bootstrapSellerSession,
  clearSellerAuth,
  hasSellerSessionHint,
  markSellerInitialised,
} from '@/store/sellerAuthSlice';
import {
  clearActiveStore,
  setActiveStore,
  setSwitchError,
  hasSellerPermission,
} from '@/store/sellerStoreSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { api } from '@/services/api';
import { useSellerLogoutMutation } from '@/services/sellerAuthApi';
import { useSellerSwitchStoreMutation } from '@/services/sellerStoresApi';
import type { RootState } from '@/store';
import { SELLER_CREATE_STORE_PATH, SELLER_LOGIN_PATH, SELLER_HOME_PATH } from '@/lib/panels';
import { normaliseApiError } from '@/types/api';

/**
 * Seller session gate — mirrors `AuthGuard` for the `/seller` panel.
 * Bootstraps via `POST /seller/auth/refresh` (cookie `seller_rt`) when the
 * hint exists, then redirects anonymous visits to seller login with `?next=`.
 */
export function SellerSessionGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialised } = useAppSelector((s: RootState) => s.sellerAuth);

  useEffect(() => {
    if (!hasSellerSessionHint()) {
      dispatch(markSellerInitialised());
      return;
    }
    void dispatch(bootstrapSellerSession());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialised || isAuthenticated) return;
    router.replace(`${SELLER_LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, isInitialised, pathname, router]);

  if (!isInitialised) return <PageLoader label="Preparing your seller workspace" />;
  if (!isAuthenticated) return <PageLoader label="Redirecting to seller sign in" />;
  return <>{children}</>;
}

/** `can()` gating — UX only; the backend re-validates every request. */
export function useSellerCan(): {
  can: (perm: string) => boolean;
  permissions: string[];
  roleKey: string | null;
} {
  const active = useAppSelector((s: RootState) => s.sellerStore.active);
  const can = useCallback((perm: string) => hasSellerPermission(active, perm), [active]);
  const permissions = useMemo(() => active?.permissions ?? [], [active]);
  return { can, permissions, roleKey: active?.roleKey ?? null };
}

/** "No access" panel for 403s — hand-edited URL to a foreign store. */
export function SellerNoAccess({ storeId }: { storeId?: string }) {
  return (
    <Paper role="alert" sx={{ p: 3, mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="h2">You don&apos;t have access to this store</Typography>
      <Typography color="text.secondary" sx={{ fontSize: '0.88rem', maxWidth: 560 }}>
        {storeId
          ? `Store “${storeId}” either doesn't exist or your account isn't a member of it.`
          : 'This store either doesn’t exist or your account isn’t a member of it.'}{' '}
        Ask the store owner for an invitation, or switch to one of your stores.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button component={Link} href={SELLER_HOME_PATH} size="small" variant="contained">
          My stores
        </Button>
        <Button component={Link} href={SELLER_CREATE_STORE_PATH} size="small" variant="outlined">
          Create a store
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * Store membership gate for `[storeId]` layouts.
 * Route-guard order per page: auth → join-intent (token/pending, resolved at
 * landing) → membership (`switch`) → permission (`can()`).
 */
export function StoreGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const params = useParams<{ storeId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const active = useAppSelector((s: RootState) => s.sellerStore.active);
  const switchError = useAppSelector((s: RootState) => s.sellerStore.switchError);
  const storeId = params?.storeId;
  const [switchStore, { isLoading }] = useSellerSwitchStoreMutation();

  useEffect(() => {
    if (!storeId) return;
    if (active?.storeId === storeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await switchStore({ storeId }).unwrap();
        if (cancelled) return;
        dispatch(
          setActiveStore({
            storeId: res.data.storeId,
            name: res.data.name,
            slug: res.data.slug,
            status: res.data.status,
            roleKey: res.data.roleKey,
            permissions: res.data.permissions,
            subscription: res.data.subscription,
          }),
        );
      } catch (err) {
        if (cancelled) return;
        const norm = normaliseApiError((err as { status?: number; data?: unknown }) ?? {});
        if (norm.status === 401) {
          router.replace(`${SELLER_LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (norm.status === 404) dispatch(setSwitchError('notfound'));
        else dispatch(setSwitchError('forbidden'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, active?.storeId, switchStore, dispatch, router, pathname]);

  if (!storeId) return <>{fallback ?? <SellerNoAccess />}</>;
  if (switchError) return <>{fallback ?? <SellerNoAccess storeId={storeId} />}</>;
  if (!active || active.storeId !== storeId) {
    if (isLoading || !switchError) return <DataLoader label="Opening your store" />;
    return <>{fallback ?? <SellerNoAccess storeId={storeId} />}</>;
  }
  return <>{children}</>;
}

/** Inline 403 with a permission resync hint (role may change mid-session). */
export function SellerForbidden({ onResync }: { onResync?: () => void }) {
  return (
    <Alert
      severity="warning"
      action={
        onResync ? (
          <Button size="small" color="inherit" onClick={onResync}>
            Retry
          </Button>
        ) : undefined
      }
    >
      Your role changed or this action isn&apos;t allowed for your role. Your permissions were
      re-checked — contact the store owner if you need access.
    </Alert>
  );
}

/**
 * Seller sign-out — revokes the session, drops the in-memory token + hint,
 * clears the active store, and resets cached API data so no account state
 * leaks across sign-ins (used by plain logout and invite switch-account).
 */
export function useSellerSignOut(): {
  signOut: (next?: string) => Promise<void>;
  signingOut: boolean;
} {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useSellerLogoutMutation();

  const signOut = useCallback(
    async (next?: string) => {
      try {
        await logout().unwrap();
      } catch {}
      dispatch(clearSellerAuth());
      dispatch(clearActiveStore());
      dispatch(api.util.resetApiState());
      router.replace(next ?? SELLER_LOGIN_PATH);
    },
    [dispatch, router, logout],
  );

  return { signOut, signingOut: isLoading };
}
