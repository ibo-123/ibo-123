import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

type ExamOptionProps = {
  label: string;
  selected: boolean;
  available: boolean;
  accessibilityLabel?: string;
  /** Share a row equally. Stacked options stretch on their own. */
  fill?: boolean;
  onPress?: () => void;
};

/**
 * One grade or stream. Locked choices stay on screen with a Soon mark
 * and do not accept a press.
 */
export function ExamOption({
  label,
  selected,
  available,
  accessibilityLabel,
  fill = false,
  onPress,
}: ExamOptionProps) {
  const spoken = accessibilityLabel ?? (available ? label : `${label}, coming soon`);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={spoken}
      accessibilityState={{ selected: available && selected, disabled: !available }}
      disabled={!available}
      onPress={available ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        fill ? styles.fill : undefined,
        available && selected ? styles.cardSelected : styles.cardIdle,
        available && selected ? tokens.shadow.soft : undefined,
        pressed && available ? styles.cardPressed : undefined,
      ]}
    >
      <View style={[styles.mark, available && selected ? styles.markSelected : styles.markIdle]}>
        {available && selected ? <CheckIcon /> : null}
      </View>
      <Text
        variant="label"
        weight={available && selected ? 'extrabold' : 'bold'}
        tone={available && selected ? 'brand' : 'secondary'}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
      {available ? null : (
        <Text variant="caption" tone="secondary" uppercase>
          Soon
        </Text>
      )}
    </Pressable>
  );
}

function CheckIcon() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
        <Path
          d="M4.3 7.3L7.825 3.775L7.125 3.075L4.3 5.9L2.875 4.475L2.175 5.175L4.3 7.3Z"
          fill={tokens.color.brand.teal}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    minHeight: tokens.size.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderRadius: tokens.radius.lg,
  },
  fill: {
    flex: 1,
  },
  cardSelected: {
    backgroundColor: tokens.color.surface.raised,
    borderWidth: tokens.stroke.thick,
    borderColor: tokens.color.brand.teal,
  },
  cardIdle: {
    backgroundColor: tokens.color.surface.canvas,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.subtle,
  },
  cardPressed: {
    opacity: tokens.opacity.pressed,
  },
  mark: {
    width: tokens.size.icon,
    height: tokens.size.icon,
    borderRadius: tokens.size.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSelected: {
    backgroundColor: tokens.color.brand.tealBorder,
  },
  markIdle: {
    backgroundColor: tokens.color.surface.muted,
  },
  label: {
    flex: 1,
  },
});
