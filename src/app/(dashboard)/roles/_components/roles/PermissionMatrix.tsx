'use client';

import { Box, Button, Checkbox, Chip, FormControlLabel, Typography } from '@mui/material';
import { DataLoader } from '@/components/ui/DataLoader';
import type { PermGroup } from '@/types/rbac';

export interface PermissionMatrixProps {
  groups: PermGroup[] | undefined;
  loading: boolean;
  /** Currently checked permission keys (draft). */
  checked: string[];
  onToggle: (key: string) => void;
  onToggleGroup: (keys: string[], select: boolean) => void;
  /** No `role.update` (or Super-Admin lock) — every input off. */
  disabled?: boolean;
  /** Keys the viewer doesn't hold (403 CANNOT_GRANT_UNHELD_PERMISSION). */
  unheld?: string[];
}

/**
 * Grouped permission checkbox matrix. Data always renders from the
 * `GET /admin/permissions` catalog — key lists are never hardcoded.
 * INACTIVE permissions render locked (the API rejects them anyway).
 */
export function PermissionMatrix({
  groups,
  loading,
  checked,
  onToggle,
  onToggleGroup,
  disabled = false,
  unheld = [],
}: PermissionMatrixProps) {
  if (loading) return <DataLoader variant="skeleton" lines={3} label="Loading permissions" />;
  if (!groups || groups.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: '0.86rem', py: 1 }}>
        No permissions in the catalog yet — define the first one from the Permissions screen.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
      {groups.map((g) => {
        const activeKeys = g.permissions.filter((p) => p.status === 'ACTIVE').map((p) => p.key);
        const on = activeKeys.filter((k) => checked.includes(k)).length;
        const allOn = activeKeys.length > 0 && on === activeKeys.length;
        return (
          <Box
            key={g.group}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.25,
                px: 2,
                py: 1.5,
                bgcolor: 'action.hover',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>{g.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {on}/{activeKeys.length} on
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                variant="outlined"
                disabled={disabled || activeKeys.length === 0}
                onClick={() => onToggleGroup(activeKeys, !allOn)}
              >
                {allOn ? 'Clear group' : 'Select all'}
              </Button>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              {g.permissions.map((p, idx) => {
                const isLastRow = idx >= g.permissions.length - (g.permissions.length % 2 === 0 ? 2 : 1);
                const locked = disabled || p.status === 'INACTIVE';
                const flagged = unheld.includes(p.key);
                return (
                  <FormControlLabel
                    key={p.key}
                    sx={{
                      px: 2,
                      py: 1,
                      m: 0,
                      borderBottom: { md: isLastRow ? 0 : 1 },
                      borderColor: 'divider',
                      alignItems: 'flex-start',
                    }}
                    control={
                      <Checkbox
                        checked={checked.includes(p.key)}
                        disabled={locked}
                        onChange={() => onToggle(p.key)}
                        sx={flagged ? { color: 'error.main' } : undefined}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          {p.label}{' '}
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: 'ui-monospace, monospace' }}
                          >
                            {p.key}
                          </Typography>
                        </Typography>
                        {p.description ? (
                          <Typography variant="caption" color="text.secondary">
                            {p.description}
                          </Typography>
                        ) : null}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {p.status === 'INACTIVE' ? (
                            <Chip label="Disabled" size="small" sx={{ height: 20, fontSize: '0.68rem' }} />
                          ) : null}
                          {flagged ? (
                            <Chip
                              label="You don't hold this"
                              size="small"
                              color="error"
                              sx={{ height: 20, fontSize: '0.68rem' }}
                            />
                          ) : null}
                        </Box>
                      </Box>
                    }
                  />
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
