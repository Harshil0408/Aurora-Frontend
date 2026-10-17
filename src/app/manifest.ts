import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

/**
 * Web app manifest. Static white matches the light-only theme's first paint
 * (viewport/themeColor hints are platform constants, not palette usage).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.appName,
    short_name: config.appName,
    description: 'Secure e-commerce administration console',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
