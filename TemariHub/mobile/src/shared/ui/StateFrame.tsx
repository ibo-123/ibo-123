import { StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';

import { Badge } from './Badge';
import { Button } from './Button';
import { Text } from './Text';

export type StateTone = 'empty' | 'error';

export type StateFrameProps = {
  tone: StateTone;
  eyebrow: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
  testID?: string;
};

/**
 * Shared layout for empty and error.
 * Left-aligned, one action, Log In type: pill, display, secondary, teal button.
 */
export function StateFrame({
  tone,
  eyebrow,
  title,
  message,
  actionLabel,
  onAction,
  loading = false,
  testID,
}: StateFrameProps) {
  return (
    <View style={styles.root} testID={testID}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.well, tone === 'empty' ? styles.wellEmpty : styles.wellError]}
      >
        {tone === 'empty' ? <EmptyMark /> : <ErrorMark />}
      </View>
      <View style={styles.copy}>
        <Badge label={eyebrow} tone={tone === 'empty' ? 'brand' : 'neutral'} />
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" tone="secondary">
          {message}
        </Text>
      </View>
      <Button label={actionLabel} onPress={onAction} loading={loading} style={styles.action} />
    </View>
  );
}

function EmptyMark() {
  return (
    <View style={styles.bars}>
      <View style={[styles.bar, styles.barStrong]} />
      <View style={[styles.bar, styles.barMid]} />
      <View style={[styles.bar, styles.barShort]} />
    </View>
  );
}

function ErrorMark() {
  return (
    <Text variant="title" tone="danger">
      !
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'flex-start',
    gap: tokens.space[4],
  },
  well: {
    width: tokens.size.control,
    height: tokens.size.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: tokens.stroke.thin,
  },
  wellEmpty: {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.brand.tealMuted,
    borderColor: tokens.color.brand.tealBorder,
  },
  wellError: {
    borderRadius: tokens.size.control / 2,
    backgroundColor: tokens.color.surface.muted,
    borderColor: tokens.color.border.default,
  },
  bars: {
    gap: tokens.space[1],
    alignItems: 'flex-start',
  },
  bar: {
    height: tokens.space[1],
    borderRadius: tokens.space[0.5],
  },
  barStrong: {
    width: tokens.space[5],
    backgroundColor: tokens.color.brand.teal,
  },
  barMid: {
    width: tokens.space[4],
    backgroundColor: tokens.color.border.default,
  },
  barShort: {
    width: tokens.space[3],
    backgroundColor: tokens.color.border.default,
  },
  copy: {
    alignSelf: 'stretch',
    gap: tokens.space[2],
  },
  action: {
    width: '100%',
  },
});
