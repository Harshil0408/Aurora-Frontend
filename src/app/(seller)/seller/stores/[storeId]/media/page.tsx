import type { Metadata } from 'next';
import { MediaLibraryView } from './_components/MediaLibraryView';

export const metadata: Metadata = {
  title: 'Media library — Aurora Seller',
  description: 'Upload, organise, and manage product images, video, and documents.',
};

/** Server component — interactivity lives in _components/MediaLibraryView. */
export default function MediaPage() {
  return <MediaLibraryView />;
}
