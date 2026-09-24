"use client";

import { useState } from "react";
import Image from "next/image";
import { Alert, Box, Button, Chip, TextField, Typography } from "@mui/material";
import {
  useConfirm2faMutation,
  useEnroll2faMutation,
} from "@/services/authApi";
import { setStage } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { normaliseApiError } from "@/types/api";
import { ButtonLoader } from "@/components/ui/Loaders";
import { DataLoader } from "@/components/ui/DataLoader";

export function Enroll2fa() {
  const dispatch = useAppDispatch();
  const pendingToken = useAppSelector((s) => s.auth.pendingToken);
  const [enroll, { isLoading: enrolling, data }] = useEnroll2faMutation();
  const [confirm, { isLoading: confirming }] = useConfirm2faMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const start = async () => {
    setError(null);
    if (!pendingToken) {
      setError("Your sign-in session expired. Start again.");
      return;
    }
    try {
      await enroll({ pendingToken }).unwrap();
    } catch (err) {
      const n = normaliseApiError({
        status: (err as { status?: number })?.status,
        data: (err as { data?: unknown })?.data,
      });
      setError(n.message);
    }
  };

  const onConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pendingToken || !code.trim()) {
      setError("Enter the 6-digit code shown in your authenticator app.");
      return;
    }
    try {
      await confirm({ pendingToken, code: code.trim() }).unwrap();
      setConfirmed(true);
    } catch {
      setError(
        "That code did not work. Check the time on your device and retry.",
      );
    }
  };

  if (confirmed) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Alert severity="success" role="status">
          Authenticator linked. Continue to verify and sign in.
        </Alert>
        <Button
          variant="contained"
          size="large"
          onClick={() => dispatch(setStage("verify"))}
        >
          Continue to verification
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error ? (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        ) : null}
        {enrolling ? (
          <DataLoader label="Generating your secure key" variant="inline" />
        ) : (
          <>
            <Typography variant="body1" color="text.secondary">
              Scan the QR code with Google Authenticator, Microsoft
              Authenticator, or Authy, then confirm with a code.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={start}
              disabled={enrolling}
              aria-busy={enrolling}
            >
              {enrolling ? (
                <ButtonLoader label="Generating" />
              ) : (
                "Generate setup code"
              )}
            </Button>
            <Button
              variant="text"
              color="inherit"
              onClick={() => dispatch(setStage("verify"))}
            >
              I already have a code
            </Button>
          </>
        )}
      </Box>
    );
  }

  const codes = data.data.recoveryCodes;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          bgcolor: "#fff",
          borderRadius: 3,
          p: 2,
        }}
      >
        <Image
          src={data.data.qrDataUrl}
          alt="QR code to link your authenticator app"
          width={200}
          height={200}
          priority
        />
      </Box>
      <Alert severity="warning" role="alert">
        Save these 10 recovery codes now — each works once and they are never
        shown again.
      </Alert>
      <Box
        sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
        aria-label="Recovery codes"
      >
        {codes.map((c) => (
          <Chip
            key={c}
            label={c}
            variant="outlined"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          />
        ))}
      </Box>
      <Box
        component="form"
        onSubmit={onConfirm}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="6-digit code from your app"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={confirming}
          aria-busy={confirming}
        >
          {confirming ? (
            <ButtonLoader label="Confirming" />
          ) : (
            "Confirm authenticator"
          )}
        </Button>
      </Box>
    </Box>
  );
}
