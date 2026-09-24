'use client';

import { Box, Button, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import InboxIcon from '@mui/icons-material/Inbox';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Generic empty/error/notice surface.
 * Tone selects icon + semantic pairing (color is never the only signal).
 */
interface FallbackUIProps {
  title: string;
  description?: string;
  tone?: 'empty' | 'error' | 'locked';
  actionLabel?: string;
  onAction?: () => void;
}

const icons = { empty: InboxIcon, error: ErrorIcon, locked: LockIcon } as const;

export function FallbackUI({ title, description, tone = 'empty', actionLabel, onAction }: FallbackUIProps) {
  const Icon = icons[tone];
  return (
    <Box
      role={tone === 'error' ? 'alert' : 'status'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        py: 6,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          color: tone === 'error' ? 'error.main' : 'primary.main',
        }}
      >
        <Icon />
      </Box>
      <Typography variant="h2" component="p">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}
