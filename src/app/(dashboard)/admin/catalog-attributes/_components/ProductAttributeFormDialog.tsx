"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import { FormField, Modal, SelectField } from "@/components/ui/controls";
import { normaliseApiError } from "@/types/api";
import {
  PRODUCT_ATTRIBUTE_TYPES,
  attributeTypeLabel,
  isOptionKeyed,
  type CreateProductAttributeOption,
  type CreateProductAttributeRequest,
  type ProductAttribute,
  type ProductAttributeType,
} from "@/types/productAttributes";
import {
  useCreateProductAttributeMutation,
  useUpdateProductAttributeMutation,
} from "@/services/catalogAttributesApi";

const TYPE_OPTIONS = PRODUCT_ATTRIBUTE_TYPES.map((t) => ({
  value: t,
  label: attributeTypeLabel(t),
}));

interface OptionDraft extends CreateProductAttributeOption {
  key: number;
}

export function ProductAttributeFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: ProductAttribute | null;
}) {
  const [createMut, createState] = useCreateProductAttributeMutation();
  const [updateMut, updateState] = useUpdateProductAttributeMutation();
  const [name, setName] = useState(editing?.name ?? "");
  const [code, setCode] = useState(editing?.code ?? "");
  const [type, setType] = useState<ProductAttributeType>(
    editing?.type ?? "TEXT",
  );
  const [unit, setUnit] = useState(editing?.unit ?? "");
  const [allowedUnits, setAllowedUnits] = useState(
    (editing?.allowedUnits ?? []).join(", "),
  );
  const [helpText, setHelpText] = useState(editing?.helpText ?? "");
  const [required, setRequired] = useState(editing?.required ?? false);
  const [filterable, setFilterable] = useState(editing?.filterable ?? false);
  const [searchable, setSearchable] = useState(editing?.searchable ?? false);
  const [comparable, setComparable] = useState(editing?.comparable ?? false);
  const [variantDefining, setVariantDefining] = useState(
    editing?.variantDefining ?? false,
  );
  const [visibleOnPage, setVisibleOnPage] = useState(
    editing?.visibleOnPage ?? true,
  );
  const [validationMin, setValidationMin] = useState(
    editing?.validationMin !== null && editing?.validationMin !== undefined
      ? String(editing.validationMin)
      : "",
  );
  const [validationMax, setValidationMax] = useState(
    editing?.validationMax !== null && editing?.validationMax !== undefined
      ? String(editing.validationMax)
      : "",
  );
  const [validationRegex, setValidationRegex] = useState(
    editing?.validationRegex ?? "",
  );
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [optionError, setOptionError] = useState<string | null>(null);

  const saving = createState.isLoading || updateState.isLoading;
  const saveError = createState.isError
    ? normaliseApiError(createState.error).message
    : updateState.isError
      ? normaliseApiError(updateState.error).message
      : null;

  const optionKeyed = isOptionKeyed(type);

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        key: Date.now() + prev.length,
        label: "",
        value: "",
        displayOrder: prev.length,
      },
    ]);
  };

  const dropOption = (key: number) =>
    setOptions((prev) => prev.filter((o) => o.key !== key));
  const patchOption = (
    key: number,
    patch: Partial<CreateProductAttributeOption>,
  ) =>
    setOptions((prev) =>
      prev.map((o) => (o.key === key ? { ...o, ...patch } : o)),
    );

  const valid =
    name.trim().length >= 2 &&
    (!code.trim() || /^[a-z][a-z0-9_]*$/.test(code.trim())) &&
    (!optionKeyed || options.every((o) => o.label.trim() && o.value.trim())) &&
    !saving;

  const save = async () => {
    const swatchIssue =
      type === "COLOR_SWATCH" &&
      options.some(
        (o) => !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(o.swatchHex ?? ""),
      );
    if (swatchIssue) {
      setOptionError("Colour swatches need a #hex value in the hex field.");
      return;
    }
    setOptionError(null);
    const numeric = (v: string): number | null =>
      v.trim() === "" ? null : Number(v);
    const unitList = allowedUnits
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    const body: CreateProductAttributeRequest = {
      name: name.trim(),
      type,
      ...(code.trim() && !editing ? { code: code.trim() } : {}),
      ...(unit.trim() ? { unit: unit.trim() } : {}),
      allowedUnits: unitList,
      ...(helpText.trim() ? { helpText: helpText.trim() } : {}),
      required,
      filterable,
      searchable,
      comparable,
      variantDefining,
      visibleOnPage,
      ...(numeric(validationMin) !== null
        ? { validationMin: numeric(validationMin) }
        : { validationMin: null }),
      ...(numeric(validationMax) !== null
        ? { validationMax: numeric(validationMax) }
        : { validationMax: null }),
      ...(validationRegex.trim()
        ? { validationRegex: validationRegex.trim() }
        : { validationRegex: null }),
      ...(optionKeyed
        ? {
            options: options.map((o) => ({
              label: o.label.trim(),
              value: o.value.trim(),
              ...(o.swatchHex ? { swatchHex: o.swatchHex } : {}),
            })),
          }
        : {}),
    };
    if (editing) await updateMut({ id: editing.id, ...body }).unwrap();
    else await createMut(body).unwrap();
    onClose();
  };

  const validateRow = (o: OptionDraft) => (
    <Box
      key={o.key}
      sx={{
        display: "grid",
        gap: 0.75,
        gridTemplateColumns: "2fr 2fr 1.4fr auto",
        alignItems: "center",
      }}
    >
      <TextField
        size="small"
        label="Label"
        value={o.label}
        onChange={(e) => patchOption(o.key, { label: e.target.value })}
        error={!o.label.trim()}
      />
      <TextField
        size="small"
        label="Value"
        value={o.value}
        onChange={(e) => patchOption(o.key, { value: e.target.value })}
        error={!o.value.trim()}
      />
      {type === "COLOR_SWATCH" ? (
        <TextField
          size="small"
          label="#Hex"
          value={o.swatchHex ?? ""}
          onChange={(e) => patchOption(o.key, { swatchHex: e.target.value })}
        />
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ gridColumn: "span 1" }}
        >
          auto
        </Typography>
      )}
      <IconButton
        size="small"
        aria-label="Remove option"
        onClick={() => dropOption(o.key)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editing ? `Edit attribute — ${editing.name}` : "New product attribute"
      }
      subtitle={
        editing
          ? `code ${editing.code} · type changes are blocked once products consume values`
          : "Attributes drive the product form, filters, and comparison tables."
      }
      maxWidth="md"
      icon={<CategoryIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!valid} onClick={save}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create attribute"}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      {optionError ? <Alert severity="error">{optionError}</Alert> : null}
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "2fr 3fr" },
        }}
      >
        <FormField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!code.trim() && !/^[a-z][a-z0-9_]*$/.test(code.trim())}
          helperText={
            !!code.trim() && !/^[a-z][a-z0-9_]*$/.test(code.trim())
              ? "Lowercase snake_case only"
              : undefined
          }
          hint="2–128 chars."
        />
        <FormField
          label="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={!!editing}
          hint={
            editing
              ? "Code is a machine key — immutable."
              : "Blank = auto snake_case from the name."
          }
        />
      </Box>
      <SelectField
        label="Type"
        value={type}
        onChange={(v) => setType(v as ProductAttributeType)}
        options={TYPE_OPTIONS}
        hint={
          isOptionKeyed(type as ProductAttributeType)
            ? "This type reads values from its option catalog."
            : "Free-form / scalar input on the product form."
        }
      />
      {optionKeyed ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 600 }}>
              Option values
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={addOption}
            >
              Add option
            </Button>
          </Box>
          {options.map(validateRow)}
          {optionKeyed && options.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              No options yet — sellers can also propose values once live (they
              enter an approval queue).
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
        }}
      >
        <FormField
          label={`Unit${type === "NUMBER" || type === "DECIMAL" ? "" : " (optional)"}`}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          hint="kg, cm, ml, MHz…"
        />
        <FormField
          label="Min value"
          value={validationMin}
          onChange={(e) => setValidationMin(e.target.value)}
          hint="Numeric bound."
        />
        <FormField
          label="Max value"
          value={validationMax}
          onChange={(e) => setValidationMax(e.target.value)}
          hint="Must be ≥ min."
        />
      </Box>
      {type === "NUMBER" || type === "DECIMAL" ? (
        <FormField
          label="Allowed units (comma separated)"
          value={allowedUnits}
          onChange={(e) => setAllowedUnits(e.target.value)}
          hint="Constrain the unit dropdown on product forms."
        />
      ) : null}
      <FormField
        label="Validation regex (optional)"
        value={validationRegex}
        onChange={(e) => setValidationRegex(e.target.value)}
        hint="Text inputs must match this pattern."
      />
      <FormField
        label="Help text"
        value={helpText}
        onChange={(e) => setHelpText(e.target.value)}
        multiline
        minRows={2}
        hint="Shown under the field on the product form (max 500)."
      />
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
          }
          label={<Typography sx={{ fontSize: "0.84rem" }}>Required</Typography>}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={filterable}
              onChange={(e) => setFilterable(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Storefront filter
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={searchable}
              onChange={(e) => setSearchable(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>Searchable</Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={comparable}
              onChange={(e) => setComparable(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Comparison table
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={variantDefining}
              onChange={(e) => setVariantDefining(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Defines variants
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={visibleOnPage}
              onChange={(e) => setVisibleOnPage(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.84rem" }}>
              Visible on product page
            </Typography>
          }
        />
      </Box>
    </Modal>
  );
}
