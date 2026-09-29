'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import { FormField, Modal } from '@/components/ui/controls';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { BreakdownDonut } from '@/components/dashboard/BreakdownDonut';
import { KpiLedger } from '@/components/dashboard/KpiLedger';
import { LivePill } from '@/components/dashboard/LivePill';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { SystemHealth } from '@/components/dashboard/SystemHealth';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { TopSellers } from '@/components/dashboard/TopSellers';
import { int, money, topSellers } from '@/lib/sampleData';
import { mercatoTokens } from '@/lib/theme';

function Row({ columns, children }: { columns: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        mb: 2.5,
        alignItems: 'stretch',
        gridTemplateColumns: columns,
        '@media (max-width: 1280px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
      }}
    >
      {children}
    </Box>
  );
}

export function DashboardView() {
  const [orders, setOrders] = useState(84320);
  const [today, setToday] = useState(2864);
  const [revenue, setRevenue] = useState(412860);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  // Simulated live KPIs — replace with websocket/polling later.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      const n = 1 + Math.floor(Math.random() * 4);
      setOrders((v) => v + n);
      setToday((v) => v + n);
      setRevenue((v) => v + Math.round(n * (2.6 + Math.random() * 1.2)));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const exportSellers = () => {
    const rows = [['Seller', 'Category', 'Plan', 'Orders', 'Sales USD', 'Growth %']];
    topSellers.forEach((s) => rows.push([s.name, s.category, s.plan, String(s.orders), String(s.sales), String(s.growthPct)]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top-sellers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, my: 1.25, mb: 3 }}>
        <Box>
          <Typography variant="h1" component="h1">
            Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: '46ch' }}>
            How the marketplace is performing across sellers, shoppers and revenue.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
          <LivePill>Live</LivePill>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportSellers}>
            Export report
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setInviteOpen(true); setInviteNote(null); }}>
            Invite seller
          </Button>
        </Box>
      </Box>

      <KpiLedger
        items={[
          { key: 'sellers', icon: 'store', label: 'Total sellers', value: '1,248', deltaPct: 4.2, context: '52 joined this month', tint: mercatoTokens.brandSoft, ink: mercatoTokens.brand },
          { key: 'users', icon: 'users', label: 'Registered users', value: '214,860', deltaPct: 12.8, context: '9,840 new this month', tint: mercatoTokens.infoSoft, ink: mercatoTokens.info },
          { key: 'orders', icon: 'orders', label: 'Orders · 30 days', value: int(orders), deltaPct: 8.1, context: <span>{int(today)} today</span>, tint: mercatoTokens.accentSoft, ink: mercatoTokens.accentStrong },
          { key: 'revenue', icon: 'revenue', label: 'Revenue · 30 days', value: money(revenue), deltaPct: 15.4, context: 'from $5.6M in sales', tint: mercatoTokens.goodSoft, ink: mercatoTokens.good },
        ]}
      />

      <Row columns="minmax(0, 1.9fr) minmax(0, 1fr)">
        <SalesChart />
        <BreakdownDonut />
      </Row>

      <Row columns="minmax(0, 1.55fr) minmax(0, 1fr)">
        <TopSellers />
        <TopProducts />
      </Row>

      <Row columns="minmax(0, 1fr) minmax(0, 1.2fr)">
        <ActivityFeed />
        <SystemHealth />
      </Row>

      <Box
        component="footer"
        sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, color: 'text.disabled', fontSize: '0.82rem' }}
      >
        <span>Aurora Admin · Sample data for design preview</span>
        <span>Times shown in your local time zone</span>
      </Box>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite seller"
        subtitle="Seller onboarding ships with the Sellers module — this preview does not send invites yet."
        icon={<AddIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setInviteOpen(false)}>Close</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={!inviteEmail.trim()}
              onClick={() => setInviteNote('Noted — invites activate with the Sellers module. Nothing was sent.')}
            >
              Save invite
            </Button>
          </>
        }
      >
        <FormField
          label="Seller email"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          autoFocus
          hint={inviteNote ?? undefined}
        />
      </Modal>
    </Box>
  );
}
