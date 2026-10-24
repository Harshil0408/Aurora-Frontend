"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditIcon from "@mui/icons-material/Edit";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
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
  PRODUCT_ATTRIBUTE_TYPES,
  attributeTypeLabel,
  isOptionKeyed,
  type OptionSuggestionItem,
  type ProductAttribute,
  type ProductAttributeStatus,
} from "@/types/productAttributes";
import {
  useAddProductAttributeOptionMutation,
  useDeleteProductAttributeOptionMutation,
  useListProductAttributesQuery,
  useOptionSuggestionsQuery,
  useProductAttributeDetailQuery,
  useReorderProductAttributeOptionsMutation,
  useReviewOptionSuggestionMutation,
  useSetProductAttributeStatusMutation,
  useUpdateProductAttributeOptionMutation,
} from "@/services/catalogAttributesApi";
import { ProductAttributeFormDialog } from "./ProductAttributeFormDialog";

const TYPE_FILTERS = PRODUCT_ATTRIBUTE_TYPES.map((t) => ({
  value: t,
  label: attributeTypeLabel(t),
}));

export function CatalogAttributesView() {
  const { can } = usePermissions();
  const canManage = can("attribute.manage");
  const [tab, setTab] = useState<"attributes" | "suggestions">("attributes");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<ProductAttribute | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionSwatch, setNewOptionSwatch] = useState("");
  const [reviewing, setReviewing] = useState<OptionSuggestionItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">(
    "APPROVED",
  );
  const [reviewNote, setReviewNote] = useState("");

  const list = useListProductAttributesQuery(
    { limit: 100 },
    { skip: !canManage },
  );
  const suggestions = useOptionSuggestionsQuery(
    { limit: 50 },
    { skip: !canManage || tab !== "suggestions" },
  );
  const detail = useProductAttributeDetailQuery(detailId ?? "", {
    skip: !canManage || !detailId,
  });
  const [setStatusMut] = useSetProductAttributeStatusMutation();
  const [addOptionMut, addOptionState] = useAddProductAttributeOptionMutation();
  const [updateOptionMut] = useUpdateProductAttributeOptionMutation();
  const [deleteOptionMut] = useDeleteProductAttributeOptionMutation();
  const [reorderMut] = useReorderProductAttributeOptionsMutation();
  const [reviewMut, reviewState] = useReviewOptionSuggestionMutation();

  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  const visible = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return rows.filter((a) => {
      if (status && a.status !== status) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.code.includes(q);
    });
  }, [rows, deferredSearch, status, typeFilter]);

  if (!canManage) {
    return (
      <RbacGuard perm="attribute.manage">
        <AccessDenied
          title="Attributes are restricted"
          description="You don't hold attribute.manage — ask an administrator for catalog access."
        />
      </RbacGuard>
    );
  }
  if (list.isLoading) return <DataLoader label="Loading attributes" />;
  if (list.isError) {
    return (
      <FallbackUI
        tone="error"
        title="Couldn't load attributes"
        description={normaliseApiError(list.error).message}
        actionLabel="Retry"
        onAction={() => list.refetch()}
      />
    );
  }

  const openForm = (attribute: ProductAttribute | null) => {
    setEditing(attribute);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const suggestionRows = suggestions.data?.data ?? [];
  const detailData = detail.data?.data ?? null;
  const detailIsOptionKeyed = detailData
    ? isOptionKeyed(detailData.type)
    : false;

  const moveOption = async (attributeId: string, id: string, dir: -1 | 1) => {
    if (!detailData) return;
    const sorted = [...detailData.options].sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.createdAt.localeCompare(b.createdAt),
    );
    const idx = sorted.findIndex((o) => o.id === id);
    const swapWith = sorted[idx + dir];
    if (idx < 0 || !swapWith) return;
    const orders = [
      { id, displayOrder: swapWith.displayOrder },
      { id: swapWith.id, displayOrder: sorted[idx]?.displayOrder ?? 0 },
    ];
    await reorderMut({ attributeId, orders });
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
              Attributes
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.84rem", mt: 0.25 }}
            >
              The product-attribute catalog — {rows.length} attribute
              {rows.length === 1 ? "" : "s"} built into forms, filters and
              variants.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => openForm(null)}
          >
            New attribute
          </Button>
        </Box>

        <GuideAccordion title="How attributes work">
          <HowRow n={1}>
            Attributes are the global vocabulary — attribute sets bundle them
            and categories assign one set to the product form.
          </HowRow>
          <HowRow n={2}>
            Dropdown, multi-select and swatch types keep an option catalog;
            texts, numbers and dates validate by rule instead.
          </HowRow>
          <HowRow n={3}>
            Sellers can propose new option values — they land in Suggestions and
            only become selectable once you approve them.
          </HowRow>
          <HowRow n={4}>
            The code is the machine key: fixed at creation. Type changes are
            blocked once products store values.
          </HowRow>
        </GuideAccordion>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="Attribute sections"
        >
          <Tab value="attributes" label={`Attributes (${visible.length})`} />
          <Tab
            value="suggestions"
            label={`Suggestions${suggestionRows.length ? ` (${suggestionRows.length})` : ""}`}
          />
        </Tabs>

        {tab === "attributes" ? (
          <TableCard
            title="Attribute catalog"
            subtitle={`${visible.length} shown Â· codes are immutable machine keys`}
            toolbar={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name, code…"
                  aria-label="Search attributes"
                />
                <SelectField
                  label="Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={TYPE_FILTERS}
                  placeholder="All types"
                  minWidth={170}
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
              title: rows.length === 0 ? "No attributes yet" : "No matches",
              description:
                rows.length === 0
                  ? 'Create the first attribute — e.g. "RAM Size" (Dropdown).'
                  : "Clear the filters.",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label="Attribute catalog">
                <TableHead>
                  <TableRow>
                    <TableCell>Attribute</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Flags</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontSize: "0.84rem" }}>
                        <Typography
                          sx={{ fontWeight: 600, fontSize: "0.84rem" }}
                        >
                          {a.name}
                        </Typography>
                        {a.unit ? (
                          <Typography variant="caption" color="text.secondary">
                            unit {a.unit}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {a.code}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={attributeTypeLabel(a.type)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: "0.78rem", color: "text.secondary" }}
                      >
                        {a.required ? (
                          <Chip
                            size="small"
                            label="Required"
                            color="warning"
                            variant="outlined"
                          />
                        ) : null}
                        {a.variantDefining ? (
                          <Chip
                            size="small"
                            label="Variant"
                            color="info"
                            variant="outlined"
                            sx={{ ml: 0.5 }}
                          />
                        ) : null}
                        {a.filterable ? (
                          <Chip
                            size="small"
                            label="Filter"
                            color="info"
                            variant="outlined"
                            sx={{ ml: 0.5 }}
                          />
                        ) : null}
                        {a._count?.options ? (
                          <Chip
                            size="small"
                            label={`${a._count.options} options`}
                            variant="outlined"
                            sx={{ ml: 0.5 }}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={a.status}
                          color={a.status === "ACTIVE" ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          startIcon={<SettingsIcon fontSize="small" />}
                          onClick={() => setDetailId(a.id)}
                        >
                          Options
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => openForm(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color={a.status === "ACTIVE" ? "warning" : "success"}
                          onClick={() => {
                            void setStatusMut({
                              id: a.id,
                              status: (a.status === "ACTIVE"
                                ? "INACTIVE"
                                : "ACTIVE") as ProductAttributeStatus,
                              reason:
                                a.status === "ACTIVE"
                                  ? "Hidden by admin"
                                  : "Restored by admin",
                            });
                          }}
                        >
                          {a.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        ) : null}

        {tab === "suggestions" ? (
          <TableCard
            title="Seller option suggestions"
            subtitle={`${suggestionRows.length} pending Â· approving makes the value selectable everywhere`}
            empty={{
              when: suggestionRows.length === 0,
              title: "No pending suggestions",
              description: "Seller-proposed values appear here for review.",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label="Option suggestions">
                <TableHead>
                  <TableRow>
                    <TableCell>Proposed value</TableCell>
                    <TableCell>Attribute</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Swatch</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suggestionRows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 600, fontSize: "0.84rem" }}
                        >
                          {s.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "ui-monospace, monospace" }}
                        >
                          {s.value}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.82rem" }}>
                        {s.attribute?.name ?? s.attributeId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={attributeTypeLabel(
                            s.attribute?.type ?? "TEXT",
                          )}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {s.swatchHex ? (
                          <Chip
                            size="small"
                            icon={<PaletteIcon fontSize="small" />}
                            label={`${s.swatchHex} ${s.imageUrl ? "Â· image" : ""}`}
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            text only
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => {
                            setReviewing(s);
                            setReviewDecision("APPROVED");
                            setReviewNote("");
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        ) : null}
      </Box>

      {formOpen ? (
        <ProductAttributeFormDialog
          key={formKey}
          open
          onClose={() => setFormOpen(false)}
          editing={editing}
        />
      ) : null}

      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detailData ? `Options — ${detailData.name}` : "Options"}
        subtitle={
          detailData
            ? `${attributeTypeLabel(detailData.type)} Â· code ${detailData.code}`
            : undefined
        }
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setDetailId(null)}>Close</Button>
            <Box sx={{ flex: 1 }} />
            {detailIsOptionKeyed && detailData ? (
              <Button
                variant="contained"
                startIcon={<AddIcon fontSize="small" />}
                disabled={addOptionState.isLoading}
                onClick={() => openForm(detailData)}
              >
                Edit rules
              </Button>
            ) : null}
          </>
        }
      >
        {detail.isError ? (
          <Alert severity="error">
            {normaliseApiError(detail.error).message}
          </Alert>
        ) : null}
        {detailData && !detailIsOptionKeyed ? (
          <Alert severity="info">
            Type {attributeTypeLabel(detailData.type)} validates by rule — it
            has no option catalog.
          </Alert>
        ) : null}
        {detailData && detailIsOptionKeyed ? (
          <>
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", sm: "2fr 2fr 1fr auto" },
                alignItems: "center",
              }}
            >
              <FormField
                label="New label"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                size="small"
              />
              <FormField
                label="New value"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                size="small"
              />
              {detailData.type === "COLOR_SWATCH" ? (
                <FormField
                  label="#Hex"
                  value={newOptionSwatch}
                  onChange={(e) => setNewOptionSwatch(e.target.value)}
                  size="small"
                />
              ) : (
                <Box />
              )}
              <Button
                variant="contained"
                disabled={
                  !newOptionLabel.trim() ||
                  !newOptionValue.trim() ||
                  addOptionState.isLoading
                }
                onClick={() => {
                  if (!detailData) return;
                  void addOptionMut({
                    attributeId: detailData.id,
                    label: newOptionLabel.trim(),
                    value: newOptionValue.trim(),
                    ...(detailData.type === "COLOR_SWATCH" &&
                    newOptionSwatch.trim()
                      ? { swatchHex: newOptionSwatch.trim() }
                      : {}),
                  })
                    .unwrap()
                    .then(() => {
                      setNewOptionLabel("");
                      setNewOptionValue("");
                      setNewOptionSwatch("");
                    });
                }}
              >
                Add
              </Button>
            </Box>
            {addOptionState.isError ? (
              <Alert severity="error">
                {normaliseApiError(addOptionState.error).message}
              </Alert>
            ) : null}
            <Table size="small" aria-label="Option values">
              <TableHead>
                <TableRow>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detailData?.options ?? [])
                  .slice()
                  .sort(
                    (a, b) =>
                      a.displayOrder - b.displayOrder ||
                      a.createdAt.localeCompare(b.createdAt),
                  )
                  .map((o, idx, all) => (
                    <TableRow key={o.id}>
                      <TableCell sx={{ fontSize: "0.84rem" }}>
                        {o.swatchHex ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                bgcolor: o.swatchHex,
                                border: "1px solid rgba(0,0,0,0.2)",
                              }}
                            />
                            {o.label}{" "}
                            <code style={{ fontSize: "0.72rem" }}>
                              {o.value}
                            </code>
                          </Box>
                        ) : (
                          o.label
                        )}
                        {o.status === "SUGGESTED" ? (
                          <Chip
                            size="small"
                            label="from seller"
                            color="warning"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={o.status}
                          color={
                            o.status === "ACTIVE"
                              ? "success"
                              : o.status === "SUGGESTED"
                                ? "warning"
                                : "default"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <IconButton
                          size="small"
                          aria-label="Move up"
                          disabled={idx === 0}
                          onClick={() => {
                            void moveOption(o.attributeId, o.id, -1);
                          }}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Move down"
                          disabled={idx === all.length - 1}
                          onClick={() => {
                            void moveOption(o.attributeId, o.id, 1);
                          }}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          onClick={() => {
                            void updateOptionMut({
                              attributeId: o.attributeId,
                              optionId: o.id,
                              status:
                                o.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                            });
                          }}
                        >
                          {o.status === "ACTIVE" ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={o.status === "SUGGESTED"}
                          onClick={() => {
                            void deleteOptionMut({
                              attributeId: o.attributeId,
                              optionId: o.id,
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <Alert severity="info">
              Deleting is blocked once products store values for the attribute
              (Module 6 enforces replacement mapping).
            </Alert>
          </>
        ) : null}
      </Modal>

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={`Review suggestion — ${reviewing?.label ?? ""}`}
        subtitle={
          reviewing
            ? `${reviewing.attribute?.name ?? ""} Â· value ${reviewing.value}`
            : undefined
        }
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setReviewing(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color={reviewDecision === "APPROVED" ? "primary" : "error"}
              disabled={reviewState.isLoading}
              onClick={() => {
                if (!reviewing) return;
                void reviewMut({
                  optionId: reviewing.id,
                  decision: reviewDecision,
                  reviewNote: reviewNote || undefined,
                })
                  .unwrap()
                  .then(() => setReviewing(null));
              }}
            >
              {reviewDecision === "APPROVED" ? "Approve value" : "Reject"}
            </Button>
          </>
        }
      >
        <SelectField
          label="Decision"
          value={reviewDecision}
          onChange={(v) => setReviewDecision(v as "APPROVED" | "REJECTED")}
          options={["APPROVED", "REJECTED"]}
          hint="Approving makes the value selectable for every seller. Rejection removes the proposal."
        />
        <FormField
          label="Review note"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          multiline
          minRows={2}
        />
        {reviewState.isError ? (
          <Alert severity="error">
            {normaliseApiError(reviewState.error).message}
          </Alert>
        ) : null}
      </Modal>
    </RbacGuard>
  );
}
