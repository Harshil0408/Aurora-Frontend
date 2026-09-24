'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Paper, Typography } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import FlagIcon from '@mui/icons-material/Flag';
import GroupIcon from '@mui/icons-material/Group';
import { feedEvents, type FeedTone, type FeedType } from '@/lib/sampleData';
import { mercatoTokens } from '@/lib/theme';

const tone: Record<FeedTone, { bg: string; color: string }> = {
  brand: { bg: mercatoTokens.brandSoft, color: mercatoTokens.brandStrong },
  good: { bg: mercatoTokens.goodSoft, color: mercatoTokens.good },
  warn: { bg: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong },
  bad: { bg: mercatoTokens.badSoft, color: mercatoTokens.bad },
  info: { bg: mercatoTokens.infoSoft, color: mercatoTokens.info },
};

const icons = {
  'user-plus': <PersonAddIcon sx={{ width: 18, height: 18 }} />,
  alert: <WarningIcon sx={{ width: 18, height: 18 }} />,
  check: <CheckCircleIcon sx={{ width: 18, height: 18 }} />,
  repeat: <AutorenewIcon sx={{ width: 18, height: 18 }} />,
  refund: <AutorenewIcon sx={{ width: 18, height: 18 }} />,
  flag: <FlagIcon sx={{ width: 18, height: 18 }} />,
  users: <GroupIcon sx={{ width: 18, height: 18 }} />,
} as const;

const filters: { key: FeedType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'orders', label: 'Orders' },
  { key: 'finance', label: 'Finance' },
];

/** Chronological timeline (§5) with filter chips above. */
export function ActivityFeed() {
  const [filter, setFilter] = useState<FeedType | 'all'>('all');
  const visible = feedEvents.filter((e) => filter === 'all' || e.type === filter);

  return (
    <Paper component="section" aria-labelledby="feed-title">
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" id="feed-title">
            Recent activity
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            Things that may need you
          </Typography>
        </Box>
        <Typography
          component={Link}
          href="/dashboard"
          aria-disabled="true"
          title="Full audit log — coming soon"
          onClick={(e) => e.preventDefault()}
          sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'primary.dark', p: 0.5 }}
        >
          Audit log
        </Typography>
      </Box>
      <Box role="group" aria-label="Filter activity" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
        {filters.map((f) => (
          <Box
            key={f.key}
            component="button"
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            sx={{
              px: 1.75,
              py: 0.75,
              borderRadius: 9999,
              border: 1,
              borderColor: filter === f.key ? mercatoTokens.text : 'divider',
              bgcolor: filter === f.key ? mercatoTokens.text : 'background.paper',
              color: filter === f.key ? '#fff' : 'text.secondary',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </Box>
        ))}
      </Box>
      <Box component="ol" sx={{ listStyle: 'none', position: 'relative', m: 0, mt: 2.25, p: 0 }}>
        {visible.map((e, i) => (
          <Box
            key={`${e.html}-${i}`}
            component="li"
            sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: { xs: '36px minmax(0, 1fr)', sm: '36px minmax(0, 1fr) auto' },
              gap: 1.75,
              pb: i === visible.length - 1 ? 0 : 2.5,
              '&::before': i === visible.length - 1 ? {} : {
                content: '""',
                position: 'absolute',
                left: 17,
                top: 38,
                bottom: 2,
                width: 2,
                bgcolor: 'divider',
              },
            }}
          >
            <Box
              aria-hidden
              sx={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 3, zIndex: 1, bgcolor: tone[e.tone].bg, color: tone[e.tone].color }}
            >
              {icons[e.icon]}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.93rem', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: e.html }} />
              <Typography variant="caption" color="text.secondary" component="time" sx={{ display: 'block', mt: 0.25 }}>
                {e.time}
              </Typography>
            </Box>
            {e.action ? (
              <Box
                component="button"
                type="button"
                sx={{
                  gridColumn: { xs: 2, sm: 'auto' },
                  justifySelf: { xs: 'start', sm: 'auto' },
                  alignSelf: 'start',
                  mt: { xs: 1, sm: 0 },
                  px: 1.5,
                  py: 0.625,
                  borderRadius: 9999,
                  border: 1,
                  borderColor: 'divider',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {e.action}
              </Box>
            ) : (
              <Box aria-hidden />
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
