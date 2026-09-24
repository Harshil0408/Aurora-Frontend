'use client';

import { useState } from 'react';
import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import GridViewIcon from '@mui/icons-material/GridView';
import BarChartIcon from '@mui/icons-material/BarChart';
import StoreIcon from '@mui/icons-material/Store';
import GroupIcon from '@mui/icons-material/Group';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { mercatoTokens } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';
import { logoutAllThunk, logoutThunk } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export const SIDEBAR_WIDTH = 282;

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  quietBadge?: boolean;
}

/**
 * Reference IA (ui/files/index.html). Only /dashboard is implemented —
 * future items render disabled with a "coming soon" hint instead of
 * dead links. Badges mirror the reference (Sellers 12, Products 3 reported).
 */
const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <GridViewIcon fontSize="small" /> },
      { label: 'Analytics', icon: <BarChartIcon fontSize="small" /> },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { label: 'Sellers', icon: <StoreIcon fontSize="small" />, badge: '12' },
      { label: 'Users', icon: <GroupIcon fontSize="small" /> },
      { label: 'Products', icon: <Inventory2Icon fontSize="small" />, badge: '3 reported', quietBadge: true },
      { label: 'Orders', icon: <ShoppingBagIcon fontSize="small" /> },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payouts', icon: <AccountBalanceWalletIcon fontSize="small" /> },
      { label: 'Commissions', icon: <PercentIcon fontSize="small" /> },
      { label: 'Subscriptions', icon: <AutorenewIcon fontSize="small" /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Health', icon: <MonitorHeartIcon fontSize="small" /> },
      { label: 'Settings', icon: <SettingsIcon fontSize="small" /> },
    ],
  },
];

function BrandMark() {
  return (
    <Box
      component={Link}
      href="/dashboard"
      aria-label="Aurora admin home"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.25, textDecoration: 'none' }}
    >
      <Logo size={38} />
      <Box>
        <Typography
          variant="h2"
          component="span"
          sx={{ display: 'block', fontSize: '1.22rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          Aurora
        </Typography>
        <Typography variant="caption" component="span" sx={{ display: 'block', color: 'text.disabled', fontWeight: 600 }}>
          Admin console
        </Typography>
      </Box>
    </Box>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const doLogout = async (global: boolean) => {
    setAnchor(null);
    onNavigate?.();
    await dispatch(global ? logoutAllThunk() : logoutThunk());
    router.replace('/login');
  };

  const displayName = pendingEmail ? pendingEmail.split('@')[0] ?? 'Admin' : 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', py: 2.5, px: 1.75 }}
    >
      <BrandMark />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, overflowY: 'auto' }}>
        {sections.map((section) => (
          <Box key={section.title}>
            <Typography
              variant="caption"
              component="p"
              sx={{ px: 1.5, pb: 1, fontWeight: 700, color: 'text.disabled' }}
            >
              {section.title}
            </Typography>
            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {section.items.map((item) => {
                const active = item.href != null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
                const disabled = item.href == null;
                return (
                  <ListItemButton
                    key={item.label}
                    component={item.href ? Link : 'button'}
                    href={item.href}
                    onClick={onNavigate}
                    disabled={disabled}
                    aria-current={active ? 'page' : undefined}
                    title={disabled ? `${item.label} — coming soon` : undefined}
                    sx={{
                      borderRadius: '14px',
                      py: 1.25,
                      color: active ? '#fff' : 'text.secondary',
                      bgcolor: active ? 'primary.main' : 'transparent',
                      boxShadow: active ? '0 12px 22px -12px rgba(91, 61, 245, 0.8)' : 'none',
                      '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
                      '&.Mui-disabled': { opacity: 0.75 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: '0.92rem', fontWeight: 600 } } }}
                    />
                    {item.badge ? (
                      <Box
                        component="span"
                        sx={{
                          ml: 'auto',
                          px: 1.1,
                          py: 0.25,
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          bgcolor: active || !item.quietBadge ? mercatoTokens.accentSoft : mercatoTokens.surface2,
                          color: active ? mercatoTokens.accentStrong : item.quietBadge ? 'text.secondary' : mercatoTokens.accentStrong,
                          border: item.quietBadge && !active ? `1px solid ${mercatoTokens.line}` : 'none',
                        }}
                      >
                        {item.badge}
                      </Box>
                    ) : null}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
      <Box
        component="button"
        type="button"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-label="Account menu"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: '18px',
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
          color: 'text.primary',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <Avatar sx={{ width: 38, height: 38, borderRadius: '13px', bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pendingEmail ?? 'Administrator'}
          </Typography>
        </Box>
        <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      </Box>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} aria-label="Account menu">
        <MenuItem onClick={() => doLogout(false)}>
          <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Sign out this session
        </MenuItem>
        <MenuItem onClick={() => doLogout(true)}>
          <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Sign out everywhere
        </MenuItem>
      </Menu>
    </Box>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  if (isDesktop) {
    return (
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: 'sticky',
          top: 14,
          height: 'calc(100dvh - 28px)',
          ml: '14px',
          my: '14px',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: '28px',
          boxShadow: mercatoTokens.shadow1,
          overflow: 'hidden',
          display: { xs: 'none', lg: 'block' },
        }}
      >
        <SidebarContent />
      </Box>
    );
  }
  return (
    <Drawer
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', lg: 'none' },
        '& .MuiDrawer-paper': {
          width: 292,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: '0 28px 28px 0',
        },
      }}
    >
      <SidebarContent onNavigate={onClose} />
    </Drawer>
  );
}

export function SidebarScrim({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Box
      onClick={onClose}
      aria-hidden
      sx={{
        display: { xs: 'block', lg: 'none' },
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.drawer - 1,
        bgcolor: 'rgba(29, 26, 59, 0.45)',
      }}
    />
  );
}

