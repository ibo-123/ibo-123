import { AuthRedirect } from '@/domains/identity';

/** Cold start and `/` — the gate picks Login, Verify, 2FA, Onboarding, or Today. */
export default function Index() {
  return <AuthRedirect />;
}
