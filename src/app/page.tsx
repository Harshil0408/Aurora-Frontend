import { redirect } from 'next/navigation';

/** Root resolves to the console home — AuthGuard reroutes to /login when needed. */
export default function Home() {
  redirect('/dashboard');
}
