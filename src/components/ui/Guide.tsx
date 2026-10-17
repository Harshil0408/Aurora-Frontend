'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import { mercatoTokens } from '@/lib/theme';

/**
 * Shared zero-knowledge UX primitives (see AGENTS.md "UX bar").
 * Numbered steps, tinted helper accordions, and label/value rows.
 * The guided-tour dialog lives in TourDialog.tsx (lazy, rare UI).
 */

export function StepNum({ n }: { n: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        flex: 'none',
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.72rem',
        fontWeight: 800,
        bgcolor: mercatoTokens.brandSoft,
        color: 'primary.dark',
      }}
    >
      {n}
    </Box>
  );
}

export function HowRow({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
      <StepNum n={n} />
      <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', flex: 1 }}>
        {children}
      </Typography>
    </Box>
  );
}

/** Collapsed guidance reads as an inviting tinted helper row, not a bare box. */
export function GuideAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        mt: 1,
        border: 0,
        borderRadius: 2,
        bgcolor: mercatoTokens.brandSoft,
        '&:before': { display: 'none' },
        '&.Mui-expanded': { bgcolor: 'action.hover' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'primary.dark' }} />}
        sx={{ minHeight: 36, borderRadius: 2, '& .MuiAccordionSummary-content': { my: 0.75 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpOutlinedIcon sx={{ fontSize: '1rem', color: 'primary.dark' }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'primary.dark' }}>
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 0 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1.25, alignItems: 'flex-start' }}>
      <Typography
        variant="caption"
        sx={{
          flex: 'none',
          width: 132,
          pt: 0.25,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'text.disabled',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
