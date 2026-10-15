import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus, usePrefersReducedMotion } from '@/shared/hooks';
import { tokens } from '@/shared/theme';

import { Text } from './Text';

export type OfflineBannerPlacement = 'inline' | 'overlay';

export type OfflineBannerProps = {
  /**
   * `overlay` floats on the app and hides while online.
   * `inline` always paints the bar, for the UI kit.
   */
  placement?: OfflineBannerPlacement;
};

const message = 'No signal. What you already opened stays on this phone.';

export function OfflineBanner({ placement = 'overlay' }: OfflineBannerProps) {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const reducedMotion = usePrefersReducedMotion();
  const floating = placement === 'overlay';

  if (floating && !isOffline) {
    return null;
  }

  const bar = (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`You are offline. ${message}`}
      style={[styles.bar, tokens.shadow.card]}
      testID="offline-banner"
    >
      <View style={styles.dot} />
      <View style={styles.copy}>
        <Text variant="label" tone="inverse">
          You are offline
        </Text>
        <Text variant="label" tone="inverse" weight="medium">
          {message}
        </Text>
      </View>
    </View>
  );

  if (!floating) {
    return bar;
  }

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(tokens.motion.enter)}
      exiting={reducedMotion ? undefined : FadeOutUp.duration(tokens.motion.enter)}
      style={[styles.overlay, { top: insets.top + tokens.space[2], pointerEvents: 'box-none' }]}
    >
      {bar}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: tokens.space[4],
    right: tokens.space[4],
    zIndex: tokens.zIndex.banner,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    backgroundColor: tokens.color.text.primary,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
  },
  dot: {
    width: tokens.space[2],
    height: tokens.space[2],
    borderRadius: tokens.space[1],
    backgroundColor: tokens.color.state.warning,
  },
  copy: {
    flex: 1,
    gap: tokens.space[0.5],
  },
});
