"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import StoreIcon from "@mui/icons-material/Store";
import AddIcon from "@mui/icons-material/Add";
import { DataLoader } from "@/components/ui/DataLoader";
import { GuideAccordion, HowRow } from "@/components/ui/Guide";
import { useSellerStoresQuery } from "@/services/sellerStoresApi";
import { useSellerPendingInvitationsQuery } from "@/services/sellerTeamApi";
import {
  SELLER_CREATE_STORE_PATH,
  SELLER_INVITATIONS_PATH,
  SELLER_INVITE_ACCEPT_PATH,
  sellerDashboardPath,
} from "@/lib/panels";
import { peekInviteToken, trialDaysLeft } from "@/lib/seller";
import { normaliseApiError } from "@/types/api";

export function StoresView() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useSellerStoresQuery();

  const stores = data?.data ?? [];
  // Join intent beats everything: only resolve the inbox when there is nothing
  // to open — but never route to create-store while invites are pending.
  const pendingQuery = useSellerPendingInvitationsQuery(undefined, {
    skip: isLoading || isError || stores.length > 0,
  });
  const pendingCount = pendingQuery.data?.data.length ?? 0;

  useEffect(() => {
    // A stashed token (e.g. bookmarked landing) funnels through the single
    // auto-accept page instead of stranding the user here.
    const token = peekInviteToken();
    if (token) {
      router.replace(`${SELLER_INVITE_ACCEPT_PATH}?token=${encodeURIComponent(token)}`);
      return;
    }
    if (!isLoading && !isError && stores.length === 0 && !pendingQuery.isLoading) {
      if (pendingQuery.isError || pendingCount === 0) {
        // Pending lookup failed → fail open to the previous behavior rather
        // than blocking onboarding on an inbox we couldn't read.
        router.replace(SELLER_CREATE_STORE_PATH);
      } else {
        router.replace(SELLER_INVITATIONS_PATH);
      }
    }
  }, [isLoading, isError, stores.length, pendingQuery.isLoading, pendingQuery.isError, pendingCount, router]);

  if (isLoading)
    return <DataLoader label="Loading your stores" variant="skeleton" />;

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" color="inherit" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Couldn&apos;t load your stores —{" "}
        {
          normaliseApiError(error as { status?: number; data?: unknown })
            .message
        }
      </Alert>
    );
  }

  if (stores.length === 0)
    return <DataLoader label="Setting up your first store" />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.5,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: "1.4rem" }}>
            My stores
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.86rem", mt: 0.25 }}
          >
            {stores.length} store{stores.length === 1 ? "" : "s"} · each store
            has its own role and permissions.
          </Typography>
        </Box>
        <Button
          component={Link}
          href={SELLER_CREATE_STORE_PATH}
          size="small"
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
        >
          New store
        </Button>
      </Box>

      <GuideAccordion title="How stores work — what it is and how it works">
        <HowRow n={1}>
          A store is your workspace: products, orders, team, and billing all
          live inside one store.
        </HowRow>
        <HowRow n={2}>
          Pick a store to open its dashboard — the sidebar switches with you.
          One account can belong to many stores with a different role in each.
        </HowRow>
        <HowRow n={3}>
          Every store starts on a 14-day Starter trial; payment comes later and
          never blocks setup.
        </HowRow>
        <HowRow n={4}>
          Invited somewhere new? Pending invitations land in your inbox first —
          joining never requires creating a store.
        </HowRow>
      </GuideAccordion>

      {pendingCount > 0 ? (
        <Alert
          severity="info"
          action={
            <Button
              size="small"
              color="inherit"
              component={Link}
              href={SELLER_INVITATIONS_PATH}
            >
              Review
            </Button>
          }
        >
          You have {pendingCount} pending invitation
          {pendingCount === 1 ? "" : "s"} waiting.
        </Alert>
      ) : null}

      <Grid container spacing={1.5}>
        {stores.map((s) => {
          const left = trialDaysLeft(s.subscription?.trialEnd);
          return (
            <Grid key={s.storeId} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StoreIcon fontSize="small" color="primary" />
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: "1rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={s.roleName}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={s.status}
                      variant="outlined"
                    />
                    {s.subscription ? (
                      <Chip
                        size="small"
                        label={
                          s.subscription.status === "TRIALING" && left != null
                            ? `Trial · ${left}d left`
                            : s.subscription.status
                        }
                        variant="outlined"
                      />
                    ) : null}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {s.slug} · {s.memberCount} member
                    {s.memberCount === 1 ? "" : "s"}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    component={Link}
                    href={sellerDashboardPath(s.storeId)}
                    size="small"
                    variant="contained"
                    fullWidth
                  >
                    Open dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
