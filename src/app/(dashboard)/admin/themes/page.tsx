import type { Metadata } from 'next';
import { ThemesView } from './_components/ThemesView';

export const metadata: Metadata = {
  title: 'Appearance — Aurora Admin',
  description: 'Pick a palette for the console and fine-tune it to taste.',
};

export default function ThemesPage() {
  return <ThemesView />;
}
