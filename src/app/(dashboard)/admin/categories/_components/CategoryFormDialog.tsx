"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import { FormField, Modal, SelectField } from "@/components/ui/controls";
import { AssetUploadField } from "@/components/ui/AssetUploadField";
import { normaliseApiError } from "@/types/api";
import type { CategoryNode, CreateCategoryRequest } from "@/types/categories";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/services/categoriesApi";
import { useListAttributeSetsQuery } from "@/services/attributeSetsApi";
import { useListTaxClassesQuery } from "@/services/commerceApi";

function flatten(
  nodes: CategoryNode[],
  out: { id: string; breadcrumb: string }[] = [],
) {
  for (const n of nodes) {
    out.push({ id: n.id, breadcrumb: n.breadcrumb });
    if (n.children) flatten(n.children, out);
  }
  return out;
}

export function CategoryFormDialog({
  open,
  onClose,
  tree,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  tree: CategoryNode[];
  editing: CategoryNode | null;
}) {
  const [createCategory, createState] = useCreateCategoryMutation();
  const [updateCategory, updateState] = useUpdateCategoryMutation();
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [parentId, setParentId] = useState(editing?.parentId ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(editing?.bannerUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(editing?.ogImageUrl ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(editing?.displayOrder ?? 0),
  );
  const [showInNav, setShowInNav] = useState(editing?.showInNav ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(
    editing?.showOnHomepage ?? false,
  );
  const [restricted, setRestricted] = useState(editing?.restricted ?? false);
  const [metaTitle, setMetaTitle] = useState(editing?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    editing?.metaDescription ?? "",
  );
  const [attributeSetId, setAttributeSetId] = useState(
    editing?.attributeSetId ?? "",
  );
  const [taxClassId, setTaxClassId] = useState(editing?.taxClassId ?? "");

  const attributeSets = useListAttributeSetsQuery({
    limit: 100,
    status: "ACTIVE",
  });
  const taxClasses = useListTaxClassesQuery({ limit: 100, status: "ACTIVE" });

  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    (createState.isError
      ? normaliseApiError(createState.error).message
      : null) ??
    (updateState.isError ? normaliseApiError(updateState.error).message : null);

  const parents = flatten(tree).filter((p) => p.id !== editing?.id);
  const valid = name.trim().length >= 2 && !saving;

  const save = async () => {
    const body: CreateCategoryRequest = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      parentId: parentId || null,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      ...(bannerUrl.trim() ? { bannerUrl: bannerUrl.trim() } : {}),
      ...(icon.trim() ? { icon: icon.trim() } : {}),
      displayOrder: Number(displayOrder) || 0,
      showInNav,
      showOnHomepage,
      restricted,
      ...(metaTitle.trim() ? { metaTitle: metaTitle.trim() } : {}),
      ...(metaDescription.trim()
        ? { metaDescription: metaDescription.trim() }
        : {}),
      ...(ogImageUrl ? { ogImageUrl } : {}),
      // Module 4 — attribute-set assignment (explicit null lets an edit clear it).
      ...(attributeSetId
        ? { attributeSetId }
        : editing && editing.attributeSetId
          ? { attributeSetId: null }
          : {}),
      // Module 5 — default tax-class assignment (explicit null clears an edit).
      ...(taxClassId
        ? { taxClassId }
        : editing && editing.taxClassId
          ? { taxClassId: null }
          : {}),
    };
    if (editing) await updateCategory({ id: editing.id, ...body }).unwrap();
    else await createCategory(body).unwrap();
    onClose();
  };

  return (
    <Modal
      // Remounted per open/editing by the parent key — field state is fresh each time.
      open={open}
      onClose={onClose}
      title={editing ? "Edit category" : "New category"}
      subtitle={
        editing
          ? `${editing.breadcrumb} · slug ${editing.slug}`
          : "Slugs auto-generate from the name; rename-safe redirects are automatic."
      }
      maxWidth="md"
      icon={<CategoryIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!valid} onClick={save}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <FormField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="2–128 chars. Renaming a live category retires the old slug as a permanent redirect."
        />
        <FormField
          label="Slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="Blank = auto from name. Lowercase-hyphen; retired slugs stay reserved."
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
        }}
      >
        <SelectField
          label="Parent"
          value={parentId}
          onChange={setParentId}
          options={parents.map((p) => ({ value: p.id, label: p.breadcrumb }))}
          placeholder="Top level (no parent)"
          hint="Cycles are rejected — a category can't live under itself or its children."
        />
        <FormField
          label="Display order"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          hint="Lower shows first among siblings."
        />
      </Box>
      <FormField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={2}
        hint="Shown on the storefront listing page (max 2000 chars)."
      />
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <AssetUploadField
          label="Category image"
          value={imageUrl}
          onChange={setImageUrl}
          uploadUrl="/admin/uploads"
          uploadExtra={{ folder: "categories" }}
          hint="Square tile for cards and nav. Uploaded, never pasted."
        />
        <AssetUploadField
          label="Listing banner"
          value={bannerUrl}
          onChange={setBannerUrl}
          uploadUrl="/admin/uploads"
          uploadExtra={{ folder: "categories" }}
          hint="Wide header for the listing page."
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <AssetUploadField
          label="Social preview image"
          value={ogImageUrl}
          onChange={setOgImageUrl}
          uploadUrl="/admin/uploads"
          uploadExtra={{ folder: "categories" }}
          hint="Open-Graph card when the page is shared."
        />
        <FormField
          label="Icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          hint="Short glyph key for nav."
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showInNav}
              onChange={(e) => setShowInNav(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Show in navigation
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showOnHomepage}
              onChange={(e) => setShowOnHomepage(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Feature on homepage
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={restricted}
              onChange={(e) => setRestricted(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Restricted — sellers apply with documents
            </Typography>
          }
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <FormField
          label="Meta title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          hint="SEO — defaults to the name."
        />
        <FormField
          label="Meta description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          hint="SEO snippet (max 320 chars)."
        />
      </Box>
      <SelectField
        label="Attribute set"
        value={attributeSetId}
        onChange={setAttributeSetId}
        options={(attributeSets.data?.data ?? []).map((s) => ({
          value: s.id,
          label: `${s.name} (${s._count?.items ?? 0} attributes)`,
        }))}
        placeholder="No attribute set"
        minWidth={260}
        hint="Attributes sellers fill in on the product form for this category. Sellers inherit the nearest ancestor's set when this is empty."
      />
      <SelectField
        label="Default tax class"
        value={taxClassId}
        onChange={setTaxClassId}
        options={(taxClasses.data?.data ?? []).map((c) => ({
          value: c.id,
          label: c.name,
        }))}
        placeholder="No default tax class"
        minWidth={260}
        hint="GST slab quoted at checkout for products in this category — products may override it from Module 6."
      />
    </Modal>
  );
}
