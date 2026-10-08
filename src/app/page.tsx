import { redirect } from 'next/navigation';
import { ADMIN_HOME_PATH } from '@/lib/panels';

/** Root resolves to the admin console home — middleware reroutes there first. */
export default function Home() {
  redirect(ADMIN_HOME_PATH);
}
