"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Switch,
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
import CalculateIcon from "@mui/icons-material/Calculate";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PercentIcon from "@mui/icons-material/Percent";
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
  GST_COMPONENT_LABEL,
  HSN_KINDS,
  ROUNDING_MODES,
  TAX_CLASS_STATUSES,
  UNIT_DIMENSIONS,
  roundingModeLabel,
  unitDimensionLabel,
  type HsnCode,
  type HsnKind,
  type CommerceSettings,
  type QuoteRounding,
  type RoundingMode,
  type TaxClass,
  type TaxComponentQuote,
  type TaxQuoteResult,
  type UnitDimension,
  type UnitOfMeasure,
} from "@/types/commerce";
import {
  useCommerceSettingsQuery,
  useCreateHsnCodeMutation,
  useCreateTaxClassMutation,
  useCreateTaxRateMutation,
  useCreateUnitMutation,
  useDeleteHsnCodeMutation,
  useDeleteTaxClassMutation,
  useDeleteTaxRateMutation,
  useDeleteUnitMutation,
  useListHsnCodesQuery,
  useListTaxClassesQuery,
  useListUnitsQuery,
  useQuoteTaxMutation,
  useSetTaxClassStatusMutation,
  useTaxClassDetailQuery,
  useUpdateCommerceSettingsMutation,
  useUpdateHsnCodeMutation,
  useUpdateTaxClassMutation,
  useUpdateTaxRateMutation,
  useUpdateUnitMutation,
} from "@/services/commerceApi";

const STATUS_OPTIONS = TAX_CLASS_STATUSES.map((s) => ({ value: s, label: s }));
const KIND_OPTIONS = HSN_KINDS.map((k) => ({ value: k, label: k }));
const DIMENSION_OPTIONS = UNIT_DIMENSIONS.map((d) => ({
  value: d,
  label: unitDimensionLabel(d),
}));
const ROUNDING_OPTIONS = ROUNDING_MODES.map((m) => ({
  value: m,
  label: roundingModeLabel(m),
}));

/** Headline summary text for a class's rate rows, e.g. "ALL 18% (+3% cess)". */
function rateSummary(k: TaxClass): string {
  const all = k.rates.find((r) => r.region === "ALL");
  if (!all) return k.rates.length > 0 ? "state rows only" : "no rates yet";
  const rate = Number(all.ratePercent);
  const cess = Number(all.cessPercent);
  const states = k.rates.filter((r) => r.region !== "ALL").length;
  const base = `${all.region} ${rate}%${cess > 0 ? ` (+${cess}% cess)` : ""}`;
  return states > 0 ? `${base} Â· ${states} state override(s)` : base;
}

/* ---------- tax class form dialog ---------- */

function TaxClassFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: TaxClass | null;
}) {
  const [createMut, createState] = useCreateTaxClassMutation();
  const [updateMut, updateState] = useUpdateTaxClassMutation();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const saving = createState.isLoading || updateState.isLoading;
  const saveError = createState.isError
    ? normaliseApiError(createState.error).message
    : updateState.isError
      ? normaliseApiError(updateState.error).message
      : null;
  const valid = name.trim().length >= 2 && !saving;

  const save = async () => {
    const body = {
      name: name.trim(),
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
      title={editing ? `Edit tax class â€” ${editing.name}` : "New tax class"}
      subtitle={
        editing
          ? "Rate rows are managed from the Rates drawer."
          : 'Name the class per slab, e.g. "GST 18%" â€” add rate rows next.'
      }
      maxWidth="sm"
      icon={<PercentIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!valid} onClick={save}>
            {saving ? "Savingâ€¦" : editing ? "Save changes" : "Create class"}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <FormField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        hint="2â€“128 chars, unique."
      />
      <FormField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={2}
        hint="Where this slab applies â€” max 500 chars."
      />
    </Modal>
  );
}

/* ---------- HSN / SAC form dialog ---------- */

function HsnCodeFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: HsnCode | null;
}) {
  const [createMut, createState] = useCreateHsnCodeMutation();
  const [updateMut, updateState] = useUpdateHsnCodeMutation();
  const [kind, setKind] = useState<HsnKind>(editing?.kind ?? "HSN");
  const [code, setCode] = useState(editing?.code ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [gstRate, setGstRate] = useState(editing?.gstRatePercent ?? "");

  const saving = createState.isLoading || updateState.isLoading;
  const saveError = createState.isError
    ? normaliseApiError(createState.error).message
    : updateState.isError
      ? normaliseApiError(updateState.error).message
      : null;
  const rateNum = gstRate.trim() === "" ? null : Number(gstRate);
  const valid =
    /^[0-9]{4}([0-9]{2}([0-9]{2})?)?$/.test(code.trim()) &&
    (rateNum === null || (rateNum >= 0 && rateNum <= 99.99)) &&
    !saving;

  const save = async () => {
    if (editing) {
      await updateMut({
        id: editing.id,
        code: code.trim(),
        ...(description.trim()
          ? { description: description.trim() }
          : { description: null }),
        ...(rateNum !== null
          ? { gstRatePercent: rateNum }
          : { gstRatePercent: null }),
      }).unwrap();
    } else {
      await createMut({
        kind,
        code: code.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(rateNum !== null ? { gstRatePercent: rateNum } : {}),
      }).unwrap();
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit HSN/SAC â€” ${editing.code}` : "New HSN / SAC code"}
      subtitle="Codes are unique across kinds; GST rate is an optional prefill for products."
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!valid} onClick={save}>
            {saving ? "Savingâ€¦" : editing ? "Save changes" : "Create code"}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <SelectField
        label="Kind"
        value={kind}
        onChange={(v) => setKind(v as HsnKind)}
        options={KIND_OPTIONS}
        disabled={!!editing}
        hint="HSN for goods, SAC for services."
      />
      <FormField
        label="Code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
        hint="4, 6 or 8 digits."
      />
      <FormField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={2}
      />
      <FormField
        label="Default GST rate % (optional)"
        value={gstRate}
        onChange={(e) => setGstRate(e.target.value)}
        hint="0â€“99.99, e.g. 18."
      />
    </Modal>
  );
}

/* ---------- unit form dialog ---------- */

function UnitFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: UnitOfMeasure | null;
}) {
  const [createMut, createState] = useCreateUnitMutation();
  const [updateMut, updateState] = useUpdateUnitMutation();
  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [dimension, setDimension] = useState<UnitDimension>(
    editing?.dimension ?? "QUANTITY",
  );
  const [baseCode, setBaseCode] = useState(editing?.baseCode ?? "");
  const [factor, setFactor] = useState(
    editing ? String(Number(editing.factor)) : "",
  );

  const saving = createState.isLoading || updateState.isLoading;
  const saveError = createState.isError
    ? normaliseApiError(createState.error).message
    : updateState.isError
      ? normaliseApiError(updateState.error).message
      : null;
  const factorNum = factor.trim() === "" ? NaN : Number(factor);
  const valid =
    /^[a-z][a-z0-9_]*$/.test(code.trim()) &&
    name.trim().length >= 1 &&
    baseCode.trim().length >= 1 &&
    Number.isFinite(factorNum) &&
    factorNum > 0 &&
    !saving;

  const save = async () => {
    if (editing) {
      await updateMut({
        id: editing.id,
        name: name.trim(),
        dimension,
        baseCode: baseCode.trim(),
        factor: factorNum,
      }).unwrap();
    } else {
      await createMut({
        code: code.trim(),
        name: name.trim(),
        dimension,
        baseCode: baseCode.trim(),
        factor: factorNum,
      }).unwrap();
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit unit â€” ${editing.code}` : "New unit of measure"}
      subtitle="factor = how many base units one of itself is (g = 0.001 kg). Codes are immutable."
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!valid} onClick={save}>
            {saving ? "Savingâ€¦" : editing ? "Save changes" : "Create unit"}
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
          label="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={!!editing}
          error={!!code.trim() && !/^[a-z][a-z0-9_]*$/.test(code.trim())}
          helperText={
            !!code.trim() && !/^[a-z][a-z0-9_]*$/.test(code.trim())
              ? "Lowercase snake_case only"
              : undefined
          }
          hint="kg, g, cmâ€¦ immutable once created."
        />
        <FormField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Kilogram."
        />
      </Box>
      <SelectField
        label="Dimension"
        value={dimension}
        onChange={(v) => setDimension(v as UnitDimension)}
        options={DIMENSION_OPTIONS}
        hint="Conversions only exist within a dimension."
      />
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <FormField
          label="Base code"
          value={baseCode}
          onChange={(e) => setBaseCode(e.target.value)}
          hint="Existing factor-1 unit in the same dimension."
        />
        <FormField
          label="Factor"
          value={factor}
          onChange={(e) => setFactor(e.target.value)}
          hint="> 0; use 1 to create the base unit."
        />
      </Box>
    </Modal>
  );
}

/* ---------- main view ---------- */

export function TaxAdminView() {
  const { can } = usePermissions();
  const canManage = can("tax.manage");
  const [tab, setTab] = useState<"classes" | "hsn" | "units" | "settings">(
    "classes",
  );

  /* classes tab */
  const [classSearch, setClassSearch] = useState("");
  const deferredClassSearch = useDeferredValue(classSearch);
  const [classStatus, setClassStatus] = useState("");
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [classFormKey, setClassFormKey] = useState(0);
  const [editingClass, setEditingClass] = useState<TaxClass | null>(null);
  const [ratesClassId, setRatesClassId] = useState<string | null>(null);
  const [newRateRegion, setNewRateRegion] = useState("");
  const [newRatePercent, setNewRatePercent] = useState("");
  const [newCessPercent, setNewCessPercent] = useState("");
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRatePercent, setEditRatePercent] = useState("");
  const [editCessPercent, setEditCessPercent] = useState("");

  /* hsn tab */
  const [hsnSearch, setHsnSearch] = useState("");
  const deferredHsnSearch = useDeferredValue(hsnSearch);
  const [hsnKind, setHsnKind] = useState("");
  const [hsnFormOpen, setHsnFormOpen] = useState(false);
  const [hsnFormKey, setHsnFormKey] = useState(0);
  const [editingHsn, setEditingHsn] = useState<HsnCode | null>(null);

  /* units tab */
  const [unitSearch, setUnitSearch] = useState("");
  const deferredUnitSearch = useDeferredValue(unitSearch);
  const [unitDimension, setUnitDimension] = useState("");
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [unitFormKey, setUnitFormKey] = useState(0);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);

  /* settings tab */
  const [priceIncludesTax, setPriceIncludesTax] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [displayCurrency, setDisplayCurrency] = useState("INR");
  const [roundingMode, setRoundingMode] = useState<RoundingMode>("NONE");
  const [savedNotice, setSavedNotice] = useState(false);

  /* quote calculator */
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteClassId, setQuoteClassId] = useState("");
  const [sellerState, setSellerState] = useState("");
  const [buyerState, setBuyerState] = useState("");
  const [quoteInclusive, setQuoteInclusive] = useState<boolean | null>(null);
  const [quoteRounding, setQuoteRounding] = useState("");
  const [quoteResult, setQuoteResult] = useState<TaxQuoteResult | null>(null);

  const classList = useListTaxClassesQuery(
    { limit: 100 },
    { skip: !canManage },
  );
  const hsnList = useListHsnCodesQuery(
    { limit: 100, ...(hsnKind ? { kind: hsnKind as HsnKind } : {}) },
    { skip: !canManage || tab !== "hsn" },
  );
  const unitList = useListUnitsQuery(
    {
      limit: 100,
      ...(unitDimension ? { dimension: unitDimension as UnitDimension } : {}),
    },
    { skip: !canManage || tab !== "units" },
  );
  const ratesDetail = useTaxClassDetailQuery(ratesClassId ?? "", {
    skip: !canManage || !ratesClassId,
  });
  const settings = useCommerceSettingsQuery(undefined, {
    skip: !canManage || tab !== "settings",
  });
  const quoteClasses = useListTaxClassesQuery(
    { limit: 100, status: "ACTIVE" },
    { skip: !canManage || tab !== "settings" || classList.isError },
  );

  const [setStatusMut] = useSetTaxClassStatusMutation();
  const [deleteClassMut, deleteClassState] = useDeleteTaxClassMutation();
  const [createRateMut, createRateState] = useCreateTaxRateMutation();
  const [updateRateMut, updateRateState] = useUpdateTaxRateMutation();
  const [deleteRateMut] = useDeleteTaxRateMutation();
  const [quoteMut, quoteState] = useQuoteTaxMutation();
  const [deleteHsnMut] = useDeleteHsnCodeMutation();
  const [deleteUnitMut] = useDeleteUnitMutation();
  const [saveSettingsMut, saveSettingsState] =
    useUpdateCommerceSettingsMutation();

  // Sync form state from the loaded settings without a cascading-effect
  // render: the "adjust state during render" pattern compares against the
  // previously synced server object and stops re-running until data changes.
  const loadedSettings = settings.data?.data as CommerceSettings | undefined;
  const [lastSynced, setLastSynced] = useState<CommerceSettings | undefined>(
    undefined,
  );
  if (loadedSettings && loadedSettings !== lastSynced) {
    setLastSynced(loadedSettings);
    setPriceIncludesTax(loadedSettings.priceIncludesTax);
    setBaseCurrency(loadedSettings.baseCurrency);
    setDisplayCurrency(loadedSettings.displayCurrency);
    setRoundingMode(loadedSettings.roundingMode);
  }

  const classRows = useMemo(() => classList.data?.data ?? [], [classList.data]);
  const visibleClasses = useMemo(() => {
    const q = deferredClassSearch.trim().toLowerCase();
    return classRows.filter((c) => {
      if (classStatus && c.status !== classStatus) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [classRows, deferredClassSearch, classStatus]);

  const hsnRows = useMemo(() => hsnList.data?.data ?? [], [hsnList.data]);
  const visibleHsn = useMemo(() => {
    const q = deferredHsnSearch.trim().toLowerCase();
    return hsnRows.filter((c) => {
      if (!q) return true;
      return (
        c.code.includes(q) || (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [hsnRows, deferredHsnSearch]);

  const unitRows = useMemo(() => unitList.data?.data ?? [], [unitList.data]);
  const visibleUnits = useMemo(() => {
    const q = deferredUnitSearch.trim().toLowerCase();
    return unitRows.filter((u) => {
      if (!q) return true;
      return u.code.includes(q) || u.name.toLowerCase().includes(q);
    });
  }, [unitRows, deferredUnitSearch]);

  if (!canManage) {
    return (
      <RbacGuard perm="tax.manage">
        <AccessDenied
          title="Tax administration is restricted"
          description="You don't hold tax.manage â€” ask an administrator for access."
        />
      </RbacGuard>
    );
  }
  if (classList.isLoading) return <DataLoader label="Loading tax classes" />;
  if (classList.isError) {
    return (
      <FallbackUI
        tone="error"
        title="Couldn't load tax classes"
        description={normaliseApiError(classList.error).message}
        actionLabel="Retry"
        onAction={() => classList.refetch()}
      />
    );
  }

  const openClassForm = (c: TaxClass | null) => {
    setEditingClass(c);
    setClassFormKey((k) => k + 1);
    setClassFormOpen(true);
  };
  const openHsnForm = (c: HsnCode | null) => {
    setEditingHsn(c);
    setHsnFormKey((k) => k + 1);
    setHsnFormOpen(true);
  };
  const openUnitForm = (u: UnitOfMeasure | null) => {
    setEditingUnit(u);
    setUnitFormKey((k) => k + 1);
    setUnitFormOpen(true);
  };

  const ratesClass = (ratesDetail.data?.data ?? null) as
    (TaxClass & { rates: TaxClass["rates"] }) | null;

  const addRate = async () => {
    if (!ratesClass) return;
    await createRateMut({
      id: ratesClass.id,
      region:
        newRateRegion.trim() === ""
          ? undefined
          : newRateRegion.trim().toUpperCase(),
      ratePercent: Number(newRatePercent),
      ...(newCessPercent.trim() !== ""
        ? { cessPercent: Number(newCessPercent) }
        : {}),
    })
      .unwrap()
      .then(() => {
        setNewRateRegion("");
        setNewRatePercent("");
        setNewCessPercent("");
      });
  };

  const saveEditedRate = async (rateId: string) => {
    if (!ratesClass) return;
    await updateRateMut({
      id: ratesClass.id,
      rateId,
      ratePercent: Number(editRatePercent),
      ...(editCessPercent.trim() !== ""
        ? { cessPercent: Number(editCessPercent) }
        : {}),
    })
      .unwrap()
      .then(() => setEditingRateId(null));
  };

  const runQuote = async () => {
    setQuoteResult(null);
    const hasRounding = quoteRounding !== "";
    const res = await quoteMut({
      amount: Number(quoteAmount),
      taxClassId: quoteClassId,
      sellerState: sellerState.trim().toUpperCase(),
      ...(buyerState.trim()
        ? { buyerState: buyerState.trim().toUpperCase() }
        : {}),
      ...(quoteInclusive !== null ? { inclusive: quoteInclusive } : {}),
      ...(hasRounding ? { rounding: quoteRounding as QuoteRounding } : {}),
    }).unwrap();
    setQuoteResult(res.data);
  };

  const saveSettings = async () => {
    await saveSettingsMut({
      priceIncludesTax,
      baseCurrency: baseCurrency.trim().toUpperCase(),
      displayCurrency: displayCurrency.trim().toUpperCase(),
      roundingMode,
    })
      .unwrap()
      .then(() => setSavedNotice(true));
  };

  return (
    <RbacGuard perm="tax.manage">
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
              Tax &amp; Units
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.84rem", mt: 0.25 }}
            >
              GST slab classes with regional rate rows, the HSN/SAC code master,
              units of measure and platform pricing settings.
            </Typography>
          </Box>
          {tab === "classes" ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => openClassForm(null)}
            >
              New class
            </Button>
          ) : null}
          {tab === "hsn" ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => openHsnForm(null)}
            >
              New code
            </Button>
          ) : null}
          {tab === "units" ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => openUnitForm(null)}
            >
              New unit
            </Button>
          ) : null}
        </Box>

        <GuideAccordion title="How tax & units work">
          <HowRow n={1}>
            Tax classes own regional rate rows: the ALL row is the nationwide
            headline, per-state rows override it for special-category states.
          </HowRow>
          <HowRow n={2}>
            CGST/SGST vs IGST is derived at checkout from seller and buyer
            states â€” rate rows are pure data, never the component split.
          </HowRow>
          <HowRow n={3}>
            HSN/SAC codes snapshot onto order lines for invoice immutability;
            edits only affect future checkouts.
          </HowRow>
          <HowRow n={4}>
            Units convert inside a dimension by factor to a factor-1 base unit
            (kg, m, l, piece); codes are immutable once referenced.
          </HowRow>
        </GuideAccordion>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="Tax sections"
        >
          <Tab value="classes" label="Tax classes" />
          <Tab value="hsn" label="HSN / SAC" />
          <Tab value="units" label="Units" />
          <Tab value="settings" label="Settings" />
        </Tabs>

        {tab === "classes" ? (
          <TableCard
            title="Tax classes"
            subtitle={`${visibleClasses.length} shown Â· a class needs at least an ALL rate row before checkout`}
            toolbar={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <SearchField
                  value={classSearch}
                  onChange={setClassSearch}
                  placeholder="Search name, descriptionâ€¦"
                  aria-label="Search tax classes"
                />
                <SelectField
                  label="Status"
                  value={classStatus}
                  onChange={setClassStatus}
                  options={STATUS_OPTIONS}
                  placeholder="All statuses"
                  minWidth={150}
                />
              </Box>
            }
            empty={{
              when: visibleClasses.length === 0,
              title:
                classRows.length === 0 ? "No tax classes yet" : "No matches",
              description:
                classRows.length === 0
                  ? 'Create the first class â€” e.g. "GST 18%".'
                  : "Clear the filters.",
            }}
          >
            {deleteClassState.isError ? (
              <Alert severity="error">
                {normaliseApiError(deleteClassState.error).message}
              </Alert>
            ) : null}
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label="Tax classes">
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Rates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleClasses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontSize: "0.84rem" }}>
                        <Typography
                          sx={{ fontWeight: 600, fontSize: "0.84rem" }}
                        >
                          {c.name}
                        </Typography>
                        {c.description ? (
                          <Typography variant="caption" color="text.secondary">
                            {c.description.length > 60
                              ? `${c.description.slice(0, 60)}â€¦`
                              : c.description}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {rateSummary(c)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={c.status}
                          color={c.status === "ACTIVE" ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          startIcon={<PercentIcon fontSize="small" />}
                          onClick={() => setRatesClassId(c.id)}
                        >
                          Rates
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => openClassForm(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color={c.status === "ACTIVE" ? "warning" : "success"}
                          onClick={() => {
                            void setStatusMut({
                              id: c.id,
                              status:
                                c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              reason:
                                c.status === "ACTIVE"
                                  ? "Hidden by admin"
                                  : "Restored by admin",
                            });
                          }}
                        >
                          {c.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            void deleteClassMut(c.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        ) : null}

        {tab === "hsn" ? (
          <TableCard
            title="HSN / SAC master"
            subtitle={`${visibleHsn.length} shown Â· codes snapshot onto invoices once sold`}
            toolbar={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <SearchField
                  value={hsnSearch}
                  onChange={setHsnSearch}
                  placeholder="Search code, descriptionâ€¦"
                  aria-label="Search HSN codes"
                />
                <SelectField
                  label="Kind"
                  value={hsnKind}
                  onChange={setHsnKind}
                  options={KIND_OPTIONS}
                  placeholder="All kinds"
                  minWidth={140}
                />
              </Box>
            }
            empty={{
              when: visibleHsn.length === 0,
              title: hsnRows.length === 0 ? "No codes yet" : "No matches",
              description:
                hsnRows.length === 0
                  ? "Seed the master with the most-used codes first."
                  : "Clear the filters.",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label="HSN and SAC codes">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Kind</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>GST rate</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleHsn.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {c.code}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={c.kind} variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.82rem" }}>
                        {c.description ?? "â€”"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.82rem" }}>
                        {c.gstRatePercent !== null
                          ? `${Number(c.gstRatePercent)}%`
                          : "â€”"}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => openHsnForm(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            void deleteHsnMut(c.id);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        ) : null}

        {tab === "units" ? (
          <TableCard
            title="Units of measure"
            subtitle={`${visibleUnits.length} shown Â· factors convert to a factor-1 base within a dimension`}
            toolbar={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <SearchField
                  value={unitSearch}
                  onChange={setUnitSearch}
                  placeholder="Search code, nameâ€¦"
                  aria-label="Search units"
                />
                <SelectField
                  label="Dimension"
                  value={unitDimension}
                  onChange={setUnitDimension}
                  options={DIMENSION_OPTIONS}
                  placeholder="All dimensions"
                  minWidth={150}
                />
              </Box>
            }
            empty={{
              when: visibleUnits.length === 0,
              title: unitRows.length === 0 ? "No units yet" : "No matches",
              description:
                unitRows.length === 0
                  ? "Create the base units (kg, m, l, piece) first."
                  : "Clear the filters.",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label="Units of measure">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Dimension</TableCell>
                    <TableCell>Conversion</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleUnits.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {u.code}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.84rem" }}>
                        {u.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={unitDimensionLabel(u.dimension)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: "0.78rem", color: "text.secondary" }}
                      >
                        1 {u.code} = {Number(u.factor)} {u.baseCode}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => openUnitForm(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            void deleteUnitMut(u.id);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        ) : null}

        {tab === "settings" ? (
          <>
            {settings.isLoading ? (
              <DataLoader label="Loading settings" />
            ) : settings.isError ? (
              <FallbackUI
                tone="error"
                title="Couldn't load commerce settings"
                description={normaliseApiError(settings.error).message}
                actionLabel="Retry"
                onAction={() => settings.refetch()}
              />
            ) : (
              <>
                <TableCard
                  title="Pricing settings"
                  subtitle="Platform-wide defaults â€” stores may override inclusive tax later."
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      maxWidth: 560,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={priceIncludesTax}
                          onChange={(e) =>
                            setPriceIncludesTax(e.target.checked)
                          }
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: "0.84rem" }}>
                          Sticker prices already include GST â€” the tax class
                          back-computes the base
                        </Typography>
                      }
                    />
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.25,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      }}
                    >
                      <FormField
                        label="Base currency"
                        value={baseCurrency}
                        onChange={(e) =>
                          setBaseCurrency(e.target.value.toUpperCase())
                        }
                        hint="3-letter ISO, e.g. INR â€” pricing/ledger currency."
                      />
                      <FormField
                        label="Display currency"
                        value={displayCurrency}
                        onChange={(e) =>
                          setDisplayCurrency(e.target.value.toUpperCase())
                        }
                        hint="3-letter ISO â€” storefront rendering currency."
                      />
                    </Box>
                    <SelectField
                      label="Rounding mode"
                      value={roundingMode}
                      onChange={(v) => setRoundingMode(v as RoundingMode)}
                      options={ROUNDING_OPTIONS}
                      hint="Applied to checkout totals."
                    />
                    {saveSettingsState.isError ? (
                      <Alert severity="error">
                        {normaliseApiError(saveSettingsState.error).message}
                      </Alert>
                    ) : null}
                    {savedNotice ? (
                      <Alert
                        severity="success"
                        onClose={() => setSavedNotice(false)}
                      >
                        Settings saved.
                      </Alert>
                    ) : null}
                    <Box>
                      <Button
                        variant="contained"
                        disabled={saveSettingsState.isLoading}
                        onClick={() => {
                          void saveSettings();
                        }}
                      >
                        {saveSettingsState.isLoading
                          ? "Savingâ€¦"
                          : "Save settings"}
                      </Button>
                    </Box>
                  </Box>
                </TableCard>

                <TableCard
                  title="Quote calculator"
                  subtitle="Preview exactly what checkout will compute â€” state rows override ALL."
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      maxWidth: 640,
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.25,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" },
                      }}
                    >
                      <FormField
                        label="Amount"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        hint="Product base or sticker price."
                      />
                      {quoteClasses.data?.data?.length ? (
                        <SelectField
                          label="Tax class"
                          value={quoteClassId}
                          onChange={setQuoteClassId}
                          options={quoteClasses.data.data.map((c) => ({
                            value: c.id,
                            label: c.name,
                          }))}
                          placeholder="Pick an active class"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No active tax classes â€” create one in the Tax classes
                          tab first.
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.25,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      }}
                    >
                      <FormField
                        label="Seller state"
                        value={sellerState}
                        onChange={(e) =>
                          setSellerState(e.target.value.toUpperCase())
                        }
                        hint="2-letter code, e.g. KA."
                      />
                      <FormField
                        label="Buyer state (optional)"
                        value={buyerState}
                        onChange={(e) =>
                          setBuyerState(e.target.value.toUpperCase())
                        }
                        hint="Blank = same as seller (intra-state)."
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={quoteInclusive === true}
                            onChange={(e) =>
                              setQuoteInclusive(e.target.checked)
                            }
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: "0.84rem" }}>
                            Price includes tax
                          </Typography>
                        }
                      />
                      <Box sx={{ minWidth: 220 }}>
                        <SelectField
                          label="Rounding"
                          value={quoteRounding}
                          onChange={setQuoteRounding}
                          options={["", ...ROUNDING_MODES].map((v) => ({
                            value: v,
                            label:
                              v === ""
                                ? "Use platform settings"
                                : roundingModeLabel(v as RoundingMode),
                          }))}
                        />
                      </Box>
                    </Box>
                    {quoteState.isError ? (
                      <Alert severity="error">
                        {normaliseApiError(quoteState.error).message}
                      </Alert>
                    ) : null}
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<CalculateIcon fontSize="small" />}
                        disabled={
                          quoteState.isLoading ||
                          !quoteClassId ||
                          quoteAmount.trim() === "" ||
                          !sellerState.trim()
                        }
                        onClick={() => {
                          void runQuote();
                        }}
                      >
                        Run quote
                      </Button>
                    </Box>
                    {quoteResult ? (
                      <Box>
                        <Typography sx={{ fontSize: "0.84rem" }}>
                          Gross: {quoteResult.grossAmount} Â· Net:{" "}
                          {quoteResult.netAmount} Â· Tax total:{" "}
                          {quoteResult.taxTotal}
                        </Typography>
                        <Table size="small" aria-label="Tax components">
                          <TableHead>
                            <TableRow>
                              <TableCell>Component</TableCell>
                              <TableCell>Rate %</TableCell>
                              <TableCell>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {quoteResult.components.map(
                              (q: TaxComponentQuote) => (
                                <TableRow key={q.component}>
                                  <TableCell sx={{ fontSize: "0.8rem" }}>
                                    {GST_COMPONENT_LABEL[q.component]}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "0.8rem" }}>
                                    {q.ratePercent}%
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "0.8rem" }}>
                                    {q.amount}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    ) : null}
                  </Box>
                </TableCard>
              </>
            )}
          </>
        ) : null}
      </Box>

      {classFormOpen ? (
        <TaxClassFormDialog
          key={classFormKey}
          open
          onClose={() => setClassFormOpen(false)}
          editing={editingClass}
        />
      ) : null}
      {hsnFormOpen ? (
        <HsnCodeFormDialog
          key={hsnFormKey}
          open
          onClose={() => setHsnFormOpen(false)}
          editing={editingHsn}
        />
      ) : null}
      {unitFormOpen ? (
        <UnitFormDialog
          key={unitFormKey}
          open
          onClose={() => setUnitFormOpen(false)}
          editing={editingUnit}
        />
      ) : null}

      <Modal
        open={!!ratesClassId}
        onClose={() => setRatesClassId(null)}
        title={ratesClass ? `Rates â€” ${ratesClass.name}` : "Rates"}
        subtitle={
          ratesClass
            ? `${ratesClass.rates.length} rate row(s) Â· state rows override the ALL row`
            : undefined
        }
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setRatesClassId(null)}>Close</Button>
          </>
        }
      >
        {ratesDetail.isError ? (
          <Alert severity="error">
            {normaliseApiError(ratesDetail.error).message}
          </Alert>
        ) : null}
        {ratesClass ? (
          <>
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" },
                alignItems: "center",
              }}
            >
              <FormField
                label="Region (ALL or state)"
                value={newRateRegion}
                onChange={(e) => setNewRateRegion(e.target.value.toUpperCase())}
                size="small"
                hint="Blank = ALL."
              />
              <FormField
                label="Rate %"
                value={newRatePercent}
                onChange={(e) => setNewRatePercent(e.target.value)}
                size="small"
              />
              <FormField
                label="Cess %"
                value={newCessPercent}
                onChange={(e) => setNewCessPercent(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon fontSize="small" />}
                disabled={
                  createRateState.isLoading || newRatePercent.trim() === ""
                }
                onClick={() => {
                  void addRate();
                }}
              >
                Add rate
              </Button>
            </Box>
            {createRateState.isError ? (
              <Alert severity="error">
                {normaliseApiError(createRateState.error).message}
              </Alert>
            ) : null}
            {updateRateState.isError ? (
              <Alert severity="error">
                {normaliseApiError(updateRateState.error).message}
              </Alert>
            ) : null}
            <Table size="small" aria-label="Rate rows">
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell>Rate %</TableCell>
                  <TableCell>Cess %</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ratesClass.rates.map((r) =>
                  editingRateId === r.id ? (
                    <TableRow key={r.id}>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {r.region}
                      </TableCell>
                      <TableCell>
                        <FormField
                          label="Rate %"
                          value={editRatePercent}
                          onChange={(e) => setEditRatePercent(e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          label="Cess %"
                          value={editCessPercent}
                          onChange={(e) => setEditCessPercent(e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={updateRateState.isLoading}
                          onClick={() => {
                            void saveEditedRate(r.id);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setEditingRateId(null)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={r.id}>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {r.region}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.84rem" }}>
                        {Number(r.ratePercent)}%
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.84rem" }}>
                        {Number(r.cessPercent)}%
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <IconButton
                          size="small"
                          aria-label="Edit rate"
                          onClick={() => {
                            setEditingRateId(r.id);
                            setEditRatePercent(String(Number(r.ratePercent)));
                            setEditCessPercent(String(Number(r.cessPercent)));
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Delete rate"
                          onClick={() => {
                            void deleteRateMut({
                              id: r.taxClassId,
                              rateId: r.id,
                            });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
            <Alert severity="info">
              State rows override the ALL row for buyers in that state.
              CGST/SGST applies intra-state; IGST inter-state â€” the split is
              derived by the quote engine, never stored.
            </Alert>
          </>
        ) : null}
      </Modal>
    </RbacGuard>
  );
}
