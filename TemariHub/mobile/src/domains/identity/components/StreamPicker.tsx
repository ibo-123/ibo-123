import { Pressable, StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { STREAM_CHOICES, type OnboardingStream } from '../onboardingTrack';

type StreamPickerProps = {
  value: OnboardingStream;
  onChange: (stream: OnboardingStream) => void;
  disabled?: boolean;
};

/**
 * Natural Science / Social Science radio group from the sign-up frame.
 * Grade 12 is the live grade; both streams are choosable.
 */
export function StreamPicker({ value, onChange, disabled = false }: StreamPickerProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Stream"
      style={[styles.root, disabled ? styles.disabled : undefined]}
    >
      <Text variant="caption" tone="secondary" uppercase style={styles.heading}>
        Stream
      </Text>
      <View style={styles.row}>
        {STREAM_CHOICES.map((choice) => {
          const selected = value === choice.stream;
          return (
            <Pressable
              key={choice.stream}
              accessibilityRole="radio"
              accessibilityLabel={choice.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(choice.stream)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : styles.optionIdle,
                pressed && !disabled ? styles.pressed : undefined,
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
                style={styles.label}
              >
                {choice.label}
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
  disabled: {
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
  option: {
    flex: 1,
    height: tokens.size.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: tokens.stroke.thick,
  },
  label: {
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
  pressed: {
    opacity: tokens.opacity.pressed,
  },
  radio: {
    width: tokens.size.icon,
    height: tokens.size.icon,
    borderRadius: tokens.size.icon,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.color.brand.teal,
  },
});
