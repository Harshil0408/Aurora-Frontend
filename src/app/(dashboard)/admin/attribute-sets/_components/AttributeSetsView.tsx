"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import TuneIcon from "@mui/icons-material/Tune";
import {
  AccessDenied,
  RbacGuard,
  usePermissions,
} from "@/components/auth/RbacGuard";
import { DataLoader } from "@/components/ui/DataLoader";
import { FallbackUI } from "@/components/ui/FallbackUI";
import {
  FormField,
  Modal,
  SearchField,
  SelectField,
  TableCard,
} from "@/components/ui/controls";
import { GuideAccordion, HowRow } from "@/components/ui/Guide";
import { normaliseApiError } from "@/types/api";
import {
  attributeTypeLabel,
  type ProductAttribute,
  type ProductAttributeSet,
  type ProductAttributeSetDetail,
  type ProductAttributeStatus,
} from "@/types/productAttributes";
import { useListProductAttributesQuery } from "@/services/catalogAttributesApi";
import {
  useAttachAttributeSetItemMutation,
  useAttributeSetDetailQuery,
  useCloneAttributeSetMutation,
  useCreateAttributeSetGroupMutation,
  useCreateAttributeSetMutation,
  useDeleteAttributeSetGroupMutation,
  useDeleteAttributeSetMutation,
  useDetachAttributeSetItemMutation,
  useListAttributeSetsQuery,
  useReorderAttributeSetItemsMutation,
  useSetAttributeSetStatusMutation,
  useUpdateAttributeSetItemMutation,
  useUpdateAttributeSetMutation,
} from "@/services/attributeSetsApi";

export function AttributeSetsView() {
  const { can } = usePermissions();
  const canManage = can("attribute.manage");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("");
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaKey, setMetaKey] = useState(0);
  const [editing, setEditing] = useState<ProductAttributeSet | null>(null);
  const [builderId, setBuilderId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<ProductAttributeSet | null>(null);

  const list = useListAttributeSetsQuery({ limit: 100 }, { skip: !canManage });
  const [setStatusMut] = useSetAttributeSetStatusMutation();
  const [deleteMut] = useDeleteAttributeSetMutation();
  const [cloneMut, cloneState] = useCloneAttributeSetMutation();

  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  const visible = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return rows.filter((s) => {
      if (status && s.status !== status) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.slug.includes(q);
    });
  }, [rows, deferredSearch, status]);

  if (!canManage) {
    return (
      <RbacGuard perm="attribute.manage">
        <AccessDenied
          title="Attribute sets are restricted"
          description="You don't hold attribute.manage — ask an administrator for catalog access."
        />
      </RbacGuard>
    );
  }
  if (list.isLoading) return <DataLoader label="Loading attribute sets" />;
  if (list.isError) {
    return (
      <FallbackUI
        tone="error"
        title="Couldn't load attribute sets"
        description={normaliseApiError(list.error).message}
        actionLabel="Retry"
        onAction={() => list.refetch()}
      />
    );
  }

  const openMeta = (set: ProductAttributeSet | null) => {
    setEditing(set);
    setMetaKey((k) => k + 1);
    setMetaOpen(true);
  };

  return (
    <RbacGuard perm="attribute.manage">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          mt: 0.5,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{ fontSize: "1.3rem", letterSpacing: "-0.01em" }}
            >
              Attribute sets
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.84rem", mt: 0.25 }}
            >
              Bundles of attributes — {rows.length} set
              {rows.length === 1 ? "" : "s"} · categories assign one set to the
              product form.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => openMeta(null)}
          >
            New set
          </Button>
        </Box>

        <GuideAccordion title="How attribute sets work">
          <HowRow n={1}>
            A set pins attributes into an ordered, grouped bundle — groups
            double as PDP specification tabs.
          </HowRow>
          <HowRow n={2}>
            A category references zero or one set. When a category has none, the
            product form inherits the nearest ancestor&apos;s set.
          </HowRow>
          <HowRow n={3}>
            Clone a set to branch a variant — the clone starts INACTIVE while
            you adjust it.
          </HowRow>
          <HowRow n={4}>
            Deleting a set is blocked while categories still reference it —
            unassign from Categories first.
          </HowRow>
        </GuideAccordion>

        <TableCard
          title="Sets"
          subtitle={`${visible.length} shown · the builder attaches attributes and groups`}
          toolbar={
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search name, slug…"
                aria-label="Search attribute sets"
              />
              <SelectField
                label="Status"
                value={status}
                onChange={setStatus}
                options={["ACTIVE", "INACTIVE"]}
                placeholder="All statuses"
                minWidth={150}
              />
            </Box>
          }
          empty={{
            when: visible.length === 0,
            title: rows.length === 0 ? "No sets yet" : "No matches",
            description:
              rows.length === 0
                ? 'Create a set — e.g. "Electronics Base" — then attach attributes in the builder.'
                : "Clear the filters.",
          }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" aria-label="Attribute sets">
              <TableHead>
                <TableRow>
                  <TableCell>Set</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Contents</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ fontSize: "0.84rem" }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.84rem" }}>
                        {s.name}
                      </Typography>
                      {s.description ? (
                        <Typography variant="caption" color="text.secondary">
                          {s.description.slice(0, 80)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.8rem",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {s.slug}
                    </TableCell>
                    <TableCell
                      sx={{ fontSize: "0.78rem", color: "text.secondary" }}
                    >
                      {s._count?.items ?? 0} attributes ·{" "}
                      {s._count?.groups ?? 0} groups ·{" "}
                      {s._count?.categories ?? 0} categories
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.status}
                        color={s.status === "ACTIVE" ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button
                        size="small"
                        startIcon={<TuneIcon fontSize="small" />}
                        onClick={() => setBuilderId(s.id)}
                      >
                        Builder
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => openMeta(s)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color={s.status === "ACTIVE" ? "warning" : "success"}
                        onClick={() => {
                          void setStatusMut({
                            id: s.id,
                            status: (s.status === "ACTIVE"
                              ? "INACTIVE"
                              : "ACTIVE") as ProductAttributeStatus,
                            reason:
                              s.status === "ACTIVE"
                                ? "Hidden by admin"
                                : "Restored by admin",
                          });
                        }}
                      >
                        {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon fontSize="small" />}
                        onClick={() => setCloning(s)}
                      >
                        Clone
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TableCard>
      </Box>

      {metaOpen ? (
        <SetMetaDialog
          key={metaKey}
          open
          onClose={() => setMetaOpen(false)}
          editing={editing}
        />
      ) : null}

      {builderId ? (
        <SetBuilderModal setId={builderId} onClose={() => setBuilderId(null)} />
      ) : null}

      <Modal
        open={!!cloning}
        onClose={() => setCloning(null)}
        title={`Clone “${cloning?.name}”`}
        subtitle="Groups and memberships are deep-copied; the clone starts INACTIVE."
        icon={<ContentCopyIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setCloning(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={cloneState.isLoading}
              onClick={() => {
                if (!cloning) return;
                void cloneMut({ id: cloning.id })
                  .unwrap()
                  .then(() => setCloning(null));
              }}
            >
              {cloneState.isLoading ? "Cloning…" : "Create clone"}
            </Button>
          </>
        }
      >
        {cloneState.isError ? (
          <Alert severity="error">
            {normaliseApiError(cloneState.error).message}
          </Alert>
        ) : null}
      </Modal>
    </RbacGuard>
  );
}

/* ---------- meta dialog (create / rename) ---------- */

function SetMetaDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: ProductAttributeSet | null;
}) {
  const [createMut, createState] = useCreateAttributeSetMutation();
  const [updateMut, updateState] = useUpdateAttributeSetMutation();
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState(editing?.description ?? "");

  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    (createState.isError
      ? normaliseApiError(createState.error).message
      : null) ??
    (updateState.isError ? normaliseApiError(updateState.error).message : null);

  const save = async () => {
    const body = {
      name: name.trim(),
      ...(slug.trim() && !editing ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    };
    if (editing) await updateMut({ id: editing.id, ...body }).unwrap();
    else await createMut(body).unwrap();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit set — ${editing.name}` : "New attribute set"}
      subtitle={
        editing
          ? "Renaming mints a new slug — no redirects needed, sets are not public URLs."
          : "Attach attributes in the Builder after creating."
      }
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={name.trim().length < 2 || saving}
            onClick={save}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create set"}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <FormField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        hint="2–128 chars."
      />
      {!editing ? (
        <FormField
          label="Slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="Blank = auto from the name."
        />
      ) : null}
      <FormField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={2}
        hint="What this set is for (max 500)."
      />
    </Modal>
  );
}

/* ---------- builder (groups + items) ---------- */

function SetBuilderModal({
  setId,
  onClose,
}: {
  setId: string;
  onClose: () => void;
}) {
  const detail = useAttributeSetDetailQuery(setId);
  const attributes = useListProductAttributesQuery({
    limit: 100,
    status: "ACTIVE",
  });
  const [createGroupMut, createGroupState] =
    useCreateAttributeSetGroupMutation();
  const [deleteGroupMut] = useDeleteAttributeSetGroupMutation();
  const [attachMut, attachState] = useAttachAttributeSetItemMutation();
  const [detachMut] = useDetachAttributeSetItemMutation();
  const [updateItemMut] = useUpdateAttributeSetItemMutation();
  const [reorderMut] = useReorderAttributeSetItemsMutation();
  const [groupName, setGroupName] = useState("");
  const [attachAttr, setAttachAttr] = useState("");
  const [attachGroup, setAttachGroup] = useState("");
  const [attachRequired, setAttachRequired] = useState("");

  const data = detail.data?.data as ProductAttributeSetDetail | undefined;
  const items = useMemo(
    () =>
      (data?.items ?? [])
        .slice()
        .sort(
          (a, b) =>
            a.displayOrder - b.displayOrder ||
            a.createdAt.localeCompare(b.createdAt),
        ),
    [data],
  );
  const groups = data?.groups ?? [];
  const attachable = (attributes.data?.data ?? []).filter(
    (a: ProductAttribute) =>
      a.status === "ACTIVE" && !items.some((i) => i.attributeId === a.id),
  );

  const moveItem = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const swapWith = items[idx + dir];
    if (idx < 0 || !swapWith) return;
    await reorderMut({
      setId,
      orders: [
        { id, displayOrder: swapWith.displayOrder },
        { id: swapWith.id, displayOrder: items[idx]?.displayOrder ?? 0 },
      ],
    });
  };

  const requiredLabel = (required: boolean | null): string =>
    required === null ? "Inherit" : required ? "Required" : "Optional";

  return (
    <Modal
      open
      onClose={onClose}
      title={data ? `Builder — ${data.name}` : "Builder"}
      subtitle={
        data
          ? `${items.length} attributes · ${groups.length} groups · assigned to ${data.categories.length} categor${data.categories.length === 1 ? "y" : "ies"}`
          : undefined
      }
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      {detail.isLoading ? <DataLoader label="Loading set" /> : null}
      {detail.isError ? (
        <Alert severity="error">
          {normaliseApiError(detail.error).message}
        </Alert>
      ) : null}
      {data ? (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography sx={{ fontSize: "0.86rem", fontWeight: 600 }}>
              Groups
            </Typography>
          </Box>
          {groups.map((g) => (
            <Box
              key={g.id}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Chip size="small" label={g.name} variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                order {g.displayOrder}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton
                size="small"
                aria-label={`Delete group ${g.name}`}
                onClick={() => {
                  void deleteGroupMut({ setId, groupId: g.id });
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
            <FormField
              label="New group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              size="small"
            />
            <Button
              variant="outlined"
              disabled={!groupName.trim() || createGroupState.isLoading}
              onClick={() => {
                void createGroupMut({ setId, name: groupName.trim() })
                  .unwrap()
                  .then(() => setGroupName(""));
              }}
            >
              Add group
            </Button>
          </Box>

          <Typography sx={{ fontSize: "0.86rem", fontWeight: 600, mb: 1 }}>
            Attributes in this set
          </Typography>
          <Table size="small" aria-label="Set attributes">
            <TableHead>
              <TableRow>
                <TableCell>Attribute</TableCell>
                <TableCell>Group</TableCell>
                <TableCell>Required</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontSize: "0.82rem" }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.82rem" }}>
                      {item.attribute?.name ?? item.attributeId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attributeTypeLabel(item.attribute?.type ?? "TEXT")}
                      {item.attribute?.unit ? ` · ${item.attribute.unit}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <SelectField
                      label="Group"
                      value={item.groupId ?? ""}
                      onChange={(v) => {
                        void updateItemMut({
                          setId,
                          itemId: item.id,
                          groupId: v || null,
                        });
                      }}
                      options={groups.map((g) => ({
                        value: g.id,
                        label: g.name,
                      }))}
                      placeholder="Un-grouped"
                      minWidth={160}
                    />
                  </TableCell>
                  <TableCell>
                    <SelectField
                      label="Required"
                      value={
                        item.required === null
                          ? "inherit"
                          : item.required
                            ? "yes"
                            : "no"
                      }
                      onChange={(v) => {
                        void updateItemMut({
                          setId,
                          itemId: item.id,
                          required: v === "inherit" ? null : v === "yes",
                        });
                      }}
                      options={[
                        {
                          value: "inherit",
                          label: `Inherit (${item.attribute?.required ? "required" : "optional"})`,
                        },
                        { value: "yes", label: "Required" },
                        { value: "no", label: "Optional" },
                      ]}
                      minWidth={180}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      aria-label="Move up"
                      disabled={idx === 0}
                      onClick={() => {
                        void moveItem(item.id, -1);
                      }}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Move down"
                      disabled={idx === items.length - 1}
                      onClick={() => {
                        void moveItem(item.id, 1);
                      }}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Detach"
                      onClick={() => {
                        void detachMut({ setId, itemId: item.id });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length === 0 ? (
            <Alert severity="info">
              No attributes yet — attach the first one below.
            </Alert>
          ) : null}

          <Typography
            sx={{ fontSize: "0.86rem", fontWeight: 600, mt: 2, mb: 1 }}
          >
            Attach an attribute
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", sm: "3fr 2fr auto auto" },
              alignItems: "center",
            }}
          >
            <SelectField
              label="Attribute"
              value={attachAttr}
              onChange={setAttachAttr}
              options={attachable.map((a: ProductAttribute) => ({
                value: a.id,
                label: `${a.name} (${attributeTypeLabel(a.type)})`,
              }))}
              placeholder="Choose an ACTIVE attribute"
            />
            <SelectField
              label="Group"
              value={attachGroup}
              onChange={setAttachGroup}
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              placeholder="Un-grouped"
            />
            <SelectField
              label="Required"
              value={attachRequired}
              onChange={setAttachRequired}
              options={[
                { value: "inherit", label: "Inherit" },
                { value: "yes", label: "Required" },
                { value: "no", label: "Optional" },
              ]}
              minWidth={140}
              hint={undefined}
            />
            <Button
              variant="contained"
              disabled={!attachAttr || attachState.isLoading}
              onClick={() => {
                void attachMut({
                  setId,
                  attributeId: attachAttr,
                  ...(attachGroup ? { groupId: attachGroup } : {}),
                  required:
                    attachRequired === "inherit"
                      ? null
                      : attachRequired === "yes",
                })
                  .unwrap()
                  .then(() => {
                    setAttachAttr("");
                    setAttachGroup("");
                    setAttachRequired("");
                  });
              }}
            >
              Attach
            </Button>
          </Box>
          {attachState.isError ? (
            <Alert severity="error">
              {normaliseApiError(attachState.error).message}
            </Alert>
          ) : null}
          {data.categories.length ? (
            <>
              <Typography
                sx={{ fontSize: "0.86rem", fontWeight: 600, mt: 2, mb: 0.5 }}
              >
                Assigned categories
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {data.categories.map((c) => (
                  <Chip
                    key={c.id}
                    size="small"
                    label={c.name}
                    variant="outlined"
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Assign in Categories — manage the picker there.
              </Typography>
            </>
          ) : null}
        </>
      ) : null}
    </Modal>
  );
}
