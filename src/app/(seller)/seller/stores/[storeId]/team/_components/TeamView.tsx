"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  ConfirmDialog,
  FormField,
  Modal,
  SelectField,
  TableCard,
} from "@/components/ui/controls";
import { ButtonLoader } from "@/components/ui/Loaders";
import { DataLoader } from "@/components/ui/DataLoader";
import { GuideAccordion, HowRow } from "@/components/ui/Guide";
import {
  useSellerInvitationsQuery,
  useSellerInviteMemberMutation,
  useSellerMembersQuery,
  useSellerRemoveMemberMutation,
  useSellerRevokeInvitationMutation,
  useSellerRolesQuery,
  useSellerUpdateMemberRoleMutation,
} from "@/services/sellerTeamApi";
import {
  SellerForbidden,
  useSellerCan,
} from "@/components/seller/SellerGuards";
import { inviteAcceptLink } from "@/lib/seller";
import { inviteMemberSchema } from "@/lib/validations";
import { normaliseApiError } from "@/types/api";

export function TeamView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? "";
  const { can } = useSellerCan();
  const canInvite = can("staff:invite");
  const canUpdate = can("staff:update");
  const canRemove = can("staff:remove");

  const members = useSellerMembersQuery(storeId, {
    skip: !storeId || !canInvite,
  });
  const invitations = useSellerInvitationsQuery(storeId, {
    skip: !storeId || !canInvite,
  });
  const roles = useSellerRolesQuery(storeId, { skip: !storeId });
  const [invite, { isLoading: inviting }] = useSellerInviteMemberMutation();
  const [revoke, { isLoading: revoking }] = useSellerRevokeInvitationMutation();
  const [changeRole, { isLoading: changing }] =
    useSellerUpdateMemberRoleMutation();
  const [remove, { isLoading: removing }] = useSellerRemoveMemberMutation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<{
    userId: string;
    email: string;
    roleKey: string;
  } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    email: string;
    owner: boolean;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const roleOptions = useMemo(
    () =>
      (roles.data?.data ?? []).map((r) => ({
        value: r.key,
        label: `${r.name} (${r.key})`,
      })),
    [roles.data],
  );

  if (!canInvite && !canUpdate && !canRemove)
    return (
      <Box sx={{ mt: 0.5 }}>
        <SellerForbidden />
      </Box>
    );
  if (members.isLoading)
    return <DataLoader label="Loading team members" variant="skeleton" />;
  if (members.isError) {
    const msg = normaliseApiError(
      members.error as { status?: number; data?: unknown },
    ).message;
    return (
      <Alert
        severity="error"
        action={
          <Button
            size="small"
            color="inherit"
            onClick={() => members.refetch()}
          >
            Retry
          </Button>
        }
      >
        Couldn&apos;t load the team — {msg}
      </Alert>
    );
  }

  const list = members.data?.data ?? [];
  const invites = invitations.data?.data ?? [];
  const pending = invites.filter((i) => i.status === "PENDING");

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInviteLink(null);
    const parsed = inviteMemberSchema.safeParse({ email, roleKey });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
      );
      return;
    }
    try {
      const res = await invite({ storeId, ...parsed.data }).unwrap();
      setInviteLink(inviteAcceptLink(res.data.token));
      setEmail("");
      invitations.refetch();
    } catch (err) {
      setFormError(
        normaliseApiError(err as { status?: number; data?: unknown }).message,
      );
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${inviteLink}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFormError("Copy failed — select the link text manually.");
    }
  }

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
            Team
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.86rem", mt: 0.25 }}
          >
            {list.length} member{list.length === 1 ? "" : "s"} ·{" "}
            {pending.length} pending invitation{pending.length === 1 ? "" : "s"}
            .
          </Typography>
        </Box>
        {canInvite ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<PersonAddIcon fontSize="small" />}
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        ) : null}
      </Box>

      <GuideAccordion title="How team invitations work">
        <HowRow n={1}>
          Invite by email + role only — you never see or set their password.
          One login per human; memberships grant store access.
        </HowRow>
        <HowRow n={2}>
          The invite link is valid 7 days — only the link hash is stored, so
          copy it now. Lost links also appear in the invitee&apos;s inbox after
          they sign in.
        </HowRow>
        <HowRow n={3}>
          The invitee must sign in with the exact invited email, then open the
          link to join. Declines are terminal — re-invite with a fresh
          invitation.
        </HowRow>
        <HowRow n={4}>
          You can never change your own role, touch the owner, or remove
          yourself — the backend rejects it.
        </HowRow>
      </GuideAccordion>

      {actionError ? (
        <Alert
          severity="error"
          role="alert"
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      ) : null}

      <TableCard
        title="Members"
        subtitle={`${list.length} people with access to this store`}
        empty={{
          when: list.length === 0,
          title: "No members yet",
          description:
            "Invite your first teammate to get help running the store.",
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" aria-label="Store members">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((m) => (
                <TableRow key={m.membershipId}>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.86rem", fontWeight: 600 }}>
                      {m.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={m.roleName} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={m.status} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                      {canUpdate ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setRoleTarget({
                              userId: m.userId,
                              email: m.email,
                              roleKey: m.roleKey,
                            })
                          }
                        >
                          Change role
                        </Button>
                      ) : null}
                      {canRemove ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            setRemoveTarget({
                              userId: m.userId,
                              email: m.email,
                              owner: m.roleKey === "owner",
                            })
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableCard>

      {canInvite ? (
        <TableCard
          title="Invitations"
          subtitle={`${pending.length} pending · links expire after 7 days`}
          empty={{
            when: invites.length === 0,
            title: "No invitations",
            description: "Sent invitations and their status appear here.",
          }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" aria-label="Store invitations">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell sx={{ fontSize: "0.86rem" }}>
                      {inv.email}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={inv.roleKey}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={inv.status}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }}>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      {inv.status === "PENDING" ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={revoking}
                          onClick={async () => {
                            try {
                              await revoke({
                                storeId,
                                invitationId: inv.id,
                              }).unwrap();
                              invitations.refetch();
                            } catch (err) {
                              setActionError(
                                normaliseApiError(
                                  err as { status?: number; data?: unknown },
                                ).message,
                              );
                            }
                          }}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TableCard>
      ) : null}

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteLink(null);
          setFormError(null);
        }}
        title="Invite a teammate"
        subtitle="Step 1 — pick email + role · Step 2 — copy the one-time link"
        icon={<PersonAddIcon fontSize="small" />}
        maxWidth="sm"
        actions={
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setInviteOpen(false);
                setInviteLink(null);
                setFormError(null);
              }}
            >
              Close
            </Button>
            {!inviteLink ? (
              <Button
                size="small"
                variant="contained"
                onClick={(e) => submitInvite(e as unknown as React.FormEvent)}
                disabled={inviting}
              >
                {inviting ? <ButtonLoader label="Inviting" /> : "Send invite"}
              </Button>
            ) : null}
          </>
        }
      >
        <Box
          component="form"
          onSubmit={submitInvite}
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          {formError ? (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          ) : null}
          <FormField
            label="Step 1 — teammate email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="They sign in with this exact email, using their own password — you never see it."
          />
          <SelectField
            label="Step 1 — role"
            value={roleKey}
            onChange={setRoleKey}
            options={roleOptions}
            placeholder="Choose a role"
            hint="Start narrow — you can promote later."
          />
          {inviteLink ? (
            <Alert
              severity="success"
              icon={<ContentCopyIcon fontSize="small" />}
            >
              <Typography sx={{ fontSize: "0.84rem", fontWeight: 600 }}>
                Step 2 — copy this link now (shown once):
              </Typography>
              <Typography
                sx={{ fontSize: "0.8rem", wordBreak: "break-all", mt: 0.5 }}
              >
                {inviteLink}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={copyLink}
              >
                {copied ? "Copied" : "Copy invite link"}
              </Button>
            </Alert>
          ) : null}
        </Box>
      </Modal>

      <Modal
        open={roleTarget != null}
        onClose={() => setRoleTarget(null)}
        title={`Change role — ${roleTarget?.email ?? ""}`}
        subtitle="Keys are permanent slugs; members keep access until you save."
        icon={<PersonAddIcon fontSize="small" />}
        maxWidth="xs"
        actions={
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setRoleTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={changing || !roleTarget}
              onClick={async () => {
                if (!roleTarget) return;
                try {
                  await changeRole({
                    storeId,
                    userId: roleTarget.userId,
                    roleKey: roleTarget.roleKey,
                  }).unwrap();
                  setRoleTarget(null);
                  members.refetch();
                } catch (err) {
                  setActionError(
                    normaliseApiError(
                      err as { status?: number; data?: unknown },
                    ).message,
                  );
                  setRoleTarget(null);
                }
              }}
            >
              {changing ? <ButtonLoader label="Saving" /> : "Save role"}
            </Button>
          </>
        }
      >
        <SelectField
          label="New role"
          value={roleTarget?.roleKey ?? ""}
          onChange={(v) => setRoleTarget((t) => (t ? { ...t, roleKey: v } : t))}
          options={roleOptions}
          hint="You cannot change your own role or the owner's."
        />
      </Modal>

      <ConfirmDialog
        open={removeTarget != null}
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.email ?? ""}?`}
        tone="danger"
        consequence={
          removeTarget?.owner
            ? "The store owner cannot be removed — transfer ownership first."
            : "They lose access to this store immediately on every device."
        }
        ackLabel="I understand they lose access immediately"
        confirmLabel="Remove member"
        loading={removing}
        onConfirm={async () => {
          if (!removeTarget || removeTarget.owner) {
            setRemoveTarget(null);
            return;
          }
          try {
            await remove({ storeId, userId: removeTarget.userId }).unwrap();
            members.refetch();
          } catch (err) {
            setActionError(
              normaliseApiError(err as { status?: number; data?: unknown })
                .message,
            );
          }
          setRemoveTarget(null);
        }}
      />
    </Box>
  );
}
