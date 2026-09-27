'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { FormField } from './FormField';
import { Modal } from './Modal';
import { ButtonLoader } from '../Loaders';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  /** Destructive red vs calm blue. Defaults to destructive. */
  tone?: 'danger' | 'info';
  /** Blast radius first: what exactly happens on confirm. */
  consequence: React.ReactNode;
  /** Extra context below the blast radius. */
  description?: React.ReactNode;
  /** Checkbox proof, e.g. "I understand I will be signed out". */
  ackLabel?: string;
  /** Type-to-confirm proof, e.g. "LOGOUT". Confirm stays off until typed. */
  confirmWord?: string;
  confirmLabel?: string;
  workingLabel?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * Consistent confirmation popup: blast radius first, then proof
 * (checkbox and/or type-to-confirm), then the guarded action.
 * The confirm button enables only when every proof is satisfied.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  subtitle,
  tone = 'danger',
  consequence,
  description,
  ackLabel,
  confirmWord,
  confirmLabel = 'Confirm',
  workingLabel = 'Working…',
  loading = false,
  error = null,
}: ConfirmDialogProps) {
  const [ack, setAck] = useState(false);
  const [word, setWord] = useState('');

  const resetProofs = () => {
    setAck(false);
    setWord('');
  };
  const handleClose = () => {
    resetProofs();
    onClose();
  };
  const handleConfirm = () => {
    resetProofs();
    onConfirm();
  };

  const ready =
    (!ackLabel || ack) && (!confirmWord || word.trim() === confirmWord);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      maxWidth="xs"
      icon={
        tone === 'danger' ? (
          <WarningAmberIcon fontSize="small" />
        ) : (
          <InfoOutlinedIcon fontSize="small" />
        )
      }
      actions={
        <>
          <Button onClick={handleClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={tone === 'danger' ? 'error' : 'primary'}
            disabled={!ready || loading}
            onClick={handleConfirm}
            aria-busy={loading}
          >
            {loading ? <ButtonLoader label={workingLabel} /> : confirmLabel}
          </Button>
        </>
      }
    >
      <Alert severity={tone === 'danger' ? 'error' : 'info'}>{consequence}</Alert>
      {description ? (
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem' }}>
          {description}
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      {ackLabel ? (
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Checkbox
              size="small"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
          }
          label={<Typography sx={{ fontSize: '0.84rem' }}>{ackLabel}</Typography>}
        />
      ) : null}
      {confirmWord ? (
        <FormField
          label={`Type ${confirmWord} to confirm`}
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder={confirmWord}
          hint="Typing the word proves this was deliberate, not a misclick."
        />
      ) : null}
    </Modal>
  );
}
