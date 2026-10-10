'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useThemeManager } from '@/app/providers';
import { THEME_PRESETS, type ThemePreset } from '@/lib/themes';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { FormField } from '@/components/ui/controls';
import { mercatoTokens } from '@/lib/theme';

function PresetSwatches({ preset }: { preset: ThemePreset }) {
  const c = preset.colors;
  const cells = [c.bg, c.surface2, c.brand, c.brandSoft, c.text];
  return (
    <Box
      aria-hidden
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        height: 48,
      }}
    >
      {cells.map((hex) => (
        <Box key={hex} sx={{ bgcolor: hex }} />
      ))}
    </Box>
  );
}

export function ThemesView() {
  const { preset, colors, applyPreset } = useThemeManager();
  const rest = THEME_PRESETS.filter((p) => p.id !== preset.id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Compact header */}
      <Box sx={{ mt: 0.5, maxWidth: '65ch' }}>
        <Typography variant="h1" component="h1">
          Appearance
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.875rem', lineHeight: 1.6 }}>
          One palette for the whole console. Pick a curated preset — it applies
          instantly and is remembered on this device.
        </Typography>
      </Box>

      {/* Active preset — featured full-width row, not another equal card */}
      <Paper
        component="section"
        aria-label={`Active theme: ${preset.name}`}
        className="aurora-rise"
        sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              flex: 'none',
              background: `conic-gradient(${colors.brand} 0 40%, ${colors.brandSoft} 0 65%, ${colors.surface} 0 85%, ${colors.text} 0 100%)`,
              border: 1,
              borderColor: 'divider',
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.25 }}>
              Active: {preset.name}
              <Chip
                label="Active"
                size="small"
                icon={<CheckCircleIcon />}
                sx={{ ml: 1, height: 22, fontSize: '0.68rem', bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {preset.tagline}
            </Typography>
          </Box>
          <Chip
            label={`${THEME_PRESETS.length} curated palettes`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <GuideAccordion title="How theming works">
          <HowRow n={1}>
            <b>Presets</b> apply instantly to every screen and are saved on
            this device — reload and your palette is still here.
          </HowRow>
          <HowRow n={2}>
            Status colors (success, warning, error, info) stay shared across
            palettes, so alerts keep their meaning everywhere.
          </HowRow>
        </GuideAccordion>
      </Paper>

      {/* Preset gallery — 2-col rhythm with the active preset excluded (shown above) */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
        }}
      >
        {rest.map((p, i) => (
          <Paper
            key={p.id}
            component="section"
            aria-label={`${p.name} theme`}
            className="aurora-rise"
            sx={{
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              cursor: 'pointer',
              animationDelay: `${Math.min(i, 5) * 60}ms`,
              transition:
                'border-color 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms cubic-bezier(0.16,1,0.3,1), transform 150ms cubic-bezier(0.16,1,0.3,1)',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-1px)',
                boxShadow: 2,
              },
              '&:active': { transform: 'scale(0.98)' },
              '&:focus-visible': { outline: '2px solid var(--brand)', outlineOffset: 2 },
            }}
            onClick={() => applyPreset(p.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                applyPreset(p.id);
              }
            }}
          >
            <PresetSwatches preset={p} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon color="primary" fontSize="small" />
              <Typography variant="h2" sx={{ flex: 1 }}>
                {p.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {p.vibe}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
              Good for: {p.bestFor}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPreset(p.id);
                }}
                fullWidth
                sx={{ minHeight: 40 }}
              >
                {`Use ${p.name}`}
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Live preview */}
      <Paper component="section" aria-labelledby="preview-title" sx={{ p: 2.5 }} className="aurora-rise">
        <Typography variant="h2" id="preview-title">
          Live preview
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', mt: 0.5 }}>
          Every control below follows the active palette in real time.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
          <Button size="small" variant="contained">
            Primary action
          </Button>
          <Button size="small" variant="outlined">
            Secondary
          </Button>
          <Button size="small" variant="text">
            Quiet
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
          <Chip label="Active" size="small" color="primary" />
          <Chip label="Paid" size="small" sx={{ bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }} />
          <Chip label="Failed" size="small" sx={{ bgcolor: mercatoTokens.badSoft, color: mercatoTokens.bad }} />
          <Chip label="Support" size="small" variant="outlined" />
        </Box>
        <Box sx={{ mt: 1.5, maxWidth: 480 }}>
          <FormField label="Sample field" placeholder="Type to test focus ring" hint="Focus me to see the brand ring." />
        </Box>
        <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
          Cards, buttons, focus rings, and shadows all follow your theme live.
        </Alert>
      </Paper>
    </Box>
  );
}
