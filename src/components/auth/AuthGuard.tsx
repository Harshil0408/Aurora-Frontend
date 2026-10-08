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
import { PUBLIC_PREFIXES } from "@/lib/permissions";
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

  if (!isInitialised) return <PageLoader />;
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isAuthenticated && !isPublic)
    return <PageLoader label="Redirecting to sign in" />;
  return <>{children}</>;
}
