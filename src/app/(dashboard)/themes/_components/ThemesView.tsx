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
  const cells = [c.bg, c.surface, c.brand, c.brandSoft, c.text];
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
        height: 44,
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Compact header */}
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="h1" component="h1">
          Appearance
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
          Pick a palette — it applies instantly across the whole console and is remembered on this device.
        </Typography>
      </Box>

      {/* Active summary strip */}
      <Paper component="section" aria-label="Active theme" sx={{ py: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flex: 'none',
              background: `conic-gradient(${colors.brand} 0 40%, ${colors.brandSoft} 0 65%, ${colors.surface} 0 85%, ${colors.text} 0 100%)`,
              border: 1,
              borderColor: 'divider',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
              Active: {preset.name}
              <Chip
                label="Preset"
                size="small"
                sx={{ ml: 1, height: 20, fontSize: '0.66rem', bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }}
              />
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {preset.tagline}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {THEME_PRESETS.length} palettes
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
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
        </Box>
      </Paper>

      {/* Preset gallery */}
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: 'minmax(0,1fr)',
            sm: 'repeat(2, minmax(0,1fr))',
            xl: 'repeat(3, minmax(0,1fr))',
          },
        }}
      >
        {THEME_PRESETS.map((p) => {
          const active = p.id === preset.id;
          return (
            <Paper
              key={p.id}
              component="section"
              aria-label={`${p.name} theme`}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                cursor: 'pointer',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
                '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                ...(active
                  ? { boxShadow: `0 0 0 3px ${mercatoTokens.brandSoft}`, borderColor: 'primary.main' }
                  : null),
              }}
              onClick={() => {
                if (!active) applyPreset(p.id);
              }}
            >
              <PresetSwatches preset={p} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaletteIcon color="primary" fontSize="small" />
                <Typography variant="h2" sx={{ flex: 1, fontSize: '1rem' }}>
                  {p.name}
                </Typography>
                {active ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Active"
                    size="small"
                    sx={{ bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }}
                  />
                ) : null}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {p.vibe}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Good for: {p.bestFor}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 0.5 }}>
                <Button
                  size="small"
                  variant={active ? 'outlined' : 'contained'}
                  disabled={active}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyPreset(p.id);
                  }}
                  fullWidth
                >
                  {active ? 'Currently active' : `Use ${p.name}`}
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Live preview */}
      <Paper component="section" aria-labelledby="preview-title" sx={{ p: 2 }}>
        <Typography variant="h2" id="preview-title" sx={{ fontSize: '1.05rem' }}>
          Live preview
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
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
