'use client';

import { Alert, Box } from '@mui/material';
import { FormField, SelectField } from '@/components/ui/controls';
import { useListAttributesQuery } from '@/services/attributesApi';
import {
  LOOKUP_ATTRIBUTE_TYPES,
  lookupOptionLabel,
  lookupOptionsFromAttributes,
  type LookupField,
  type LookupOption,
} from '@/lib/variables';

export type { LookupField, LookupOption };

/**
 * Dynamic catalog dropdown for seller forms. Options come live from
 * `GET /admin/attributes?type=<type>&status=ACTIVE` — whatever the admin
 * adds, renames, reorders, or deactivates appears here (stored value is the
 * admin payload, e.g. INR, falling back to the key slug).
 *
 * Values are valuable and must come from attributes only: there are no
 * preset options and no manual typing. When the catalog is unreachable or
 * the list is still empty, an explanatory message is shown with an empty,
 * disabled dropdown. A saved value missing from a successfully loaded list
 * is preserved as its own option so saved stores never render blank.
 */
export function LookupSelect({
  field,
  label,
  value,
  onChange,
  hint,
  error,
  errorText,
  placeholder,
  minWidth,
}: {
  field: LookupField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: boolean;
  errorText?: string;
  placeholder?: string;
  minWidth?: number;
}) {
  const { data, isLoading, isError } = useListAttributesQuery({
    type: LOOKUP_ATTRIBUTE_TYPES[field],
    status: 'ACTIVE',
    limit: 100,
  });

  const rows = data?.data ?? [];
  // Cheap enough to compute per render; keeps saved values selectable.
  const live = lookupOptionsFromAttributes(rows);
  const options: LookupOption[] =
    value !== '' && !live.some((o) => o.value === value)
      ? [{ value, label: value }, ...live]
      : live;

  if (isLoading && rows.length === 0) {
    return <FormField label={label} value="" onChange={() => {}} disabled hint="Loading options…" />;
  }

  if (!isError && live.length > 0) {
    return (
      <SelectField
        label={label}
        value={value}
        onChange={onChange}
        options={options.map((o) => ({ value: o.value, label: lookupOptionLabel(o) }))}
        placeholder={placeholder}
        hint={hint}
        error={error}
        errorText={errorText}
        minWidth={minWidth}
      />
    );
  }

  // Fallback message + empty dropdown — values must come from attributes,
  // so manual typing and preset options are both off the table.
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Alert severity="warning" sx={{ fontSize: '0.8rem', py: 0.5, boxShadow: 'none' }}>
        {isError
          ? `Couldn't load the live ${label.toLowerCase()} list — please try again later.`
          : `No ${label.toLowerCase()} options yet — your admin needs to add them first.`}
      </Alert>
      <SelectField
        label={label}
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="No options available"
        hint={hint}
        error={error}
        errorText={errorText}
        minWidth={minWidth}
        disabled
      />
    </Box>
  );
}
