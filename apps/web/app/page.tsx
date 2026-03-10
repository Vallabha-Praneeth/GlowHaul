import { redirect } from 'next/navigation';
import { getCurrentAuth, getDefaultHomePath } from '../lib/auth';

export default async function HomePage() {
  const { profile } = await getCurrentAuth();
  redirect(getDefaultHomePath(profile?.role));
}
