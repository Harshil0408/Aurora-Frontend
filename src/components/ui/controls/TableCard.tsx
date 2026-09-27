'use client';

import { useId } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { FallbackUI } from '../FallbackUI';

export interface TableCardEmpty {
  when: boolean;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface TableCardProps {
  title: string;
  subtitle?: string;
  /** Header-right controls (buttons, filters). */
  actions?: React.ReactNode;
  /** Footer strip (pagination, counts). */
  footer?: React.ReactNode;
  /** Always-visible row under the header (tabs, filters) — stays up even when empty. */
  toolbar?: React.ReactNode;
  /** Helpful empty state rendered instead of children when `when`. */
  empty?: TableCardEmpty;
  children: React.ReactNode;
}

/**
 * The one consistent table shell: title + count subtitle, optional
 * header actions, scroll-safe body, helpful empty state, footer strip.
 * Every list page renders its table inside this — no hand-rolled Papers.
 */
export function TableCard({ title, subtitle, actions, footer, toolbar, empty, children }: TableCardProps) {
  const titleId = useId();
  return (
    <Paper component="section" aria-labelledby={titleId} sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" id={titleId} sx={{ fontSize: '1.05rem' }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.25 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
          </Box>
        ) : null}
      </Box>

      {toolbar ? <Box sx={{ mt: 1.5 }}>{toolbar}</Box> : null}

      {empty?.when ? (
        <FallbackUI
          title={empty.title}
          description={empty.description}
          actionLabel={empty.actionLabel}
          onAction={empty.onAction}
        />
      ) : (
        children
      )}

      {footer ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            mt: 1.5,
            pt: 1.5,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {footer}
        </Box>
      ) : null}
    </Paper>
  );
}
