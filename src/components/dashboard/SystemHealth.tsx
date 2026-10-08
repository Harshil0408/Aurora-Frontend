'use client';

import Link from 'next/link';
import { Box, Paper, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { healthMeters, healthServices, type HealthService } from '@/lib/sampleData';
import { mercatoTokens } from '@/lib/theme';
import { ADMIN_HOME_PATH } from '@/lib/panels';

const dot: Record<HealthService['state'], string> = {
  operational: mercatoTokens.good,
  degraded: mercatoTokens.accent,
  outage: mercatoTokens.bad,
};

const stateColor: Record<HealthService['state'], string> = {
  operational: mercatoTokens.good,
  degraded: mercatoTokens.accentStrong,
  outage: mercatoTokens.bad,
};

const stateLabel: Record<HealthService['state'], string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
};

/**
 * Service status list (§5): summary banner only when degraded, then
 * dot + name/detail + inline history bars + state label, plus meters.
 */
export function SystemHealth() {
  const degraded = healthServices.filter((s) => s.state !== 'operational');

  return (
    <Paper component="section" aria-labelledby="health-title">
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" id="health-title">
            System health
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            Last 30 days · checked every minute
          </Typography>
        </Box>
        <Typography
          component={Link}
          href={ADMIN_HOME_PATH}
          aria-disabled="true"
          title="Status page — coming soon"
          onClick={(e) => e.preventDefault()}
          sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'primary.dark', p: 0.5 }}
        >
          Status page
        </Typography>
      </Box>

      {degraded.length > 0 ? (
        <Box
          role="status"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mt: 2.25, p: 1.75, borderRadius: 4, bgcolor: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong }}
        >
          <WarningIcon sx={{ width: 24, height: 24 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ display: 'block', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
              Search is responding slowly
            </Typography>
            <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary' }}>
              The other five services are operational.
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.1 }}>
              99.94%
            </Typography>
            <Typography variant="caption" color="text.secondary">30-day uptime</Typography>
          </Box>
        </Box>
      ) : null}

      <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 1, p: 0 }}>
        {healthServices.map((s) => (
          <Box
            key={s.name}
            component="li"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '10px minmax(0, 1fr) 96px', md: '10px minmax(0, 1fr) 178px 104px' }, alignItems: 'center', gap: 2, py: 1.625, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
          >
            <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dot[s.state] }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ display: 'block', fontWeight: 600, lineHeight: 1.25 }}>{s.name}</Typography>
              <Typography variant="caption" color="text.secondary">{s.detail}</Typography>
            </Box>
            <Box aria-hidden sx={{ display: { xs: 'none', md: 'flex' }, gap: '2px', height: 24, alignItems: 'stretch' }}>
              {[...s.days.padStart(30, 'o').slice(-30)].map((c, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    borderRadius: '3px',
                    bgcolor: c === 'o' ? mercatoTokens.good : c === 'w' ? mercatoTokens.accent : mercatoTokens.bad,
                    opacity: c === 'o' ? 0.8 : 1,
                  }}
                />
              ))}
            </Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', color: stateColor[s.state] }}>
              {stateLabel[s.state]}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: '16px 24px', mt: 1.5, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
        {healthMeters.map((m) => (
          <Box key={m.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.86rem', mb: 1 }}>
              <Typography color="text.secondary">{m.label}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{m.display}</Typography>
            </Box>
            <Box
              role="img"
              aria-label={`${m.label}: ${m.display}`}
              sx={{ height: 8, borderRadius: 9999, bgcolor: 'action.hover', border: 1, borderColor: 'divider', overflow: 'hidden' }}
            >
              <Box sx={{ display: 'block', height: '100%', width: `${m.pct}%`, borderRadius: 9999, bgcolor: m.warn ? mercatoTokens.accent : mercatoTokens.brand }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
