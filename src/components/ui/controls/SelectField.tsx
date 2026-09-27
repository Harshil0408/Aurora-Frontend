'use client';

import { useId } from 'react';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | string[];
  /** First-row hint like "All roles" (selects `""`). Omit for required picks. */
  placeholder?: string;
  hint?: string;
  error?: boolean;
  errorText?: string;
  minWidth?: number;
  ariaLabel?: string;
}

/** Premium labeled dropdown — filters and form picks share one look. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  error,
  errorText,
  minWidth = 150,
  ariaLabel,
}: SelectFieldProps) {
  const labelId = useId();
  const items: SelectOption[] = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );
  const handle = (e: SelectChangeEvent<string>) => onChange(e.target.value);
  return (
    <FormControl size="small" error={error} sx={{ minWidth }}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={handle}
        aria-label={ariaLabel ?? label}
      >
        {placeholder ? (
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
        ) : null}
        {items.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
      {error && errorText ? (
        <FormHelperText role="alert">{errorText}</FormHelperText>
      ) : hint ? (
        <FormHelperText>{hint}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
