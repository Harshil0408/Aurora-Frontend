"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import GroupIcon from "@mui/icons-material/Group";
import { mercatoTokens } from "@/lib/theme";
import { FormField, Modal } from "@/components/ui/controls";
import {
  INITIAL_GRANTS,
  INITIAL_ROLES,
  PERM_GROUPS,
} from "@/lib/variables";
import type { PermGroup, Role } from "@/lib/variables";

function permBreakdown(keys: string[]): string {
  if (keys.length === 0) return "No permissions yet — assign some below.";
  const groups = new Map<string, number>();
  for (const k of keys) {
    const g = k.includes(".") ? k.split(".")[0] : "other";
    groups.set(g, (groups.get(g) ?? 0) + 1);
  }
  return [...groups.entries()]
    .map(([g, n]) => `${g} ${n}`)
    .join(" · ");
}

export function RolesView() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [grants, setGrants] =
    useState<Record<string, string[]>>(INITIAL_GRANTS);
  const [selectedKey, setSelectedKey] = useState("sub-admin");
  const [draft, setDraft] = useState<string[]>(INITIAL_GRANTS["sub-admin"]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [freshRole, setFreshRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = roles.find((r) => r.key === selectedKey) ?? roles[0];
  const dirty = useMemo(() => {
    const base = [...(grants[selected.key] ?? [])].sort().join(",");
    return [...draft].sort().join(",") !== base;
  }, [draft, grants, selected.key]);

  const pickRole = (key: string) => {
    setSelectedKey(key);
    setDraft([...(grants[key] ?? [])]);
    setFreshRole(null);
  };

  const toggle = (perm: string) =>
    setDraft((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );

  const toggleGroup = (group: PermGroup) => {
    const keys = group.perms.map((p) => p.key);
    const allOn = keys.every((k) => draft.includes(k));
    setDraft((prev) =>
      allOn
        ? prev.filter((p) => !keys.includes(p))
        : [...new Set([...prev, ...keys])],
    );
  };

  const createRole = () => {
    const key = newKey.trim();
    if (!key || !newName.trim()) return;
    setRoles((prev) => [
      ...prev,
      {
        key,
        name: newName.trim(),
        description: newDesc.trim() || "Custom role — describe its scope.",
      },
    ]);
    setGrants((prev) => ({ ...prev, [key]: [] }));
    setSelectedKey(key);
    setDraft([]);
    setFreshRole(key);
    setCreateOpen(false);
    setNewKey("");
    setNewName("");
    setNewDesc("");
  };

  const keyValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newKey.trim());
  const systemCount = roles.filter((r) => r.system).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 1.5,
          mt: 0.5,
        }}
      >
        <Box>
          <Typography variant="h1" component="h1">
            Roles &amp; Permissions
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: "0.88rem" }}
          >
            Bundles of permissions you assign to admins. Built-in system roles
            plus your custom roles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Create Role
        </Button>
      </Box>

      {/* Roles summary strip */}
      <Paper
        component="section"
        aria-label="Roles summary"
        sx={{ py: 1.5, px: 2 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            flexWrap: "wrap",
          }}
        >
          <Box
            aria-hidden
            sx={{
              display: "grid",
              placeItems: "center",
              width: 36,
              height: 36,
              borderRadius: 2.5,
              bgcolor: mercatoTokens.brandSoft,
              color: "primary.dark",
              flex: "none",
            }}
          >
            <GroupIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}
            >
              {roles.length}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Total roles
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}
            >
              {systemCount}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              System
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}
            >
              {roles.length - systemCount}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Custom
            </Typography>
          </Box>
        </Box>
      </Paper>

      {freshRole ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <b>New role created with zero permissions.</b> Assign permissions
          below, then confirm — nobody can use it until you do.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {roles.map((r) => {
          const count = (grants[r.key] ?? []).length;
          const active = r.key === selectedKey;
          const saGated = r.key === "super-admin";
          return (
            <Paper
              key={r.key}
              component="section"
              aria-label={`Role ${r.name}`}
              sx={
                active
                  ? {
                      boxShadow: `0 0 0 3px ${mercatoTokens.brandSoft}`,
                      borderColor: "primary.main",
                    }
                  : undefined
              }
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h2" sx={{ flex: 1, minWidth: 0 }}>
                  {r.name}
                </Typography>
                {r.system ? (
                  <Chip
                    label="System"
                    size="small"
                    sx={{ bgcolor: mercatoTokens.text, color: "#fff" }}
                  />
                ) : null}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "ui-monospace, monospace" }}
              >
                {r.key}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: "0.86rem", mt: 0.75, minHeight: 42 }}
              >
                {r.description}
              </Typography>
              <Typography sx={{ fontSize: "0.84rem", mt: 1 }}>
                <b>{count}</b> of 12 permissions
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.25 }}
              >
                {permBreakdown(grants[r.key] ?? [])}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Button
                  size="small"
                  variant={active ? "contained" : "outlined"}
                  onClick={() => pickRole(r.key)}
                >
                  Edit permissions
                </Button>
              </Box>
              {saGated ? (
                <Typography
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: "0.78rem",
                    color: "text.secondary",
                    mt: 1,
                  }}
                >
                  <LockIcon fontSize="inherit" /> Super-Admin-only — you qualify
                  (see topbar chip).
                </Typography>
              ) : null}
            </Paper>
          );
        })}
      </Box>

      <Paper component="section" aria-labelledby="perm-title" sx={{ p: 2 }}>
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
            <Typography variant="h2" id="perm-title">
              Edit permissions — {selected.name}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.82rem", mt: 0.25 }}
            >
              Tick boxes, then Confirm + save below · {draft.length} of 12
              selected
              {dirty ? " · unsaved changes" : ""}
            </Typography>
          </Box>
          <Chip
            label={selected.system ? "System role" : "Custom role"}
            size="small"
            sx={
              selected.system
                ? { bgcolor: mercatoTokens.text, color: "#fff" }
                : { bgcolor: mercatoTokens.brandSoft, color: "primary.dark" }
            }
          />
        </Box>

        {PERM_GROUPS.map((g) => {
          const keys = g.perms.map((p) => p.key);
          const on = keys.filter((k) => draft.includes(k)).length;
          return (
            <Box
              key={g.group}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                mt: 1.5,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.25,
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>{g.group}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {on}/{keys.length} on
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => toggleGroup(g)}
                >
                  {on === keys.length ? "Clear group" : "Select all"}
                </Button>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {g.perms.map((p, idx) => {
                  const isLastRow =
                    idx >=
                    g.perms.length - (g.perms.length % 2 === 0 ? 2 : 1);
                  return (
                    <FormControlLabel
                      key={p.key}
                      sx={{
                        px: 2,
                        py: 1,
                        m: 0,
                        borderBottom: { md: isLastRow ? 0 : 1 },
                        borderColor: "divider",
                        alignItems: "flex-start",
                      }}
                    control={
                      <Checkbox
                        checked={draft.includes(p.key)}
                        onChange={() => toggle(p.key)}
                        sx={{ mt: -0.5 }}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          sx={{ fontWeight: 600, fontSize: "0.88rem" }}
                        >
                          {p.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.hint}
                        </Typography>
                      </Box>
                    }
                  />
                  );
                })}
              </Box>
            </Box>
          );
        })}

        <Box
          role="status"
          sx={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.25,
            mt: 2,
            p: 1.5,
            pl: 2,
            borderRadius: 3.5,
            bgcolor: dirty ? mercatoTokens.text : "action.hover",
            color: dirty ? "#fff" : "text.secondary",
          }}
        >
          <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
            {dirty
              ? "You have unsaved changes — leaving now would lose them."
              : "No unsaved changes."}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="outlined"
            disabled={!dirty}
            onClick={() => setDraft([...(grants[selected.key] ?? [])])}
            sx={
              dirty
                ? { color: "#fff", borderColor: "rgba(255,255,255,0.4)" }
                : undefined
            }
          >
            Discard
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={!dirty}
            onClick={() => {
              setGrants((prev) => ({ ...prev, [selected.key]: draft }));
              setFreshRole(null);
              setToast(`Permissions saved for ${selected.name} (preview).`);
            }}
          >
            Confirm + save
          </Button>
        </Box>
      </Paper>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Role"
        subtitle="Starts empty — you assign permissions right after."
        icon={<AddIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={!keyValid || !newName.trim()}
              onClick={createRole}
            >
              Create role
            </Button>
          </>
        }
      >
          <Typography color="text.secondary" sx={{ fontSize: "0.84rem" }}>
            Custom roles start with <b>zero permissions</b> — you assign them
            in the matrix right after creating.
          </Typography>
          <FormField
            label="Step 1 — Key (slug)"
            value={newKey}
            onChange={(e) =>
              setNewKey(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              )
            }
            placeholder="e.g. catalog-manager"
            error={newKey !== "" && !keyValid}
            helperText={
              newKey !== "" && !keyValid
                ? "Use lowercase letters, numbers and hyphens."
                : "Lowercase-hyphens. Role keys are permanent — no rename afterwards."
            }
          />
          <FormField
            label="Step 2 — Display name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Catalog Manager"
          />
          <FormField
            label="Step 3 — Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            multiline
            rows={2}
          />
      </Modal>

      <Snackbar
        open={toast != null}
        autoHideDuration={3200}
        onClose={() => setToast(null)}
        message={toast ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
