import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/shared/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View style={styles.root}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space[6],
    backgroundColor: tokens.color.surface.canvas,
  },
  title: {
    ...tokens.typography.title,
    color: tokens.color.text.primary,
  },
  link: {
    marginTop: tokens.space[4],
  },
  linkText: {
    ...tokens.typography.label,
    color: tokens.color.brand.teal,
  },
});
