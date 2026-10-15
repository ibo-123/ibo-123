import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { tokens } from '@/shared/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  trailing,
  leading,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        variant === 'primary' ? tokens.shadow.brand : undefined,
        variant === 'secondary' ? tokens.shadow.soft : undefined,
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? tokens.color.text.inverse : tokens.color.brand.teal}
        />
      ) : (
        <View style={styles.row}>
          {leading}
          <Text
            variant="title"
            tone={variant === 'primary' ? 'inverse' : variant === 'ghost' ? 'brand' : 'strong'}
            weight="bold"
          >
            {label}
          </Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tokens.size.control,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
  disabled: {
    opacity: tokens.opacity.disabled,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: tokens.color.brand.teal,
  },
  secondary: {
    backgroundColor: tokens.color.surface.raised,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
  },
  ghost: {},
});
