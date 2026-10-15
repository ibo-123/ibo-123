import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { SessionBridgeRegistrar } from '@/domains/identity';
import { ApiProvider } from '@/shared/api';
import { tokens } from '@/shared/theme';
import { OfflineBanner } from '@/shared/ui';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden in fast refresh / web.
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Splash stays up until fonts load *and* SessionBridgeRegistrar finishes hydrate
  // (+ optional /auth/me restore). Hiding early would flash a signed-out shell.

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ApiProvider>
      <SessionBridgeRegistrar>
        <StatusBar style="dark" />
        <View style={styles.root}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: tokens.color.surface.canvas },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="kitchen-sink" options={{ headerShown: true, title: 'UI Kit' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(app)" />
          </Stack>
          <OfflineBanner />
        </View>
      </SessionBridgeRegistrar>
    </ApiProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.surface.canvas,
  },
});
