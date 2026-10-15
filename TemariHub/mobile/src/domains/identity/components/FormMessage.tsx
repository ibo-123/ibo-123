import { StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

export type FormMessageTone = 'error' | 'info';

type FormMessageProps = {
  tone: FormMessageTone;
  message: string;
};

/** Form-level result line above the submit button. Kept to one compact row for the one-view budget. */
export function FormMessage({ tone, message }: FormMessageProps) {
  const isError = tone === 'error';

  return (
    <View
      accessibilityRole={isError ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      style={[styles.container, isError ? styles.error : styles.info]}
    >
      <Text variant="label" tone={isError ? 'danger' : 'strong'} weight="semibold">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: tokens.radius.sm,
    borderLeftWidth: tokens.stroke.thick,
    backgroundColor: tokens.color.surface.subtle,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  error: {
    borderLeftColor: tokens.color.state.danger,
  },
  info: {
    borderLeftColor: tokens.color.brand.teal,
  },
});
