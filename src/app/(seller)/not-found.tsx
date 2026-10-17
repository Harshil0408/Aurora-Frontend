import { NotFoundPanel } from '@/components/ui/NotFoundPanel';

/** 404 inside the seller group (mirrors the admin-group panel). */
export default function SellerNotFound() {
  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <NotFoundPanel />
    </main>
  );
}
