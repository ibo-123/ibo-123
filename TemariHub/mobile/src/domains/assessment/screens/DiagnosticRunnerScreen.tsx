import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { usePrefetchQuestion, useQuestion } from '@/domains/content';
import { tokens } from '@/shared/theme';
import {
  EmptyState,
  ErrorState,
  QueryState,
  Screen,
  SkeletonScreen,
  Text,
  type QueryPhase,
} from '@/shared/ui';

import { QuietAnswerStep } from '../components/QuietAnswerStep';
import { SectionProgress } from '../components/SectionProgress';
import { useSubmitDiagnosticAnswer } from '../hooks/useSubmitDiagnosticAnswer';
import { flattenSections } from '../lib/flattenSections';
import { useRunnerStore } from '../runner.store';

function phaseFor(isPending: boolean, isError: boolean, ready: boolean): QueryPhase {
  if (isPending) {
    return 'loading';
  }
  if (isError) {
    return 'error';
  }
  if (!ready) {
    return 'empty';
  }
  return 'ready';
}

/**
 * Quiet diagnostic runner — section progress, timed answers, prefetch next (MOB-40).
 * No right/wrong feedback. Resume is MOB-41; results are MOB-42.
 */
export function DiagnosticRunnerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId: string }>();
  const testId = typeof params.testId === 'string' ? params.testId : undefined;
  const attempt = useRunnerStore((state) => (testId ? state.attempts[testId] : undefined));

  const queue = useMemo(() => (attempt ? flattenSections(attempt.sections) : []), [attempt]);
  const [cursor, setCursor] = useState(0);

  const current = queue[cursor];
  const next = queue[cursor + 1];
  const question = useQuestion(current?.questionId);
  usePrefetchQuestion(next?.questionId);

  const submitAnswer = useSubmitDiagnosticAnswer(testId);

  if (!testId || !attempt || queue.length === 0 || !current) {
    return (
      <Screen style={styles.screen}>
        <EmptyState
          eyebrow="Diagnostic"
          title="Start from the intro"
          message="This run isn’t on this device yet. Open the diagnostic intro to begin."
          action={{
            label: 'Go to intro',
            onPress: () => router.replace('/(app)/diagnostic'),
          }}
        />
      </Screen>
    );
  }

  const phase = phaseFor(question.isPending, question.isError, Boolean(question.data));
  const busy = submitAnswer.isPending;

  const onAnswer = async (optionId: string, timeSpentSeconds: number) => {
    await submitAnswer.mutateAsync({
      question_id: current.questionId,
      selected_choice_id: optionId,
      time_spent_seconds: timeSpentSeconds,
    });

    if (cursor >= queue.length - 1) {
      // Results UI is MOB-42 — calm stub exit only.
      router.replace(`/(app)/diagnostic/results/${testId}`);
      return;
    }
    setCursor((value) => value + 1);
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave diagnostic"
          hitSlop={tokens.size.hitSlop}
          onPress={() => router.replace('/(app)/diagnostic')}
          style={({ pressed }) => [styles.leave, pressed ? styles.pressed : undefined]}
        >
          <Text variant="body" tone="brand" weight="bold">
            Leave
          </Text>
        </Pressable>
        <SectionProgress
          subjectName={current.subjectName}
          indexInSection={current.indexInSection}
          sectionCount={current.sectionCount}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <QueryState
          phase={phase}
          loading={<SkeletonScreen />}
          empty={
            <EmptyState
              eyebrow="Question"
              title="No question here"
              message="This item isn’t available. Try again from the intro."
              action={{
                label: 'Back to intro',
                onPress: () => router.replace('/(app)/diagnostic'),
              }}
            />
          }
          error={
            <ErrorState
              title="Question didn’t load"
              message="Check your connection and try again."
              onRetry={() => void question.refetch()}
              retrying={question.isFetching}
            />
          }
        >
          {question.data ? (
            <QuietAnswerStep
              key={current.questionId}
              question={question.data}
              busy={busy}
              onAnswer={onAnswer}
            />
          ) : null}
        </QueryState>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.canvas,
  },
  topBar: {
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[3],
    gap: tokens.space[2],
    borderBottomWidth: tokens.stroke.thin,
    borderBottomColor: tokens.color.border.subtle,
    backgroundColor: tokens.color.surface.raised,
  },
  leave: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[5],
    paddingBottom: tokens.space[10],
  },
});
