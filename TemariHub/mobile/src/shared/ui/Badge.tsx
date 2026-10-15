import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';

import { Text } from './Text';

export type BadgeTone = 'brand' | 'neutral';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'brand', leading, style }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone], style]}>
      {leading}
      <Text
        variant="caption"
        tone={tone === 'brand' ? 'brand' : 'secondary'}
        weight="bold"
        uppercase
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: tokens.space[1.5],
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[1],
    // control size reads as a pill on caption-height badges (Figma Log In)
    borderRadius: tokens.size.control,
    borderWidth: tokens.stroke.thin,
  },
});

const toneStyles = StyleSheet.create({
  brand: {
    backgroundColor: tokens.color.brand.tealMuted,
    borderColor: tokens.color.brand.tealBorder,
  },
  neutral: {
    backgroundColor: tokens.color.surface.muted,
    borderColor: tokens.color.border.default,
  },
});
