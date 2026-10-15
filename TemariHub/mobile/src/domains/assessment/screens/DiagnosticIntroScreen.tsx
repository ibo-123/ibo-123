import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import { Badge, Button, Screen, Text } from '@/shared/ui';

import { Notice } from '../components/Notice';
import { describeStartError, useStartDiagnostic } from '../hooks/useStartDiagnostic';

/**
 * Diagnostic intro — calm 100-question map of strengths, not an exam (MOB-40).
 */
export function DiagnosticIntroScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { submit, isPending } = useStartDiagnostic();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const onStart = async () => {
    setErrorMessage(undefined);
    try {
      const start = await submit();
      if (!start) {
        return;
      }
      router.replace(`/(app)/diagnostic/${start.test_id}`);
    } catch (error) {
      setErrorMessage(describeStartError(error));
    }
  };

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(tokens.motion.enter)}
        style={styles.hero}
      >
        <Badge label="100 questions" />
        <Text variant="caption" tone="brand" uppercase>
          Diagnostic
        </Text>
        <Text variant="display" accessibilityRole="header">
          Map your strengths
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          One hundred questions across your subjects. There is no live grading — answer calmly so we
          know where to start.
        </Text>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(tokens.motion.enter).delay(80)}
        style={styles.points}
      >
        <Point title="By subject" body="Each section focuses on one subject at a time." />
        <Point title="No right or wrong on screen" body="You will not see scores while you answer." />
        <Point title="Take your time" body="We only record how long each question takes." />
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.duration(tokens.motion.enter).delay(120)}
        style={styles.footer}
      >
        {errorMessage ? <Notice tone="error" message={errorMessage} /> : null}
        <Button
          label="Start diagnostic"
          accessibilityLabel={isPending ? 'Starting diagnostic' : 'Start diagnostic'}
          loading={isPending}
          onPress={() => void onStart()}
        />
      </Animated.View>
    </Screen>
  );
}

function Point({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.point}>
      <Text variant="title" weight="bold">
        {title}
      </Text>
      <Text variant="body" tone="secondary">
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.canvas,
  },
  content: {
    flex: 1,
    gap: tokens.space[8],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[6],
  },
  hero: {
    gap: tokens.space[3],
  },
  lead: {
    maxWidth: 360,
  },
  points: {
    gap: tokens.space[5],
    flex: 1,
  },
  point: {
    gap: tokens.space[1.5],
  },
  footer: {
    gap: tokens.space[3],
  },
});
