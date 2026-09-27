'use client';

import { TextField, type TextFieldProps } from '@mui/material';
import { format, parseISO } from 'date-fns';

export type DateTimeMode = 'date' | 'time' | 'datetime';

const INPUT_TYPE: Record<DateTimeMode, string> = {
  date: 'date',
  time: 'time',
  datetime: 'datetime-local',
};

/** ISO value formatters for the matching mode (safe under TZ=UTC). */
export const toDateInput = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');
export const toTimeInput = (iso: string) => format(parseISO(iso), 'HH:mm');
export const toDateTimeInput = (iso: string) => format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");

export type DateTimeFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange'> & {
  /** Pick exactly what the user may enter: date only, time only, or both. */
  mode: DateTimeMode;
  /** Same string shape the native input uses (`yyyy-MM-dd`, `HH:mm`, …). */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

/**
 * Premium date/time picker built on the native calendar + clock (no extra
 * dependency, full keyboard + screen-reader support). Values stay strings
 * so forms remain simple controlled inputs.
 */
export function DateTimeField({
  mode,
  value,
  onChange,
  hint,
  size = 'small',
  helperText,
  slotProps,
  ...rest
}: DateTimeFieldProps) {
  return (
    <TextField
      type={INPUT_TYPE[mode]}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size={size}
      helperText={helperText ?? hint}
      slotProps={{
        ...slotProps,
        inputLabel: { ...slotProps?.inputLabel, shrink: true },
      }}
      {...rest}
    />
  );
}
