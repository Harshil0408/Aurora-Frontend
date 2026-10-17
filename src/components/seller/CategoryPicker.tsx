'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, List, ListItemButton, ListItemText } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import LockIcon from '@mui/icons-material/Lock';
import { Modal, SearchField } from '@/components/ui/controls';
import { DataLoader } from '@/components/ui/DataLoader';
import type { SellerCategoryNode } from '@/types/categories';
import { useSellerCategoryTreeQuery } from '@/services/sellerCategoriesApi';
import { normaliseApiError } from '@/types/api';

function flatten(nodes: SellerCategoryNode[]): SellerCategoryNode[] {
  const out: SellerCategoryNode[] = [];
  const walk = (list: SellerCategoryNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children) walk(n.children as SellerCategoryNode[]);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Leaf-only category picker for seller forms (product form in Module 6 is
 * the first consumer). Restricted branches are visible but selectable only
 * with a granted application — the access chip explains why.
 */
export function CategoryPicker({
  open,
  onClose,
  onSelect,
  storeId,
  selectedId,
  title = 'Choose a category',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (node: SellerCategoryNode) => void;
  storeId: string;
  selectedId?: string | null;
  title?: string;
}) {
  const [search, setSearch] = useState('');
  // Deferred: typing keeps the input snappy while the list filter yields.
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, isError, error, refetch } = useSellerCategoryTreeQuery(storeId, {
    skip: !open || !storeId,
  });

  const flat = useMemo(() => flatten(data?.data ?? []), [data]);
  const leaves = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return flat.filter((n) => {
      if (!n.leaf) return false;
      if (!q) return true;
      return n.name.toLowerCase().includes(q) || n.breadcrumb.toLowerCase().includes(q);
    });
  }, [flat, deferredSearch]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Products attach to leaf categories only — parents are navigation."
      maxWidth="sm"
      icon={<CategoryIcon fontSize="small" />}
      actions={
        <>
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <SearchField value={search} onChange={setSearch} placeholder="Search categories…" aria-label="Search categories" />
      {isLoading ? <DataLoader label="Loading categories" variant="skeleton" /> : null}
      {isError ? (
        <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => refetch()}>Retry</Button>}>
          Couldn&apos;t load categories — {normaliseApiError(error as { status?: number; data?: unknown }).message}
        </Alert>
      ) : null}
      {!isLoading && !isError && leaves.length === 0 ? (
        <Alert severity="info">
          {flat.length === 0 ? 'No categories published yet — ask your marketplace admin.' : 'No leaf matches this search.'}
        </Alert>
      ) : null}
      <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
        {leaves.map((n) => {
          const locked = n.access === 'restricted' || n.access === 'pending';
          return (
            <ListItemButton
              key={n.id}
              selected={selectedId === n.id}
              disabled={locked}
              onClick={() => {
                onSelect(n);
                onClose();
              }}
            >
              <ListItemText
                primary={n.name}
                secondary={n.breadcrumb}
                slotProps={{ primary: { fontSize: '0.86rem', fontWeight: selectedId === n.id ? 600 : 400 } as object, secondary: { fontSize: '0.76rem' } as object }}
              />
              {n.access === 'granted' ? <Chip size="small" label="Granted" color="success" variant="outlined" /> : null}
              {n.access === 'pending' ? <Chip size="small" label="Pending" color="warning" variant="outlined" /> : null}
              {n.access === 'restricted' ? <LockIcon fontSize="small" color="disabled" /> : null}
            </ListItemButton>
          );
        })}
      </List>
    </Modal>
  );
}
