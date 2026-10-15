import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/shared/theme';

type ComingSoonProps = {
  title: string;
};

/** Thin route placeholder so §4 files exist without feature logic. */
export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <View style={styles.root} accessibilityRole="text">
      <Text style={styles.kicker}>TemariHub</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>This screen lands in a feature PR.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space[6],
    backgroundColor: tokens.color.surface.canvas,
  },
  kicker: {
    ...tokens.typography.label,
    color: tokens.color.brand.teal,
    marginBottom: tokens.space[2],
  },
  title: {
    ...tokens.typography.title,
    color: tokens.color.text.primary,
    marginBottom: tokens.space[2],
  },
  body: {
    ...tokens.typography.body,
    color: tokens.color.text.secondary,
  },
});
