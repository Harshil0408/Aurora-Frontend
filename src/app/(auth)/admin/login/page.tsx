import type { Metadata } from 'next';
import { LoginView } from './_components/LoginView';

export const metadata: Metadata = {
  title: 'Sign in — Aurora Admin',
  description: 'Sign in to the Aurora admin console.',
};

/** Server component — interactivity lives in _components/LoginView. */
export default function LoginPage() {
  return <LoginView />;
}
