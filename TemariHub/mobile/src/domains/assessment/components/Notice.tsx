import { StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

export type NoticeProps = {
  tone: 'error' | 'info';
  message: string;
};

export function Notice({ tone, message }: NoticeProps) {
  return (
    <View
      style={[styles.base, tone === 'error' ? styles.error : styles.info]}
      accessibilityRole="alert"
    >
      <Text variant="label" tone={tone === 'error' ? 'danger' : 'secondary'} weight="semibold">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
  },
  error: {
    backgroundColor: 'rgba(180, 35, 24, 0.08)',
  },
  info: {
    backgroundColor: tokens.color.surface.subtle,
  },
});
