import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/shared/theme';
import { Badge, Text } from '@/shared/ui';

import { BoltIcon, TemariLogo } from './AuthIcons';

export type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  showBadge?: boolean;
  /** Defaults to login badge copy; Sign Up Figma `73:288` uses `2017 E.C. MATRIC`. */
  badgeLabel?: string;
  /** Wordmark height. Figma mark is 40; login can pass a roomier size. */
  logoHeight?: number;
  style?: StyleProp<ViewStyle>;
};

export function AuthHeader({
  title,
  subtitle,
  showBadge = true,
  badgeLabel = 'Grade 12 Prep',
  logoHeight = 40,
  style,
}: AuthHeaderProps) {
  return (
    <View style={[styles.root, style]}>
      <TemariLogo height={logoHeight} />
      <View style={styles.copy}>
        {showBadge ? (
          <View style={styles.badgeWrap}>
            <Badge label={badgeLabel} leading={<BoltIcon />} style={styles.badge} />
          </View>
        ) : null}
        <Text variant="display" align="center" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="body"
            tone="secondary"
            weight="medium"
            align="center"
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingTop: tokens.space[2],
  },
  copy: {
    alignItems: 'center',
    gap: tokens.space[1],
  },
  badgeWrap: {
    paddingBottom: tokens.space[0.5],
  },
  badge: {
    alignSelf: 'center',
  },
  subtitle: {
    paddingTop: tokens.space[1],
  },
});
