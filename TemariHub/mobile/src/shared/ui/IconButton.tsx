import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';

export type IconButtonVariant = 'ghost' | 'subtle' | 'outline';

export type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: IconButtonVariant;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  children,
  onPress,
  disabled = false,
  variant = 'ghost',
  accessibilityLabel,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={tokens.size.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: tokens.size.controlSm,
    height: tokens.size.controlSm,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
  disabled: {
    opacity: tokens.opacity.disabled,
  },
});

const variantStyles = StyleSheet.create({
  ghost: {},
  subtle: {
    backgroundColor: tokens.color.surface.subtle,
  },
  outline: {
    backgroundColor: tokens.color.surface.raised,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
  },
});
