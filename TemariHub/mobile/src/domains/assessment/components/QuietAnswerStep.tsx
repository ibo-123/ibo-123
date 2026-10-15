import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { QuietChoiceList, type StudentQuestion } from '@/domains/content';
import { tokens } from '@/shared/theme';
import { Badge, Text } from '@/shared/ui';

import { describeAnswerError } from '../hooks/useSubmitDiagnosticAnswer';
import { Notice } from './Notice';

export type QuietAnswerStepProps = {
  question: StudentQuestion;
  busy: boolean;
  onAnswer: (choiceId: string, timeSpentSeconds: number) => Promise<void>;
};

/** Remounted per question (`key`) so selection + timer reset cleanly. */
export function QuietAnswerStep({ question, busy, onAnswer }: QuietAnswerStepProps) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [answerError, setAnswerError] = useState<string | undefined>();
  const [localBusy, setLocalBusy] = useState(false);
  const shownAtRef = useRef(0);
  const guardRef = useRef(false);

  useLayoutEffect(() => {
    shownAtRef.current = performance.now();
  }, []);

  const onSelect = async (optionId: string) => {
    if (busy || guardRef.current) {
      return;
    }
    guardRef.current = true;
    setLocalBusy(true);
    setSelectedId(optionId);
    setAnswerError(undefined);

    const started = shownAtRef.current || performance.now();
    const elapsedMs = performance.now() - started;
    const timeSpentSeconds = Math.max(1, Math.round(elapsedMs / 1000));

    try {
      await onAnswer(optionId, timeSpentSeconds);
    } catch (error) {
      setAnswerError(describeAnswerError(error));
      guardRef.current = false;
      setLocalBusy(false);
    }
  };

  const sourceLabel =
    question.source && question.exam_year != null
      ? `${question.source} · ${question.exam_year}`
      : question.source;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(tokens.motion.enter)}
      style={styles.promptBlock}
    >
      {sourceLabel ? <Badge label={sourceLabel} tone="neutral" /> : null}
      <Text variant="title" weight="bold" accessibilityRole="header">
        {question.prompt}
      </Text>
      <QuietChoiceList
        options={question.options}
        selectedId={selectedId}
        disabled={busy || localBusy}
        onSelect={(id) => void onSelect(id)}
      />
      {answerError ? <Notice tone="error" message={answerError} /> : null}
      {busy ? (
        <Text variant="label" tone="secondary">
          Saving…
        </Text>
      ) : (
        <Text variant="label" tone="muted">
          Pick an answer to continue. Nothing is graded on this screen.
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  promptBlock: {
    gap: tokens.space[5],
  },
});
