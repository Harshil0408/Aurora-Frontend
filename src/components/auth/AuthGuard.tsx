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

const PUBLIC_PREFIXES = ["/login", "/forgot-password", "/reset-password", "/admin/reset-password"];

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
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (isAuthenticated && pathname === "/login") {
      const next =
        new URLSearchParams(window.location.search).get("next") || "/dashboard";
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
