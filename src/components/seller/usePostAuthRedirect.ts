'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLazySellerMeQuery } from '@/services/sellerAuthApi';
import {
  useLazySellerPendingInvitationsQuery,
  useSellerAcceptInvitationMutation,
} from '@/services/sellerTeamApi';
import { clearInviteToken, peekInviteToken, resolveSellerLanding } from '@/lib/seller';
import { getLastUsedStoreId } from '@/store/sellerStoreSlice';
import { normaliseApiError } from '@/types/api';
import {
  SELLER_CREATE_STORE_PATH,
  SELLER_HOME_PATH,
  SELLER_INVITATIONS_PATH,
  sellerDashboardPath,
} from '@/lib/panels';

/**
 * Post-login/register continuation — join intent beats everything (§4.4):
 *
 * 1. Stashed invite token? POST accept → dashboard (200). 403 (wrong email)
 *    keeps the stash and lands on the inbox with switch-account messaging.
 *    400/expired/network clears the stash and falls through below.
 * 2. Explicit `?next=` (middleware deep link, no token)? Honor it.
 * 3. Pending inbox non-empty? → invitations join screen.
 * 4. Stores exist? → last-used (or first) dashboard.
 * 5. Else → create-store onboarding.
 *
 * Never strands invitees on create-store while a token or invite is unresolved.
 */
export function usePostAuthRedirect() {
  const router = useRouter();
  const [accept] = useSellerAcceptInvitationMutation();
  const [fetchMe] = useLazySellerMeQuery();
  const [fetchPending] = useLazySellerPendingInvitationsQuery();

  return useCallback(
    async (next?: string | null): Promise<void> => {
      const token = peekInviteToken();
      if (token) {
        try {
          const res = await accept({ token }).unwrap();
          clearInviteToken();
          router.replace(sellerDashboardPath(res.data.storeId));
          return;
        } catch (err) {
          const status = normaliseApiError(err as { status?: number; data?: unknown }).status;
          if (status === 403) {
            router.replace(`${SELLER_INVITATIONS_PATH}?wrongEmail=1`);
            return;
          }
          clearInviteToken();
        }
      }
      if (next && next.startsWith('/seller/')) {
        router.replace(next);
        return;
      }
      try {
        const [me, pending] = await Promise.all([fetchMe(undefined).unwrap(), fetchPending(undefined).unwrap()]);
        const landing = resolveSellerLanding({
          pendingCount: (pending.data ?? []).length,
          storeIds: (me.data.stores ?? []).map((s) => s.storeId),
          lastUsedStoreId: getLastUsedStoreId(),
        });
        if (landing.kind === 'invitations') router.replace(SELLER_INVITATIONS_PATH);
        else if (landing.kind === 'dashboard') router.replace(sellerDashboardPath(landing.storeId));
        else router.replace(SELLER_CREATE_STORE_PATH);
      } catch {
        // Resolution data failed (offline?) — the stores page owns retry UI.
        router.replace(SELLER_HOME_PATH);
      }
    },
    [router, accept, fetchMe, fetchPending],
  );
}
