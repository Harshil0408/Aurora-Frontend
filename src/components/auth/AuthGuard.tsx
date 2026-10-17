"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  bootstrapSession,
  hasSessionHint,
  markInitialised,
} from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { PageLoader } from "@/components/ui/Loaders";
import { RootState } from "@/store";
import { PUBLIC_PREFIXES, isSellerRoute } from "@/lib/permissions";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/panels";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialised } = useAppSelector(
    (s: RootState) => s.auth,
  );

  useEffect(() => {
    if (!hasSessionHint()) {
      dispatch(markInitialised());
      return;
    }
    void dispatch(bootstrapSession());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialised) return;
    // Seller routes are gated by `SellerSessionGuard` (own refresh cookie
    // `seller_rt`) — the admin gate must not redirect them to /admin/login.
    if (isSellerRoute(pathname)) return;
    const isPublic = PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (!isAuthenticated && !isPublic) {
      router.replace(`${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
    } else if (isAuthenticated && pathname === ADMIN_LOGIN_PATH) {
      const next =
        new URLSearchParams(window.location.search).get("next") || ADMIN_HOME_PATH;
      router.replace(next);
    }
  }, [isAuthenticated, isInitialised, pathname, router]);

  // Seller panel renders its own loaders/guards client-side.
  if (isSellerRoute(pathname)) return <>{children}</>;
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  // Public pages render immediately — the server HTML already contains the
  // real content, so the LCP element paints with the first response instead
  // of waiting for hydration + session bootstrap. An already-authenticated
  // visitor is still redirected away by the effect above once init resolves.
  if (isPublic) return <>{children}</>;
  if (!isInitialised) return <PageLoader />;
  if (!isAuthenticated)
    return <PageLoader label="Redirecting to sign in" />;
  return <>{children}</>;
}
