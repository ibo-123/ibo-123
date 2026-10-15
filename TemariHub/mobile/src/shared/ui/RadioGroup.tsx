import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';

import { Text } from './Text';

export type RadioOption<T extends string> = {
  label: string;
  value: T;
  /** Locked / coming-soon choice — stays visible, not selectable. */
  disabled?: boolean;
};

export type RadioGroupProps<T extends string> = {
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Optional group caption (e.g. "Stream"). */
  label?: string;
  /** Spoken name for the radiogroup when `label` is omitted. */
  accessibilityLabel?: string;
  /** Side-by-side chips (default) or a vertical list. */
  layout?: 'row' | 'stack';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Figma Radio Group `98:116` — one selection at a time.
 * Option `value`s should match API contract enums when wired to forms
 * (e.g. stream: `natural_science` | `social_science` per docs/api-contract.md §10–11, §13.1).
 */
export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  accessibilityLabel,
  layout = 'row',
  disabled = false,
  style,
}: RadioGroupProps<T>) {
  const spoken = accessibilityLabel ?? label;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={spoken}
      style={[styles.root, disabled ? styles.groupDisabled : undefined, style]}
    >
      {label ? (
        <Text variant="caption" tone="secondary" uppercase style={styles.heading}>
          {label}
        </Text>
      ) : null}
      <View style={layout === 'row' ? styles.row : styles.stack}>
        {options.map((option) => {
          const selected = value === option.value;
          const optionDisabled = disabled || option.disabled === true;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled: optionDisabled }}
              disabled={optionDisabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                layout === 'row' ? styles.optionGrow : undefined,
                selected ? styles.optionSelected : styles.optionIdle,
                pressed && !optionDisabled ? styles.pressed : undefined,
                option.disabled ? styles.optionLocked : undefined,
              ]}
            >
              <View style={[styles.radio, selected ? styles.radioOn : undefined]}>
                {selected ? <View style={styles.dot} /> : null}
              </View>
              <Text
                variant="label"
                weight="bold"
                tone={selected ? 'brand' : 'secondary'}
                numberOfLines={1}
                style={styles.optionLabel}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: tokens.space[2],
  },
  groupDisabled: {
    opacity: tokens.opacity.disabled,
  },
  heading: {
    paddingHorizontal: tokens.space[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: tokens.space[3],
  },
  stack: {
    flexDirection: 'column',
    gap: tokens.space[3],
  },
  option: {
    height: tokens.size.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: tokens.stroke.thick,
  },
  optionGrow: {
    flex: 1,
  },
  optionLabel: {
    flex: 1,
  },
  optionSelected: {
    backgroundColor: tokens.color.brand.tealMuted,
    borderColor: tokens.color.brand.teal,
  },
  optionIdle: {
    backgroundColor: tokens.color.surface.raised,
    borderColor: tokens.color.border.default,
  },
  optionLocked: {
    opacity: tokens.opacity.disabled,
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
  radio: {
    width: tokens.size.radio,
    height: tokens.size.radio,
    borderRadius: tokens.size.radio,
    borderWidth: tokens.stroke.thick,
    borderColor: tokens.color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.surface.raised,
  },
  radioOn: {
    borderColor: tokens.color.brand.teal,
  },
  dot: {
    width: tokens.size.radioDot,
    height: tokens.size.radioDot,
    borderRadius: tokens.size.radioDot / 2,
    backgroundColor: tokens.color.brand.teal,
  },
});
