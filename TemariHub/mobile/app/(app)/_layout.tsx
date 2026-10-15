import { Stack } from 'expo-router';

import { AuthGate } from '@/domains/identity';

/**
 * Signed-in stack. Tabs live in `(tabs)`.
 * Mistakes and Insights are pushed from Today / Me — they are not tabs.
 */
export default function AppLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
