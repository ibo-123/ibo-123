import { StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Card, Text } from '@/shared/ui';

import { FeatureBoltIcon } from './AuthIcons';

export type FeaturePromoCardProps = {
  title?: string;
  description?: string;
  /** Denser strip for tight auth budgets (Sign Up). */
  compact?: boolean;
};

export function FeaturePromoCard({
  title = 'Timed Mocks Anywhere',
  description = 'Take exams offline, sync when ready. Prep on the go.',
  compact = false,
}: FeaturePromoCardProps) {
  return (
    <Card padded={!compact} style={compact ? styles.compactCard : undefined}>
      <View style={[styles.row, compact ? styles.rowCompact : undefined]}>
        {compact ? <View style={styles.accent} /> : null}
        <View style={[styles.iconWell, compact ? styles.iconWellCompact : undefined]}>
          <FeatureBoltIcon />
        </View>
        <View style={styles.copy}>
          <Text variant={compact ? 'label' : 'body'} weight="bold" numberOfLines={1}>
            {title}
          </Text>
          <Text
            variant="caption"
            tone="secondary"
            weight="medium"
            numberOfLines={compact ? 1 : 2}
          >
            {description}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
  },
  rowCompact: {
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingRight: tokens.space[3],
    paddingLeft: tokens.space[2],
    overflow: 'hidden',
  },
  compactCard: {
    borderRadius: tokens.radius.md,
    borderColor: tokens.color.brand.tealBorder,
    backgroundColor: tokens.color.brand.tealMuted,
  },
  accent: {
    width: tokens.stroke.thick,
    alignSelf: 'stretch',
    borderRadius: tokens.stroke.thick,
    backgroundColor: tokens.color.brand.teal,
    marginVertical: tokens.space[1],
  },
  iconWell: {
    width: tokens.space[10],
    height: tokens.size.control,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellCompact: {
    width: tokens.size.controlSm,
    height: tokens.size.controlSm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface.raised,
  },
  copy: {
    flex: 1,
    gap: tokens.space[0.5],
    minWidth: 0,
  },
});
