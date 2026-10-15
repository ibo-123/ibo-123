import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { AppleMark, GoogleMark } from './AuthIcons';

export type SocialRowProps = {
  onGooglePress?: () => void;
  onApplePress?: () => void;
};

/**
 * Google + Apple logo row from Figma Log In, then the "or" rule
 * that sits above the Email | Phone Number toggle.
 */
export function SocialRow({ onGooglePress, onApplePress }: SocialRowProps) {
  return (
    <View style={styles.root}>
      <View style={styles.buttons}>
        <SocialButton
          label="Google"
          accessibilityLabel="Continue with Google"
          leading={<GoogleMark />}
          onPress={onGooglePress}
        />
        <SocialButton
          label="Apple"
          accessibilityLabel="Continue with Apple"
          leading={<AppleMark />}
          onPress={onApplePress}
        />
      </View>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text variant="caption" tone="secondary" uppercase>
          or
        </Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

function SocialButton({
  label,
  leading,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  leading: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tokens.shadow.soft,
        pressed ? styles.pressed : undefined,
      ]}
    >
      {leading}
      <Text variant="body" tone="strong" weight="bold">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: tokens.space[3],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  line: {
    flex: 1,
    height: tokens.stroke.thin,
    backgroundColor: tokens.color.border.default,
  },
  buttons: {
    flexDirection: 'row',
    gap: tokens.space[3],
  },
  button: {
    flex: 1,
    minHeight: tokens.size.social,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    borderRadius: tokens.radius.md,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
    backgroundColor: tokens.color.surface.raised,
    paddingHorizontal: tokens.space[3],
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
});
