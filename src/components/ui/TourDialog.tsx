'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

export interface GuideStep {
  title: string;
  body: ReactNode;
}

/**
 * Skippable guided tour: Stepper + Back/Next/Skip, final step becomes the
 * CTA that starts the real flow. Never a forced linear lock-in.
 *
 * Kept out of Guide.tsx so routes that only need accordions/rows never
 * ship the Stepper/Dialog subtree in their first-load JS.
 */
export function TourDialog({
  eyebrow,
  steps,
  step,
  onStep,
  onClose,
  onStart,
  starting,
  startLabel,
}: {
  eyebrow: string;
  steps: GuideStep[];
  step: number;
  onStep: (n: number) => void;
  onClose: () => void;
  onStart: () => void;
  starting?: boolean;
  startLabel: string;
}) {
  const last = step === steps.length - 1;
  const current = steps[step];
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="tour-title">
      <DialogTitle id="tour-title" sx={{ pb: 0.5 }}>
        {eyebrow} · {current.title}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stepper activeStep={step} alternativeLabel sx={{ pt: 0.5 }}>
          {steps.map((s) => (
            <Step key={s.title}>
              <StepLabel
                slotProps={{ stepIcon: { sx: { fontSize: '1.1rem' } } }}
                sx={{ '& .MuiStepLabel-label': { fontSize: '0.66rem' } }}
              >
                {s.title}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{current.body}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 0.5 }}>
        <Button color="inherit" onClick={onClose}>
          Skip tour
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" disabled={step === 0} onClick={() => onStep(step - 1)}>
          Back
        </Button>
        {last ? (
          <Button variant="contained" onClick={onStart} disabled={starting} aria-busy={starting}>
            {starting ? 'Starting…' : startLabel}
          </Button>
        ) : (
          <Button variant="contained" onClick={() => onStep(step + 1)}>
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
