import { Stack } from 'expo-router';

import { AuthGate } from '@/domains/identity';

export default function AuthLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
