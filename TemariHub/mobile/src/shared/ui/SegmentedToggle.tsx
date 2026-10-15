import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';

import { Text } from './Text';

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

export type SegmentedToggleProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  style,
}: SegmentedToggleProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.track, disabled ? styles.disabled : undefined, style]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentSelected : undefined,
              selected ? tokens.shadow.soft : undefined,
              pressed && !disabled ? styles.pressed : undefined,
            ]}
          >
            <Text
              variant="body"
              weight={selected ? 'bold' : 'semibold'}
              tone={selected ? 'brand' : 'muted'}
              align="center"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface.muted,
    borderRadius: tokens.radius.md,
    padding: tokens.space[1],
    width: '100%',
  },
  segment: {
    flex: 1,
    minHeight: tokens.size.controlSm,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[2],
  },
  segmentSelected: {
    backgroundColor: tokens.color.surface.raised,
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
  disabled: {
    opacity: tokens.opacity.disabled,
  },
});
