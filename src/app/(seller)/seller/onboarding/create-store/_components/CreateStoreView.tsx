'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Grid, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { FormField, SelectField } from '@/components/ui/controls';
import { LookupSelect } from '@/components/seller/LookupSelect';
import { ButtonLoader } from '@/components/ui/Loaders';
import { DataLoader } from '@/components/ui/DataLoader';
import { DetailRow, GuideAccordion, HowRow } from '@/components/ui/Guide';
import { useSellerCreateStoreMutation } from '@/services/sellerStoresApi';
import { setActiveStore } from '@/store/sellerStoreSlice';
import { useAppDispatch } from '@/store/hooks';
import { createStoreSchema } from '@/lib/validations';
import { normaliseApiError } from '@/types/api';
import { sellerDashboardPath } from '@/lib/panels';

const STEPS = ['Store details', 'Business & contact', 'Review & launch'];

type Errors = Partial<Record<'name' | 'slug' | 'contactEmail' | 'logo' | 'currency', string>>;

export function CreateStoreView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createStore, { isLoading }] = useSellerCreateStoreMutation();
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    country: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    contactEmail: '',
    contactPhone: '',
    logo: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setValue = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  function validateStep(s: number): boolean {
    const parsed = createStoreSchema.safeParse(form);
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const next: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '') as keyof Errors;
      if (['name', 'slug', 'contactEmail', 'logo', 'currency'].includes(key) && !next[key]) {
        next[key] = issue.message;
      }
    }
    // Only surface fields belonging to the current step.
    const scoped: Errors = {};
    if (s === 0) {
      if (next.name) scoped.name = next.name;
      if (next.slug) scoped.slug = next.slug;
    } else if (s === 1) {
      if (next.contactEmail) scoped.contactEmail = next.contactEmail;
      if (next.logo) scoped.logo = next.logo;
    } else {
      Object.assign(scoped, next);
    }
    setErrors(scoped);
    return Object.keys(scoped).length === 0;
  }

  const review = useMemo(
    () => [
      { label: 'Name', value: form.name || '—' },
      { label: 'URL slug', value: form.slug || 'Auto-generated at creation' },
      { label: 'Category', value: form.category || '—' },
      { label: 'Country', value: form.country || '—' },
      { label: 'Currency / timezone', value: `${form.currency || '—'} · ${form.timezone || '—'}` },
      { label: 'Contact', value: form.contactEmail || form.contactPhone || '—' },
    ],
    [form],
  );

  async function launch() {
    setApiError(null);
    if (!validateStep(2)) return;
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      const value = v.trim();
      if (value) cleaned[k] = value;
    }
    try {
      const res = await createStore({ name: cleaned.name, ...cleaned }).unwrap();
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
      router.replace(sellerDashboardPath(res.data.storeId));
    } catch (err) {
      const norm = normaliseApiError(err as { status?: number; data?: unknown });
      setApiError(
        norm.code === 'CONFLICT' && /slug/i.test(norm.message)
          ? 'That URL slug is taken — clear the slug field and let us generate one, then try again.'
          : norm.message,
      );
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Create your store</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          Three quick steps — your store opens immediately on a 14-day Starter trial.
        </Typography>
      </Box>

      <GuideAccordion title="What happens when you launch">
        <HowRow n={1}>We create the store plus owner, admin, and staff roles — you join as the owner with every permission.</HowRow>
        <HowRow n={2}>A 14-day Starter trial starts automatically. Choosing a paid plan comes later on the Billing page.</HowRow>
        <HowRow n={3}>Leave the URL slug empty and we generate one (e.g. aurora-fashion-x1y2) — you can change details anytime in Settings.</HowRow>
      </GuideAccordion>

      <Paper sx={{ p: 2 }}>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 2 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {apiError ? <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>{apiError}</Alert> : null}

        {step === 0 ? (
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField label="Step 1 — Store name" value={form.name} onChange={set('name')} error={Boolean(errors.name)} helperText={errors.name} hint="Buyers see this at checkout and in emails." />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField label="URL slug (optional)" value={form.slug} onChange={set('slug')} error={Boolean(errors.slug)} helperText={errors.slug} hint="Lowercase letters, numbers, hyphens. Empty = auto-generated." />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <LookupSelect field="category" label="Category" value={form.category} onChange={setValue('category')} placeholder="Select a category" hint="Live platform list — admins can add more anytime." />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <LookupSelect field="country" label="Country" value={form.country} onChange={setValue('country')} placeholder="Select a country" hint="Needed to finish the onboarding checklist." />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormField label="Description" value={form.description} onChange={set('description')} multiline minRows={2} hint="A line or two about what you sell." />
            </Grid>
          </Grid>
        ) : null}

        {step === 1 ? (
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField label="Step 2 — Contact email" type="email" value={form.contactEmail} onChange={set('contactEmail')} error={Boolean(errors.contactEmail)} helperText={errors.contactEmail} hint="Buyers reach you here; also finishes onboarding." />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField label="Contact phone" value={form.contactPhone} onChange={set('contactPhone')} hint="Optional — shown alongside the email." />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <LookupSelect field="currency" label="Currency" value={form.currency} onChange={setValue('currency')} error={Boolean(errors.currency)} errorText={errors.currency} hint="Live platform list." />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <LookupSelect field="timezone" label="Timezone" value={form.timezone} onChange={setValue('timezone')} hint="Live platform list." />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField label="Logo URL" value={form.logo} onChange={set('logo')} error={Boolean(errors.logo)} helperText={errors.logo} hint="Optional image link for your storefront." />
            </Grid>
          </Grid>
        ) : null}

        {step === 2 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Typography variant="h2" sx={{ fontSize: '1rem', mb: 0.5 }}>Review</Typography>
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                  {review.map((r) => (
                    <DetailRow key={r.label} label={r.label}>{r.value}</DetailRow>
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Typography variant="h2" sx={{ fontSize: '1rem', mb: 0.5 }}>Plan (display only for now)</Typography>
                <SelectField
                  label="Starting plan"
                  value="starter"
                  options={[{ value: 'starter', label: 'Starter — 14-day trial, then ₹499/mo' }]}
                  onChange={() => {}}
                  hint="Creation always starts the Starter trial. Upgrades arrive with payments."
                />
                <Alert severity="info" sx={{ mt: 1 }}>
                  No card needed today. Trial limits: 100 products, 5 staff, 1,000 orders/month.
                </Alert>
              </Grid>
            </Grid>
            {isLoading ? <DataLoader label="Launching your store" variant="inline" /> : null}
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {step > 0 ? <Button size="small" variant="outlined" onClick={() => setStep((s) => s - 1)}>Back</Button> : <Button size="small" variant="outlined" component={Link} href="/seller/stores">Cancel</Button>}
          <Box sx={{ flex: 1 }} />
          {step < 2 ? (
            <Button size="small" variant="contained" onClick={() => { if (validateStep(step)) setStep((s) => s + 1); }}>Next</Button>
          ) : (
            <Button size="small" variant="contained" onClick={launch} disabled={isLoading}>
              {isLoading ? <ButtonLoader label="Launching" /> : 'Launch store'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
