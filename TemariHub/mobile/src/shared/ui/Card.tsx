import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[styles.base, tokens.shadow.card, padded ? styles.padded : undefined, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.color.surface.raised,
    borderRadius: tokens.radius.lg,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.subtle,
    width: '100%',
  },
  padded: {
    padding: tokens.space[4],
  },
});
