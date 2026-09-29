"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import PhonelinkLockIcon from "@mui/icons-material/PhonelinkLock";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import KeyIcon from "@mui/icons-material/Key";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import TourIcon from "@mui/icons-material/Explore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  useChangePasswordMutation,
  useConfirmEmailOtpMutation,
  useConfirmTotpMutation,
  useDisable2faMutation,
  useDisableEmailOtpMutation,
  useEnrollTotpMutation,
  useMeQuery,
  useRequestEmailOtpMutation,
} from "@/services/authApi";
import { useAppDispatch } from "@/store/hooks";
import { clearAuth } from "@/store/authSlice";
import { normaliseApiError } from "@/types/api";
import { DataLoader } from "@/components/ui/DataLoader";
import { FallbackUI } from "@/components/ui/FallbackUI";
import { ButtonLoader } from "@/components/ui/Loaders";
import { FormField, Modal } from "@/components/ui/controls";
import {
  DetailRow,
  GuideAccordion,
  GuideStep,
  HowRow,
  TourDialog,
} from "@/components/ui/Guide";
import { mercatoTokens } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/* Status chip (page-specific)                                       */
/* ------------------------------------------------------------------ */

function StatusChip({ on }: { on: boolean }) {
  return (
    <Chip
      label={on ? "On" : "Off"}
      size="small"
      sx={
        on
          ? { bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }
          : { bgcolor: "action.hover", color: "text.secondary" }
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Guided-tour content (dialog itself lives in components/ui/Guide)    */
/* ------------------------------------------------------------------ */

const TOTP_TOUR: GuideStep[] = [
  {
    title: "What is this?",
    body: (
      <>
        An <b>authenticator app</b> on your phone (Google Authenticator,
        Microsoft Authenticator, or Authy) shows a{" "}
        <b>new 6-digit code every 30 seconds</b>. After your password, you type
        the current code. Even if someone steals your password, they cannot sign
        in without your phone.
      </>
    ),
  },
  {
    title: "What you need first",
    body: (
      <>
        Install one of these free apps on your phone <b>before</b> you start:
        Google Authenticator, Microsoft Authenticator, or Authy. You will use
        your phone&apos;s camera once to scan a square code.
      </>
    ),
  },
  {
    title: "How turning it on works",
    body: (
      <>
        1) Click <b>Set up authenticator</b> and scan the square code with the
        app. 2) <b>Save the 10 recovery codes</b> somewhere safe — each works
        once and they are never shown again. 3) Type the 6-digit code from the
        app to confirm. Done — it protects your next sign-in. If email codes are
        currently on, confirming switches your method and they turn off.
      </>
    ),
  },
  {
    title: "How sign-in changes",
    body: (
      <>
        After your password you will be asked for the current code from the app.
        Lost your phone? Type one of your <b>recovery codes</b> instead — each
        code works only once. Only one method can be active, so this is the only
        code you will ever be asked for.
      </>
    ),
  },
  {
    title: "What turning it off does",
    body: (
      <>
        You prove it is you (password + a code), then the app link and all
        recovery codes are <b>permanently deleted</b> and you are{" "}
        <b>signed out on every device</b>. With no method left, sign-in needs
        only email + password.
      </>
    ),
  },
];

const EMAIL_TOUR: GuideStep[] = [
  {
    title: "What is this?",
    body: (
      <>
        On every sign-in we <b>email you a 6-digit code</b> and you type it in
        after your password. Nothing to install — it works with the inbox you
        already use. Best for anyone who does not want another app.
      </>
    ),
  },
  {
    title: "How turning it on works",
    body: (
      <>
        Click <b>Enable email codes</b>, open the email we just sent, and type
        the 6-digit code back here to confirm. That is the whole setup — about a
        minute. If the authenticator is currently on, confirming switches your
        method and the authenticator turns off.
      </>
    ),
  },
  {
    title: "The three rules of email codes",
    body: (
      <>
        1) Each code <b>expires after 10 minutes</b>. 2) You get <b>5 tries</b>{" "}
        per code, then it dies. 3) Only the <b>latest email</b> counts —
        requesting a new code cancels the old one. On sign-in there is a{" "}
        <b>Resend</b> button if yours expired.
      </>
    ),
  },
  {
    title: "What turning it off does",
    body: (
      <>
        We email you a fresh code, you confirm it with your password, and then
        email codes stop — plus you are <b>signed out on every device</b>. With
        no method left, sign-in needs only email + password.
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/* Capability matrix: permission keys like "admins.view" fold into
   Resource × (Read | Write | Admin). Read = view-type, Write =
   create/edit-type, Admin = manage-type (suspend, assign, revoke…). */
const GROUP_LABELS: Record<string, string> = {
  admins: "Admin",
  admin: "Admin",
  roles: "Role",
  role: "Role",
  activity: "Audit",
  sessions: "Session",
  session: "Session",
};
const READ_VERBS = new Set(["view", "read", "list", "get"]);
const WRITE_VERBS = new Set(["create", "edit", "update"]);

function prettifyGroup(g: string): string {
  if (GROUP_LABELS[g]) return GROUP_LABELS[g];
  const s = g.endsWith("s") && g.length > 1 ? g.slice(0, -1) : g;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface MatrixRow {
  resource: string;
  read: boolean;
  write: boolean;
  admin: boolean;
}

function capabilityMatrix(perms: string[]): MatrixRow[] {
  const map = new Map<string, MatrixRow>();
  for (const p of perms) {
    const parts = p.split(".");
    const group = (parts[0] ?? "other").toLowerCase();
    const verb = (parts.slice(1).join(".") || p).toLowerCase();
    let row = map.get(group);
    if (!row) {
      row = { resource: prettifyGroup(group), read: false, write: false, admin: false };
      map.set(group, row);
    }
    if (READ_VERBS.has(verb)) row.read = true;
    else if (WRITE_VERBS.has(verb)) row.write = true;
    else row.admin = true;
  }
  return [...map.values()].sort((a, b) => a.resource.localeCompare(b.resource));
}

function MatrixCell({ on, label }: { on: boolean; label: string }) {
  return (
    <TableCell align="center" aria-label={`${label}: ${on ? "granted" : "not granted"}`}>
      {on ? (
        <CheckIcon
          fontSize="small"
          sx={{ color: mercatoTokens.good, verticalAlign: "middle" }}
        />
      ) : (
        <Typography component="span" aria-hidden color="text.disabled">
          –
        </Typography>
      )}
    </TableCell>
  );
}

function SecurityContent() {
  const router = useRouter();
  const params = useSearchParams();
  const usedRecovery = params.get("recovery") === "1";
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, refetch } = useMeQuery();

  const [enrollTotp, { isLoading: enrolling }] = useEnrollTotpMutation();
  const [confirmTotp, { isLoading: confirmingTotp }] = useConfirmTotpMutation();
  const [requestEmail, { isLoading: requesting }] =
    useRequestEmailOtpMutation();
  const [confirmEmail, { isLoading: confirmingEmail }] =
    useConfirmEmailOtpMutation();
  const [disableTotp, { isLoading: disablingTotp }] = useDisable2faMutation();
  const [disableEmail, { isLoading: disablingEmail }] =
    useDisableEmailOtpMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();

  const [totpDialog, setTotpDialog] = useState<null | "enroll" | "disable">(
    null,
  );
  const [emailDialog, setEmailDialog] = useState<null | "enable" | "disable">(
    null,
  );
  const [enrollStep, setEnrollStep] = useState(0);
  const [tour, setTour] = useState<null | {
    kind: "totp" | "email";
    step: number;
  }>(null);
  const [qr, setQr] = useState<{
    qrDataUrl: string;
    otpauthUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [ackCodes, setAckCodes] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpPassword, setTotpPassword] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailDisableCode, setEmailDisableCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (isLoading) return <DataLoader label="Loading security settings" />;
  if (isError || !data) {
    return (
      <FallbackUI
        title="Could not load security settings"
        description="Check your connection and retry."
        tone="error"
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  const me = data.data;
  const totpOn = me.twoFactor.totpEnabled;
  const emailOn = me.twoFactor.emailOtpEnabled;
  // Only one method can be active at a time — the cards below enforce this.
  const activeMethod: "totp" | "email_otp" | null = totpOn
    ? "totp"
    : emailOn
      ? "email_otp"
      : null;
  const protection = activeMethod ? "Strong" : "Basic";
  const matrix = capabilityMatrix(me.permissions);

  const loggedOut = () => {
    dispatch(clearAuth());
    router.replace("/login?disabled=1");
  };
  const apiMsg = (err: unknown, fallback: string) => {
    const n = normaliseApiError({
      status: (err as { status?: number })?.status,
      data: (err as { data?: unknown })?.data,
    });
    return n.code === "RATE_LIMITED"
      ? "Too many attempts. Wait a few minutes and retry."
      : n.message || fallback;
  };

  const startTotpEnroll = async () => {
    setError(null);
    setNotice(null);
    setAckCodes(false);
    setTotpCode("");
    setEnrollStep(0);
    try {
      const res = await enrollTotp().unwrap();
      setQr(res.data);
      setTour(null);
      setTotpDialog("enroll");
    } catch (err) {
      setError(apiMsg(err, "Could not start authenticator setup."));
    }
  };
  const confirmTotpEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await confirmTotp({ code: totpCode.trim().replace(/\s/g, "") }).unwrap();
      setTotpDialog(null);
      setQr(null);
      setNotice(
        "Authenticator app turned on. It will be asked for on your next sign-in.",
      );
    } catch (err) {
      setError(
        apiMsg(
          err,
          "That code did not work. Check the time on your device and retry.",
        ),
      );
    }
  };
  const confirmTotpDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await disableTotp({
        password: totpPassword,
        code: totpDisableCode.trim().replace(/\s/g, ""),
      }).unwrap();
      loggedOut();
    } catch (err) {
      setError(
        apiMsg(
          err,
          "Could not turn off the authenticator. Check the password and code.",
        ),
      );
    }
  };

  const startEmailEnable = async () => {
    setError(null);
    setNotice(null);
    setEmailCode("");
    try {
      await requestEmail().unwrap();
      setEmailSent(true);
      setTour(null);
      setEmailDialog("enable");
    } catch (err) {
      setError(apiMsg(err, "Could not send the email code."));
    }
  };
  const confirmEmailEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await confirmEmail({ code: emailCode.trim() }).unwrap();
      setEmailDialog(null);
      setEmailSent(false);
      setNotice(
        "Email codes turned on. A code will be emailed on every sign-in.",
      );
    } catch (err) {
      setError(
        apiMsg(err, "That code did not work or expired. Request a fresh one."),
      );
    }
  };
  const startEmailDisable = async () => {
    setError(null);
    try {
      await requestEmail().unwrap();
      setEmailSent(true);
      setEmailDialog("disable");
    } catch (err) {
      setError(apiMsg(err, "Could not send the email code."));
    }
  };
  const confirmEmailDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await disableEmail({
        password: emailPassword,
        code: emailDisableCode.trim(),
      }).unwrap();
      loggedOut();
    } catch (err) {
      setError(
        apiMsg(
          err,
          "Could not turn off email codes. Check the password and code.",
        ),
      );
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (next !== next2) {
      setError("New passwords do not match.");
      return;
    }
    try {
      await changePassword({
        currentPassword: cur,
        newPassword: next,
      }).unwrap();
      dispatch(clearAuth());
      router.replace("/login?changed=1");
    } catch (err) {
      setError(apiMsg(err, "Could not change the password."));
    }
  };

  const pwValid = next.length >= 12 && next === next2 && cur !== "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Compact header */}
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="h1" component="h1">
          Security
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mt: 0.5, fontSize: "0.88rem" }}
        >
          Signed in as <strong style={{ color: "inherit" }}>{me.email}</strong>{" "}
          · two-factor is optional — pick a method below.
        </Typography>
      </Box>

      {usedRecovery ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          <b>You signed in with a recovery code.</b> Each code works once —
          re-enroll the authenticator below if you are running low.
        </Alert>
      ) : null}
      {notice ? (
        <Alert severity="success" role="status" sx={{ borderRadius: 3 }}>
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" role="alert" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : null}

      {/* Protection summary strip */}
      <Paper
        component="section"
        aria-label="Protection summary"
        sx={{ py: 1.5, px: 2 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
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
            <ShieldIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}
            >
              Protection: {protection}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1, fontWeight: 600 }}
              >
                {activeMethod === "totp"
                  ? "Authenticator active"
                  : activeMethod === "email_otp"
                    ? "Email code active"
                    : "No second factor"}
              </Typography>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              Only one method can be active at a time — turning on the other
              switches your method.
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<TourIcon />}
            onClick={() => setTour({ kind: "totp", step: 0 })}
          >
            Authenticator tour
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TourIcon />}
            onClick={() => setTour({ kind: "email", step: 0 })}
          >
            Email-code tour
          </Button>
        </Box>
      </Paper>

      {/* 2FA methods — choose one */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          mt: 0.5,
        }}
      >
        Two-factor method · choose one
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "minmax(0,1fr)",
            lg: "repeat(2, minmax(0,1fr))",
          },
        }}
      >
        {/* Authenticator */}
        <Paper component="section" aria-labelledby="totp-title" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PhonelinkLockIcon color="primary" fontSize="small" />
            <Typography
              variant="h2"
              id="totp-title"
              sx={{ flex: 1, fontSize: "1.05rem" }}
            >
              Authenticator app
            </Typography>
            <StatusChip on={totpOn} />
          </Box>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.84rem", mt: 0.75 }}
          >
            <b style={{ color: "inherit" }}>What it is:</b> your phone shows a
            new 6-digit code every 30 seconds. Strongest option — works even if
            your inbox is compromised.
          </Typography>

          <GuideAccordion title="How it works — read before you start">
            <HowRow n={1}>
              Install Google Authenticator, Microsoft Authenticator, or Authy
              on your phone.
            </HowRow>
            <HowRow n={2}>
              Click <b>Set up authenticator</b> and scan the square code with
              the app (or type the key by hand).
            </HowRow>
            <HowRow n={3}>
              <b>Save the 10 recovery codes</b> somewhere safe — each works
              once and they never show again.
            </HowRow>
            <HowRow n={4}>
              Type the current 6-digit code from the app to confirm. From the
              next sign-in on, password first, then this code.
            </HowRow>
            <HowRow n={5}>
              Lost your phone? Type a recovery code at sign-in instead. Short
              on codes? Come back here and set up again.
            </HowRow>
          </GuideAccordion>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 1.25,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {totpOn ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setTotpDialog("disable");
                }}
              >
                Turn off
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={startTotpEnroll}
                  disabled={enrolling}
                  aria-busy={enrolling}
                >
                  {enrolling ? (
                    <ButtonLoader label="Starting" />
                  ) : emailOn ? (
                    "Switch to authenticator"
                  ) : (
                    "Set up authenticator"
                  )}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<TourIcon />}
                  onClick={() => setTour({ kind: "totp", step: 0 })}
                >
                  Take the tour
                </Button>
              </>
            )}
          </Box>
          {emailOn && !totpOn ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              Email codes are currently active — confirming this setup switches
              your method and turns them off.
            </Typography>
          ) : null}
          {totpOn ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "flex",
                gap: 0.5,
                mt: 1,
                alignItems: "flex-start",
              }}
            >
              <WarningAmberIcon fontSize="inherit" sx={{ mt: 0.25 }} />
              Turning it off deletes the app link + all recovery codes and signs
              you out everywhere.
            </Typography>
          ) : null}
        </Paper>

        {/* Email OTP */}
        <Paper component="section" aria-labelledby="email-title" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MarkEmailReadIcon color="primary" fontSize="small" />
            <Typography
              variant="h2"
              id="email-title"
              sx={{ flex: 1, fontSize: "1.05rem" }}
            >
              Email code
            </Typography>
            <StatusChip on={emailOn} />
          </Box>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.84rem", mt: 0.75 }}
          >
            <b style={{ color: "inherit" }}>What it is:</b> we email you a
            6-digit code on every sign-in — nothing to install. Easiest option;
            keep your inbox secure.
          </Typography>

          <GuideAccordion title="How it works — three rules to know">
            <HowRow n={1}>
              Click <b>Enable email codes</b>, open our email, type the
              6-digit code back here. Setup takes about a minute.
            </HowRow>
            <HowRow n={2}>
              Each code <b>expires after 10 minutes</b> and allows{" "}
              <b>5 tries</b>. Only the <b>latest email</b> counts — a new
              request cancels the old code.
            </HowRow>
            <HowRow n={3}>
              At sign-in the code is emailed automatically. Expired? Use the{" "}
              <b>Resend</b> button on the code screen for a fresh one.
            </HowRow>
          </GuideAccordion>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 1.25,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {emailOn ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={startEmailDisable}
                disabled={requesting}
                aria-busy={requesting}
              >
                {requesting ? <ButtonLoader label="Sending" /> : "Turn off"}
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={startEmailEnable}
                  disabled={requesting}
                  aria-busy={requesting}
                >
                  {requesting ? (
                    <ButtonLoader label="Sending" />
                  ) : totpOn ? (
                    "Switch to email codes"
                  ) : (
                    "Enable email codes"
                  )}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<TourIcon />}
                  onClick={() => setTour({ kind: "email", step: 0 })}
                >
                  Take the tour
                </Button>
              </>
            )}
          </Box>
          {totpOn && !emailOn ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              The authenticator is currently active — confirming email codes
              switches your method and turns it off.
            </Typography>
          ) : null}
          {emailOn ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "flex",
                gap: 0.5,
                mt: 1,
                alignItems: "flex-start",
              }}
            >
              <WarningAmberIcon fontSize="inherit" sx={{ mt: 0.25 }} />
              Turning it off needs a fresh emailed code + your password, and
              signs you out everywhere.
            </Typography>
          ) : null}
        </Paper>
      </Box>

      {/* Password — one SaaS settings row: explainer left, form right */}
      <Paper component="section" aria-labelledby="pw-title" sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "minmax(0,1fr)",
              md: "minmax(0,4fr) minmax(0,8fr)",
            },
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <KeyIcon color="primary" fontSize="small" />
              <Typography
                variant="h2"
                id="pw-title"
                sx={{ fontSize: "1.05rem" }}
              >
                Password
              </Typography>
            </Box>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.82rem", mt: 0.75 }}
            >
              Changing it signs you out on every device — you sign back in with
              the new password.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.625,
                mt: 1.25,
              }}
            >
              {[
                "At least 12 characters",
                "Must differ from the current one",
                "Last 5 passwords are rejected",
              ].map((t) => (
                <Box
                  key={t}
                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                >
                  <CheckCircleIcon
                    fontSize="inherit"
                    sx={{ color: mercatoTokens.good }}
                  />
                  <Typography
                    sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                  >
                    {t}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            component="form"
            onSubmit={submitPassword}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
          >
            <FormField
              label="Current password"
              type="password"
              autoComplete="current-password"
              required
              value={cur}
              onChange={(e) => setCur(e.target.value)}
            />
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: {
                  xs: "minmax(0,1fr)",
                  sm: "repeat(2, minmax(0,1fr))",
                },
              }}
            >
              <FormField
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                value={next}
                onChange={(e) => setNext(e.target.value)}
                helperText={
                  next !== "" && next.length < 12
                    ? "Use at least 12 characters"
                    : undefined
                }
                error={next !== "" && next.length < 12}
              />
              <FormField
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                value={next2}
                onChange={(e) => setNext2(e.target.value)}
                error={next2 !== "" && next !== next2}
                helperText={
                  next2 !== "" && next !== next2
                    ? "Passwords do not match"
                    : undefined
                }
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={changing || !pwValid}
                aria-busy={changing}
              >
                {changing ? (
                  <ButtonLoader label="Changing" />
                ) : (
                  "Change password + sign out"
                )}
              </Button>
              <Typography variant="caption" color="text.secondary">
                You sign in again right after — on every device.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Roles & access — detailed */}
      <Paper component="section" aria-labelledby="roles-title" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShieldIcon color="primary" fontSize="small" />
          <Typography
            variant="h2"
            id="roles-title"
            sx={{ flex: 1, fontSize: "1.05rem" }}
          >
            Roles &amp; access
          </Typography>
          <Chip
            label={`${me.permissions.length} permissions`}
            size="small"
            sx={{ bgcolor: mercatoTokens.brandSoft, color: "primary.dark" }}
          />
        </Box>
        <Typography color="text.secondary" sx={{ fontSize: "0.8rem", mt: 0.5 }}>
          Display only — the server re-checks every permission on each request.
          To change your access, ask another admin.
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        <DetailRow label="Account">
          <Typography sx={{ fontSize: "0.86rem", fontWeight: 600 }}>
            {me.email}
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Status">
          <Chip
            label={me.status}
            size="small"
            sx={
              me.status === "ACTIVE"
                ? { bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }
                : { bgcolor: mercatoTokens.badSoft, color: mercatoTokens.bad }
            }
          />
        </DetailRow>
        <Divider />
        <DetailRow label="Member since">
          <Typography sx={{ fontSize: "0.86rem" }}>
            {new Date(me.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label={`Roles (${me.roles.length})`}>
          {me.roles.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: "0.86rem" }}>
              No roles assigned — access is limited until another admin grants
              one.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {me.roles.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  size="small"
                  sx={{ bgcolor: mercatoTokens.text, color: "#fff" }}
                />
              ))}
            </Box>
          )}
        </DetailRow>
        <Divider />
        <DetailRow label="Permissions">
          {matrix.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: "0.86rem" }}>
              No permissions granted.
            </Typography>
          ) : (
            <Box sx={{ maxWidth: 560 }}>
              <Table
                size="small"
                aria-label="Permission matrix by resource"
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  "& .MuiTableCell-root": { py: 0.75 },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 800 }}>Resource</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      Read
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      Write
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      Admin
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matrix.map((r) => (
                    <TableRow key={r.resource}>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {r.resource}
                      </TableCell>
                      <MatrixCell on={r.read} label={`Read access to ${r.resource}`} />
                      <MatrixCell on={r.write} label={`Write access to ${r.resource}`} />
                      <MatrixCell on={r.admin} label={`Admin access to ${r.resource}`} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.75 }}
              >
                Read = view-type · Write = create/edit-type · Admin =
                manage-type (suspend, assign, revoke…). The server re-checks
                the exact permission on every request.
              </Typography>
            </Box>
          )}
        </DetailRow>
      </Paper>

      {/* Guided tour */}
      {tour ? (
        <TourDialog
          eyebrow={tour.kind === "totp" ? "Authenticator tour" : "Email-code tour"}
          steps={tour.kind === "totp" ? TOTP_TOUR : EMAIL_TOUR}
          step={tour.step}
          onStep={(n) => setTour({ kind: tour.kind, step: n })}
          onClose={() => setTour(null)}
          onStart={() =>
            tour.kind === "totp" ? startTotpEnroll() : startEmailEnable()
          }
          starting={tour.kind === "totp" ? enrolling : requesting}
          startLabel={tour.kind === "totp" ? "Start setup" : "Send my code"}
        />
      ) : null}

      {/* TOTP enroll — wide, stepped screens (no scrollbar) */}
      <Modal
        open={totpDialog === "enroll"}
        onClose={() => {
          setTotpDialog(null);
          setQr(null);
        }}
        title="Link your authenticator"
        subtitle="Two quick screens: scan, then save + confirm."
        icon={<PhonelinkLockIcon fontSize="small" />}
        maxWidth="sm"
        actions={
          enrollStep === 0 ? (
            <>
              <Button
                onClick={() => {
                  setTotpDialog(null);
                  setQr(null);
                }}
              >
                Close
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={() => setEnrollStep(1)}>
                Next: save codes
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => setEnrollStep(0)}>
                Back
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                form="totp-confirm-form"
                type="submit"
                variant="contained"
                disabled={confirmingTotp || !ackCodes || !totpCode.trim()}
                aria-busy={confirmingTotp}
              >
                {confirmingTotp ? (
                  <ButtonLoader label="Confirming" />
                ) : (
                  "Confirm authenticator"
                )}
              </Button>
            </>
          )
        }
      >
          <Stepper activeStep={enrollStep} alternativeLabel>
            <Step>
              <StepLabel
                sx={{ "& .MuiStepLabel-label": { fontSize: "0.7rem" } }}
              >
                Scan code
              </StepLabel>
            </Step>
            <Step>
              <StepLabel
                sx={{ "& .MuiStepLabel-label": { fontSize: "0.7rem" } }}
              >
                Save + confirm
              </StepLabel>
            </Step>
          </Stepper>
          {qr && enrollStep === 0 ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "minmax(0,1fr)",
                    sm: "auto minmax(0,1fr)",
                  },
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    bgcolor: "#fff",
                    borderRadius: 3,
                    p: 1,
                    mx: "auto",
                  }}
                >
                  <Image
                    src={qr.qrDataUrl}
                    alt="QR code to link your authenticator app"
                    width={148}
                    height={148}
                    priority
                  />
                </Box>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                >
                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 700 }}>
                    Step 1 — scan with your app
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: "0.82rem" }}
                  >
                    Open Google / Microsoft Authenticator or Authy, tap “+”, and
                    point your camera at the code.
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ wordBreak: "break-all" }}
                  >
                    No camera? Choose “enter key manually”: {qr.otpauthUrl}
                  </Typography>
                </Box>
              </Box>
            </>
          ) : null}
          {qr && enrollStep === 1 ? (
            <>
              <Alert severity="warning" sx={{ py: 0.75 }}>
                <b>Step 2 — save these 10 recovery codes now.</b> Each works
                once, they never show again, and they are your only way in if
                you lose your phone.
              </Alert>
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                aria-label="Recovery codes"
              >
                {qr.recoveryCodes.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    variant="outlined"
                    size="small"
                    sx={{ fontVariantNumeric: "tabular-nums" }}
                  />
                ))}
              </Box>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={ackCodes}
                    onChange={(e) => setAckCodes(e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ fontSize: "0.82rem" }}>
                    I saved the recovery codes somewhere safe
                  </Typography>
                }
              />
              <Box
                component="form"
                id="totp-confirm-form"
                onSubmit={confirmTotpEnroll}
                noValidate
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                <FormField
                  label="Step 3 — 6-digit code from your app"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  hint="Read the current code for this account in the app."
                />
              </Box>
            </>
          ) : null}
      </Modal>

      <Modal
        open={totpDialog === "disable"}
        onClose={() => setTotpDialog(null)}
        title="Turn off authenticator?"
        subtitle="Proof first, then everything is wiped."
        icon={<PhonelinkLockIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setTotpDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              form="totp-disable-form"
              type="submit"
              variant="contained"
              color="error"
              disabled={disablingTotp || !totpPassword || !totpDisableCode.trim()}
              aria-busy={disablingTotp}
            >
              {disablingTotp ? (
                <ButtonLoader label="Turning off" />
              ) : (
                "Turn off + sign out"
              )}
            </Button>
          </>
        }
      >
          <Alert severity="error">
            <b>You will be signed out everywhere.</b> The app link and all
            recovery codes are permanently deleted. With no method left, sign-in
            needs only email + password.
          </Alert>
          <Box
            component="form"
            id="totp-disable-form"
            onSubmit={confirmTotpDisable}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <FormField
              label="Current password — proves it is you"
              type="password"
              autoComplete="current-password"
              required
              value={totpPassword}
              onChange={(e) => setTotpPassword(e.target.value)}
            />
            <FormField
              label="Current app code (or a recovery code)"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={totpDisableCode}
              onChange={(e) => setTotpDisableCode(e.target.value)}
            />
          </Box>
      </Modal>

      {/* Email enable */}
      <Modal
        open={emailDialog === "enable"}
        onClose={() => setEmailDialog(null)}
        title="Enable email codes"
        subtitle="We emailed you — type it back."
        icon={<MarkEmailReadIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setEmailDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              form="email-enable-form"
              type="submit"
              variant="contained"
              disabled={confirmingEmail || !/^\d{6}$/.test(emailCode.trim())}
              aria-busy={confirmingEmail}
            >
              {confirmingEmail ? (
                <ButtonLoader label="Confirming" />
              ) : (
                "Confirm + turn on"
              )}
            </Button>
          </>
        }
      >
          <Stepper activeStep={1} alternativeLabel>
            <Step>
              <StepLabel
                sx={{ "& .MuiStepLabel-label": { fontSize: "0.7rem" } }}
              >
                We emailed you
              </StepLabel>
            </Step>
            <Step>
              <StepLabel
                sx={{ "& .MuiStepLabel-label": { fontSize: "0.7rem" } }}
              >
                Type it back
              </StepLabel>
            </Step>
          </Stepper>
          <Alert severity="info">
            {emailSent
              ? "Code sent — check your inbox (and spam). Only the latest code works: 10 min, 5 tries."
              : "Request a code first."}
          </Alert>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={startEmailEnable}
              disabled={requesting}
              aria-busy={requesting}
            >
              {requesting ? "Sending…" : "Resend code"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              Resending cancels the previous code.
            </Typography>
          </Box>
          <Box
            component="form"
            id="email-enable-form"
            onSubmit={confirmEmailEnable}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <FormField
              label="6-digit email code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 6 } }}
            />
          </Box>
      </Modal>

      {/* Email disable — kills sessions */}
      <Modal
        open={emailDialog === "disable"}
        onClose={() => setEmailDialog(null)}
        title="Turn off email codes?"
        subtitle="Proof first, then you sign out everywhere."
        icon={<MarkEmailReadIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setEmailDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              form="email-disable-form"
              type="submit"
              variant="contained"
              color="error"
              disabled={
                disablingEmail ||
                !emailPassword ||
                !/^\d{6}$/.test(emailDisableCode.trim())
              }
              aria-busy={disablingEmail}
            >
              {disablingEmail ? (
                <ButtonLoader label="Turning off" />
              ) : (
                "Turn off + sign out"
              )}
            </Button>
          </>
        }
      >
          <Alert severity="error">
            <b>You will be signed out everywhere.</b> A fresh code was just
            emailed — type it below with your password to confirm it is you.
          </Alert>
          <Box
            component="form"
            id="email-disable-form"
            onSubmit={confirmEmailDisable}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <FormField
              label="Current password — proves it is you"
              type="password"
              autoComplete="current-password"
              required
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
            <FormField
              label="Fresh 6-digit email code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={emailDisableCode}
              onChange={(e) => setEmailDisableCode(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 6 } }}
            />
          </Box>
      </Modal>
    </Box>
  );
}

export function SecurityView() {
  return (
    <Suspense fallback={<DataLoader label="Loading security" />}>
      <SecurityContent />
    </Suspense>
  );
}
