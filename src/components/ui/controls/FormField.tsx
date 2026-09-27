'use client';

import { useState } from 'react';
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

/**
 * Premium labeled text field — the default input for the whole console.
 * Small + full-width by default, optional leading icon and hint line,
 * built-in show/hide toggle for passwords. Errors use helperText
 * (announced by screen readers via MUI's aria wiring).
 */
export type FormFieldProps = TextFieldProps & {
  /** Calm guidance shown when there is no error. */
  hint?: string;
  /** Leading icon (e.g. search, mail, lock). */
  startIcon?: React.ReactNode;
};

export function FormField({
  hint,
  startIcon,
  size = 'small',
  fullWidth = true,
  type,
  error,
  helperText,
  slotProps,
  ...rest
}: FormFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  const baseInput = slotProps?.input;
  const endAdornment = isPassword ? (
    <>
      {baseInput && 'endAdornment' in baseInput ? baseInput.endAdornment : null}
      <InputAdornment position="end">
        <IconButton
          size="small"
          edge="end"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
        >
          {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </IconButton>
      </InputAdornment>
    </>
  ) : (
    baseInput && 'endAdornment' in baseInput ? baseInput.endAdornment : undefined
  );

  return (
    <TextField
      size={size}
      fullWidth={fullWidth}
      type={isPassword && show ? 'text' : type}
      error={error}
      helperText={error ? helperText : (hint ?? helperText)}
      slotProps={{
        ...slotProps,
        input: {
          ...baseInput,
          ...(startIcon
            ? {
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.disabled' }}>
                    {startIcon}
                  </InputAdornment>
                ),
              }
            : null),
          ...(endAdornment ? { endAdornment } : null),
        },
      }}
      {...rest}
    />
  );
}
