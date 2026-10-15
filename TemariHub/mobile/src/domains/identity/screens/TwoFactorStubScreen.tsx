import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import { Button, Screen, Text } from '@/shared/ui';

import { AuthHeader } from '../components/AuthHeader';
import { useSessionStore } from '../session.store';

/**
 * Phase 2 owns the authenticator challenge. Login only redirects here;
 * the challenge token is never stored.
 */
export function TwoFactorStubScreen() {
  const router = useRouter();

  const backToLogin = () => {
    useSessionStore.getState().leaveTwoFactor();
    router.replace('/(auth)/login');
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.content}>
        <AuthHeader
          title="Two-step sign-in is coming soon."
          subtitle="This account asks for an authenticator code. You can sign in with a different account for now."
          showBadge={false}
        />
        <Text variant="body" tone="secondary" align="center">
          Nothing from this step is saved on the phone. Close the app and you’ll be back at log in.
        </Text>
        <Button label="Back to log in" onPress={backToLogin} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.raised,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: tokens.space[6],
    paddingHorizontal: tokens.space[6],
    paddingBottom: tokens.space[8],
  },
});
