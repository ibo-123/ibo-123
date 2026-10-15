import { createContext, useContext, useEffect, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { usePrefersReducedMotion } from '@/shared/hooks';
import { tokens } from '@/shared/theme';

const PulseContext = createContext<SharedValue<number> | null>(null);

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

function runPulse(value: SharedValue<number>, reduced: boolean) {
  if (reduced) {
    value.value = 0;
    return;
  }
  value.value = withRepeat(
    withTiming(1, {
      duration: tokens.motion.pulse,
      easing: Easing.inOut(Easing.ease),
    }),
    -1,
    true,
  );
}

function usePulseStyle() {
  const shared = useContext(PulseContext);
  const reduced = usePrefersReducedMotion();
  const fallback = useSharedValue(0);

  useEffect(() => {
    if (shared) return;
    runPulse(fallback, reduced);
  }, [fallback, reduced, shared]);

  return useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      (shared ?? fallback).value,
      [0, 1],
      [tokens.color.surface.muted, tokens.color.border.default],
    ),
  }));
}

/** One quiet bone. Group several under `SkeletonPulse` so they breathe together. */
export function Skeleton({
  width = '100%',
  height = tokens.typography.body.lineHeight,
  radius = tokens.radius.sm,
  style,
}: SkeletonProps) {
  const pulse = usePulseStyle();

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bone, { width, height, borderRadius: radius }, pulse, style]}
    />
  );
}

export function SkeletonPulse({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    runPulse(progress, reduced);
  }, [progress, reduced]);

  return <PulseContext.Provider value={progress}>{children}</PulseContext.Provider>;
}

function SkeletonRow() {
  return (
    <View style={[styles.row, tokens.shadow.card]}>
      <Skeleton width={tokens.space[10]} height={tokens.size.control} radius={tokens.radius.md} />
      <View style={styles.lines}>
        <Skeleton width="72%" height={tokens.typography.title.lineHeight} />
        <Skeleton width="100%" height={tokens.typography.caption.lineHeight} />
        <Skeleton width="48%" height={tokens.typography.caption.lineHeight} />
      </View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <SkeletonPulse>
      <SkeletonRow />
    </SkeletonPulse>
  );
}

export type SkeletonListProps = {
  count?: number;
};

export function SkeletonList({ count = 3 }: SkeletonListProps) {
  return (
    <SkeletonPulse>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        accessibilityState={{ busy: true }}
        style={styles.list}
        testID="skeleton-list"
      >
        {Array.from({ length: count }, (_, index) => (
          <SkeletonRow key={`skeleton-row-${index}`} />
        ))}
      </View>
    </SkeletonPulse>
  );
}

/** Page stand-in: a headline, two lines, then list cards. */
export function SkeletonScreen() {
  return (
    <SkeletonPulse>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        accessibilityState={{ busy: true }}
        style={styles.screen}
        testID="skeleton"
      >
        <Skeleton width="62%" height={tokens.typography.display.lineHeight} />
        <Skeleton width="90%" height={tokens.typography.body.lineHeight} />
        <Skeleton width="70%" height={tokens.typography.body.lineHeight} />
        <View style={styles.list}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    </SkeletonPulse>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: tokens.color.surface.muted,
  },
  screen: {
    width: '100%',
    gap: tokens.space[3],
  },
  list: {
    width: '100%',
    gap: tokens.space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
    backgroundColor: tokens.color.surface.raised,
    borderRadius: tokens.radius.lg,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.subtle,
    padding: tokens.space[4],
  },
  lines: {
    flex: 1,
    gap: tokens.space[2],
  },
});
