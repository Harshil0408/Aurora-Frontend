"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Box, Button, Grid, Paper, Typography } from "@mui/material";
import { FormField } from "@/components/ui/controls";
import { ButtonLoader } from "@/components/ui/Loaders";
import { DataLoader } from "@/components/ui/DataLoader";
import { DetailRow, GuideAccordion, HowRow } from "@/components/ui/Guide";
import {
  useSellerStoreDetailQuery,
  useSellerUpdateStoreMutation,
} from "@/services/sellerStoresApi";
import {
  SellerForbidden,
  useSellerCan,
} from "@/components/seller/SellerGuards";
import { createStoreSchema } from "@/lib/validations";
import { normaliseApiError } from "@/types/api";
import type { SellerStoreDetail } from "@/types/seller";

type SettingsForm = {
  name: string;
  description: string;
  category: string;
  country: string;
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  logo: string;
};

function toForm(detail: SellerStoreDetail): SettingsForm {
  return {
    name: detail.name ?? "",
    description: detail.description ?? "",
    category: detail.category ?? "",
    country: detail.country ?? "",
    currency: detail.currency ?? "",
    timezone: detail.timezone ?? "",
    contactEmail: detail.contactEmail ?? "",
    contactPhone: detail.contactPhone ?? "",
    logo: detail.logo ?? "",
  };
}

/**
 * Settings form — `key`ed by store id + update stamp so a refetch reseeds
 * the fields without a set-state-in-effect cascade.
 */
function SettingsFormView({
  storeId,
  detail,
  onSaved,
}: {
  storeId: string;
  detail: SellerStoreDetail;
  onSaved: () => void;
}) {
  const [save, { isLoading: saving }] = useSellerUpdateStoreMutation();
  const [form, setForm] = useState<SettingsForm>(() => toForm(detail));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const { can } = useSellerCan();

  if (!can("store:update")) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
        <SellerForbidden />
        <Paper sx={{ p: 2 }}>
          <Typography variant="h2" sx={{ fontSize: "1.05rem" }}>
            {detail.name}
          </Typography>
          <Box sx={{ borderTop: 1, borderColor: "divider", mt: 1 }}>
            <DetailRow label="Slug">{detail.slug}</DetailRow>
            <DetailRow label="Country">{detail.country ?? "—"}</DetailRow>
            <DetailRow label="Contact">
              {detail.contactEmail ?? detail.contactPhone ?? "—"}
            </DetailRow>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Read-only: your role ({detail.roleName}) lacks the store:update
            permission. Ask the owner to change settings.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const parsed = createStoreSchema.safeParse({ ...form, slug: "" });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      const value = v.trim();
      if (value) body[k] = value;
    }
    try {
      await save({ storeId, body }).unwrap();
      setNotice({
        tone: "success",
        text: "Settings saved. The sidebar and dashboard update immediately.",
      });
      onSaved();
    } catch (err) {
      setNotice({
        tone: "error",
        text: normaliseApiError(err as { status?: number; data?: unknown })
          .message,
      });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h1" sx={{ fontSize: "1.4rem" }}>
          Settings
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: "0.86rem", mt: 0.25 }}
        >
          What it is: the store profile buyers see. Changes apply instantly —
          the slug ({detail.slug}) never changes here.
        </Typography>
      </Box>

      <GuideAccordion title="How store settings work">
        <HowRow n={1}>
          Edit any field and save — the backend validates and returns the
          updated store.
        </HowRow>
        <HowRow n={2}>
          Name + country and contact email/phone feed the dashboard onboarding
          checklist.
        </HowRow>
        <HowRow n={3}>
          Only roles with store:update see this form; everyone else gets a
          read-only summary.
        </HowRow>
      </GuideAccordion>

      {notice ? (
        <Alert
          severity={notice.tone}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </Alert>
      ) : null}

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h2" sx={{ fontSize: "1.05rem" }}>
              Store identity
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.82rem", mt: 0.25, mb: 1 }}
            >
              Why it matters: the name, category, and description appear on your
              storefront and receipts.
            </Typography>
            <Box sx={{ borderTop: 1, borderColor: "divider" }}>
              <DetailRow label="Store ID">
                <span style={{ wordBreak: "break-all" }}>{detail.storeId}</span>
              </DetailRow>
              <DetailRow label="URL slug">{detail.slug}</DetailRow>
              <DetailRow label="Status">{detail.status}</DetailRow>
              <DetailRow label="Your role">
                {detail.roleName} ({detail.roleKey})
              </DetailRow>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper component="form" onSubmit={submit} noValidate sx={{ p: 2 }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Store name"
                  value={form.name}
                  onChange={set("name")}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Category"
                  value={form.category}
                  onChange={set("category")}
                  hint="e.g. Fashion."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField
                  label="Description"
                  value={form.description}
                  onChange={set("description")}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Country"
                  value={form.country}
                  onChange={set("country")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormField
                  label="Currency"
                  value={form.currency}
                  onChange={set("currency")}
                  error={Boolean(errors.currency)}
                  helperText={errors.currency}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormField
                  label="Timezone"
                  value={form.timezone}
                  onChange={set("timezone")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Contact email"
                  type="email"
                  value={form.contactEmail}
                  onChange={set("contactEmail")}
                  error={Boolean(errors.contactEmail)}
                  helperText={errors.contactEmail}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Contact phone"
                  value={form.contactPhone}
                  onChange={set("contactPhone")}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField
                  label="Logo URL"
                  value={form.logo}
                  onChange={set("logo")}
                  error={Boolean(errors.logo)}
                  helperText={errors.logo}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Box sx={{ flex: 1 }} />
              <Button
                type="submit"
                size="small"
                variant="contained"
                disabled={saving}
              >
                {saving ? <ButtonLoader label="Saving" /> : "Save settings"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export function StoreSettingsView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? "";
  const { data, isLoading, isError, error, refetch } =
    useSellerStoreDetailQuery(storeId, { skip: !storeId });
  const detail = data?.data;

  if (isLoading)
    return <DataLoader label="Loading store settings" variant="skeleton" />;
  if (isError || !detail) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" color="inherit" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Couldn&apos;t load settings —{" "}
        {
          normaliseApiError(error as { status?: number; data?: unknown })
            .message
        }
      </Alert>
    );
  }

  return (
    <SettingsFormView
      key={`${detail.storeId}:${detail.updatedAt}`}
      storeId={storeId}
      detail={detail}
      onSaved={() => refetch()}
    />
  );
}
