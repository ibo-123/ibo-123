import { Stack } from 'expo-router';

import { AuthGate } from '@/domains/identity';

export default function OnboardingLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
