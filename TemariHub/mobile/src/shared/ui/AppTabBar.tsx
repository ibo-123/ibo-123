import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Tabs } from 'expo-router';

import { env } from '@/config/env';
import { fonts, tokens } from '@/shared/theme';

import { Text } from './Text';

type AppTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabIconProps = {
  color: string;
};

/** Today — sun. Active plate matches Figma Today nav `22:2337` (40×40 well, 24 icon). */
function TodayIcon({ color }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Z"
        stroke={color}
        strokeWidth={1.75}
      />
      <Path
        d="M12 2.75v1.5M12 19.75v1.5M4.4 4.4l1.06 1.06M18.54 18.54l1.06 1.06M2.75 12h1.5M19.75 12h1.5M4.4 19.6l1.06-1.06M18.54 5.46l1.06-1.06"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LearnIcon({ color }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5.25h6.25A2.75 2.75 0 0 1 14 8v11.25a2.25 2.25 0 0 0-2.25-2.25H5V5.25Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <Path
        d="M19 5.25h-6.25A2.75 2.75 0 0 0 10 8v11.25A2.25 2.25 0 0 1 12.25 17H19V5.25Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PracticeIcon({ color }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.25 4.75h7.5A2.5 2.5 0 0 1 18.25 7.25v12.5l-6.25-2.5-6.25 2.5V7.25a2.5 2.5 0 0 1 2.5-2.5Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <Path
        d="M9.25 10.25h5.5M9.25 13.25h3.5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TutorIcon({ color }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.25 16.75V7.5A2.75 2.75 0 0 1 9 4.75h6A2.75 2.75 0 0 1 17.75 7.5v6.25A2.75 2.75 0 0 1 15 16.5H9.5L6.25 19v-2.25Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MeIcon({ color }: TabIconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        stroke={color}
        strokeWidth={1.75}
      />
      <Path
        d="M6.25 19.25c.7-2.4 2.85-3.75 5.75-3.75s5.05 1.35 5.75 3.75"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const ICONS = {
  today: TodayIcon,
  learn: LearnIcon,
  practice: PracticeIcon,
  tutor: TutorIcon,
  me: MeIcon,
} as const;

/**
 * Bottom tabs from open decision #6, drawn like the Today dashboard nav:
 * teal 40dp well on the active item, label underneath, Tutor omitted until phase 2.
 * Mistakes and Insights stay stack screens opened from Today / Me.
 */
export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => env.featureTutorTab || route.name !== 'tutor');

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, tokens.space[3]) }]}>
      {routes.map((route) => {
        const focused = state.routes[state.index]?.key === route.key;
        const descriptor = descriptors[route.key];
        const label = descriptor?.options.title ?? route.name;
        const Icon = ICONS[route.name as keyof typeof ICONS];
        const color = focused ? tokens.color.text.inverse : tokens.color.text.secondary;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.item}
          >
            <View style={[styles.well, focused ? styles.wellActive : null]}>
              {Icon ? <Icon color={color} /> : null}
            </View>
            <Text variant="label" tone={focused ? 'brand' : 'secondary'} style={styles.label}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 17,
    paddingHorizontal: tokens.space[6],
    backgroundColor: tokens.color.surface.raised,
    borderTopWidth: tokens.stroke.thin,
    borderTopColor: tokens.color.border.default,
  },
  item: {
    alignItems: 'center',
    minWidth: 64,
    gap: tokens.space[1],
  },
  well: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellActive: {
    backgroundColor: tokens.color.brand.teal,
    ...tokens.shadow.brand,
  },
  label: {
    fontFamily: fonts.sans.bold,
    fontSize: 12,
    lineHeight: 17,
  },
});
