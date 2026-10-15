import { Tabs } from 'expo-router';

import { env } from '@/config/env';
import { AppTabBar } from '@/shared/ui';

/**
 * Open decision #6: Today · Learn · Practice · Tutor · Me.
 * Tutor stays hidden until phase 2 (`EXPO_PUBLIC_FEATURE_TUTOR_TAB`).
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'Tutor',
          href: env.featureTutorTab ? undefined : null,
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
