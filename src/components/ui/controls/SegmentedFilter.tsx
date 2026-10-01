'use client';

import { Box } from '@mui/material';
import { mercatoTokens } from '@/lib/theme';

export interface SegmentedFilterOption<T extends string> {
  value: T;
  label: string;
  /** Live count rendered in its own chip. */
  count?: number;
  /** Status dot color (e.g. good/brand) — omitted for plain options. */
  dot?: string;
  /** Screen-reader name; defaults to the visible label. */
  ariaLabel?: string;
}

export interface SegmentedFilterProps<T extends string> {
  options: Array<SegmentedFilterOption<T>>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}

/**
 * Segmented pill filter — compact option group with per-option counts.
 * Real toggle buttons (`aria-pressed`): for row filtering, not tab panels.
 * Colors resolve per render so saved themes apply.
 */
export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedFilterProps<T>) {
  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      sx={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: 0.5,
        p: 0.5,
        borderRadius: 3,
        bgcolor: mercatoTokens.surface2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <Box
            key={o.value}
            component="button"
            type="button"
            aria-pressed={selected}
            aria-label={o.ariaLabel ?? o.label}
            onClick={() => onChange(o.value)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              minHeight: 36,
              border: 'none',
              borderRadius: 9999,
              bgcolor: selected ? mercatoTokens.brandSoft : 'transparent',
              color: selected ? mercatoTokens.brandStrong : 'text.secondary',
              fontWeight: selected ? 800 : 600,
              fontSize: '0.84rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background-color 180ms ease, color 180ms ease',
              '&:hover': {
                bgcolor: selected ? mercatoTokens.brandSoft : 'action.hover',
                color: selected ? mercatoTokens.brandStrong : 'text.primary',
              },
              '&:focus-visible': {
                outline: `2px solid ${mercatoTokens.brand}`,
                outlineOffset: 2,
              },
            }}
          >
            {o.dot ? (
              <Box
                aria-hidden
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: o.dot, flex: 'none' }}
              />
            ) : null}
            {o.label}
            {o.count != null ? (
              <Box
                aria-hidden
                component="span"
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 9999,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  lineHeight: 1.4,
                  fontVariantNumeric: 'tabular-nums',
                  bgcolor: selected ? 'primary.main' : 'action.hover',
                  color: selected ? '#fff' : 'text.secondary',
                }}
              >
                {o.count}
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
