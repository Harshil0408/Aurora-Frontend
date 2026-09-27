'use client';

import { useId } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  type DialogProps,
} from '@mui/material';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Small glyph in a tinted tile beside the title. */
  icon?: React.ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The one consistent modal shell: tinted icon tile + title + subtitle,
 * comfortable content rhythm, standard action bar. Wrap every dialog in it
 * (or in ConfirmDialog) instead of hand-rolling Dialog paddings.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'xs',
  actions,
  children,
}: ModalProps) {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth aria-labelledby={titleId}>
      <DialogTitle id={titleId} sx={{ pb: subtitle ? 0.5 : undefined }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {icon ? (
            <Box
              aria-hidden
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                borderRadius: 2.5,
                bgcolor: 'primary.light',
                color: 'primary.dark',
                flex: 'none',
              }}
            >
              {icon}
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2" sx={{ fontSize: '1.05rem', lineHeight: 1.25 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.25 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {children}
      </DialogContent>
      {actions ? <DialogActions sx={{ px: 3, pb: 2, gap: 0.5 }}>{actions}</DialogActions> : null}
    </Dialog>
  );
}
