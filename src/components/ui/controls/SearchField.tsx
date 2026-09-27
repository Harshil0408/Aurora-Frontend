'use client';

import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export type SearchFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
  minWidth?: number;
};

/** Premium search box — icon, one-click clear, announced label. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  minWidth = 200,
  size = 'small',
  slotProps,
  ...rest
}: SearchFieldProps) {
  const { 'aria-label': ariaLabelProp, ...textRest } = rest as TextFieldProps & {
    'aria-label'?: string;
  };
  const ariaLabel =
    ariaLabelProp ??
    (typeof textRest.label === 'string' ? textRest.label : 'Search');
  const baseInput = slotProps?.input;
  return (
    <TextField
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size={size}
      sx={{ minWidth, ...textRest.sx }}
      slotProps={{
        ...slotProps,
        htmlInput: { ...slotProps?.htmlInput, 'aria-label': ariaLabel },
        input: {
          ...baseInput,
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'text.disabled' }}>
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                aria-label="Clear search"
                onClick={() => onChange('')}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
      {...textRest}
    />
  );
}
