'use client';

import { useState } from 'react';
import { Alert, Box, Button, FormControlLabel, Switch, Typography } from '@mui/material';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { FormField, Modal } from '@/components/ui/controls';
import { AssetUploadField } from '@/components/ui/AssetUploadField';
import { normaliseApiError } from '@/types/api';
import type { Brand, CreateBrandRequest } from '@/types/brands';
import { useCreateBrandMutation, useUpdateBrandMutation } from '@/services/brandsApi';

export function BrandFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Brand | null;
}) {
  const [createBrand, createState] = useCreateBrandMutation();
  const [updateBrand, updateState] = useUpdateBrandMutation();
  const [name, setName] = useState(editing?.name ?? '');
  const [slug, setSlug] = useState(editing?.slug ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [logoUrl, setLogoUrl] = useState(editing?.logoUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(editing?.bannerUrl ?? '');
  const [website, setWebsite] = useState(editing?.website ?? '');
  const [country, setCountry] = useState(editing?.country ?? '');
  const [featured, setFeatured] = useState(editing?.featured ?? false);
  const [restricted, setRestricted] = useState(editing?.restricted ?? false);

  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    (createState.isError ? normaliseApiError(createState.error).message : null) ??
    (updateState.isError ? normaliseApiError(updateState.error).message : null);

  const valid = name.trim().length >= 2 && !saving;

  const save = async () => {
    const body: CreateBrandRequest = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
      ...(bannerUrl.trim() ? { bannerUrl: bannerUrl.trim() } : {}),
      ...(website.trim() ? { website: website.trim() } : {}),
      ...(country.trim() ? { country: country.trim() } : {}),
      featured,
      restricted,
    };
    if (editing) await updateBrand({ id: editing.id, ...body }).unwrap();
    else await createBrand(body).unwrap();
    onClose();
  };

  return (
    <Modal
      // Remounted per open/editing by the parent key — field state is fresh each time.
      open={open}
      onClose={onClose}
      title={editing ? 'Edit brand' : 'New brand'}
      subtitle={editing ? `${editing.name} — slug ${editing.slug}` : 'Slugs auto-generate from the name; duplicate names are rejected — merge instead.'}
      maxWidth="md"
      icon={<VerifiedOutlinedIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!valid} onClick={save}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create brand'}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} hint="2–128 chars. Brand names are unique across the platform." />
        <FormField label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} hint="Blank = auto from name. Lowercase-hyphen; retired slugs stay reserved." />
      </Box>
      <FormField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} hint="Shown on the storefront brand page (max 2000 chars)." />
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <AssetUploadField label="Brand logo" value={logoUrl} onChange={setLogoUrl} uploadUrl="/admin/uploads" uploadExtra={{ folder: 'brands' }} hint="Square mark for tiles and product cards." />
        <AssetUploadField label="Brand banner" value={bannerUrl} onChange={setBannerUrl} uploadUrl="/admin/uploads" uploadExtra={{ folder: 'brands' }} hint="Wide header for the storefront brand page." />
      </Box>
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <FormField label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} hint="Official site URL, or blank." />
        <FormField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} hint="From where — 'Germany', 'USA'…" />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControlLabel control={<Switch size="small" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />} label={<Typography sx={{ fontSize: '0.84rem' }}>Featured — storefront brand strip</Typography>} />
        <FormControlLabel control={<Switch size="small" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />} label={<Typography sx={{ fontSize: '0.84rem' }}>Restricted — authorisation letter required</Typography>} />
      </Box>
      <Alert severity="info">
        Products attach to brands from Module 6 — toggling restricted today starts gating publishes for that brand once products exist.
      </Alert>
    </Modal>
  );
}
