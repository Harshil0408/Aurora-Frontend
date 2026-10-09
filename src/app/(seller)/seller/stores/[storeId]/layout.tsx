import { StoreGuard } from '@/components/seller/SellerGuards';

/**
 * Store membership gate — every store-scoped request carries `:storeId` and
 * the backend re-validates membership + permission (403 on mismatch).
 */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreGuard>{children}</StoreGuard>;
}
