import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';

import { Text } from './Text';

export type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Checkbox({ checked, onChange, label, disabled = false, style }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={tokens.size.hitSlop}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}
    >
      <View style={[styles.box, checked ? styles.boxChecked : undefined]}>
        {checked ? <View style={styles.mark} /> : null}
      </View>
      {typeof label === 'string' ? (
        <Text variant="body" tone="secondary" weight="semibold">
          {label}
        </Text>
      ) : (
        label
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[1],
  },
  box: {
    width: tokens.size.checkbox,
    height: tokens.size.checkbox,
    borderRadius: tokens.radius.sm,
    borderWidth: tokens.stroke.thick,
    borderColor: tokens.color.border.default,
    backgroundColor: tokens.color.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: tokens.color.brand.teal,
    backgroundColor: tokens.color.surface.raised,
  },
  mark: {
    width: tokens.space[2] + tokens.space[0.5],
    height: tokens.space[2] + tokens.space[0.5],
    borderRadius: tokens.space[0.5],
    backgroundColor: tokens.color.brand.teal,
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
  disabled: {
    opacity: tokens.opacity.disabled,
  },
});
