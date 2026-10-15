import { Pressable, StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

import type { QuestionOption } from '../types';

export type QuietChoiceListProps = {
  options: QuestionOption[];
  selectedId: string | undefined;
  disabled?: boolean;
  onSelect: (optionId: string) => void;
};

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** MCQ choices with no right/wrong styling — used by the diagnostic quiet runner. */
export function QuietChoiceList({ options, selectedId, disabled = false, onSelect }: QuietChoiceListProps) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((option, index) => {
        const selected = option.id === selectedId;
        const label = LABELS[index] ?? String(index + 1);
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`Choice ${label}: ${option.text}`}
            disabled={disabled}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.choice,
              selected ? styles.choiceSelected : undefined,
              pressed && !disabled ? styles.pressed : undefined,
              disabled && !selected ? styles.disabled : undefined,
            ]}
          >
            <View style={[styles.mark, selected ? styles.markSelected : undefined]}>
              <Text variant="label" tone={selected ? 'inverse' : 'brand'} weight="bold">
                {label}
              </Text>
            </View>
            <Text variant="body" weight="semibold" style={styles.choiceText}>
              {option.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: tokens.space[3],
  },
  choice: {
    minHeight: tokens.size.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.md,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
    backgroundColor: tokens.color.surface.raised,
  },
  choiceSelected: {
    borderColor: tokens.color.brand.teal,
    borderWidth: tokens.stroke.thick,
    backgroundColor: tokens.color.brand.tealMuted,
  },
  mark: {
    width: tokens.size.controlSm,
    height: tokens.size.controlSm,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.brand.tealMuted,
  },
  markSelected: {
    backgroundColor: tokens.color.brand.teal,
  },
  choiceText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
