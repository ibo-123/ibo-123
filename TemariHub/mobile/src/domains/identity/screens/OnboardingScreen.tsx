import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useCompactLayout } from '@/shared/hooks';
import { tokens } from '@/shared/theme';
import { Button, Screen, Text } from '@/shared/ui';

import { AuthHeader } from '../components/AuthHeader';
import { ArrowIcon } from '../components/AuthIcons';
import { ExamOption } from '../components/ExamOption';
import { FormMessage, type FormMessageTone } from '../components/FormMessage';
import { describeOnboardingError, useOnboarding } from '../hooks/useOnboarding';
import { useSessionStore } from '../session.store';
import {
  GRADE_CHOICES,
  LIVE_ONBOARDING_TRACK,
  STREAM_CHOICES,
  type OnboardingStream,
} from '../onboardingTrack';

type FormNotice = { tone: FormMessageTone; message: string };

/**
 * Figma `22:2068` — one view, exam track only.
 * Grade 12 is the live grade; Natural and Social Science are both choosable.
 * Save confirms GET /auth/me, then the gate opens the diagnostic intro.
 */
export function OnboardingScreen() {
  const { showBadge, showSubtitle } = useCompactLayout();
  const { submit, isPending } = useOnboarding();
  const preferredStream = useSessionStore((state) => state.preferredStream);
  const [stream, setStream] = useState<OnboardingStream>(preferredStream);
  const [notice, setNotice] = useState<FormNotice>();

  const onSubmit = async () => {
    if (isPending) {
      return;
    }
    setNotice(undefined);
    try {
      const started = await submit({
        grade: LIVE_ONBOARDING_TRACK.grade,
        stream,
      });
      if (!started) {
        return;
      }
    } catch (error) {
      setNotice({ tone: 'error', message: describeOnboardingError(error).message });
    }
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.shell}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <AuthHeader
            title="Your exam track."
            subtitle={
              showSubtitle
                ? 'Pick Natural or Social Science for Grade 12, then take the diagnostic.'
                : undefined
            }
            showBadge={showBadge}
            badgeLabel="2017 E.C. MATRIC"
          />

          <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel="Grade">
            <Text variant="caption" tone="secondary" uppercase style={styles.sectionLabel}>
              Grade
            </Text>
            <View style={styles.row}>
              {GRADE_CHOICES.slice(0, 2).map((choice) => (
                <ExamOption
                  key={choice.grade}
                  label={choice.label}
                  accessibilityLabel={
                    choice.available
                      ? `Grade ${choice.grade}`
                      : `Grade ${choice.grade}, coming soon`
                  }
                  available={choice.available}
                  selected={choice.available}
                  fill
                />
              ))}
            </View>
            <View style={styles.row}>
              {GRADE_CHOICES.slice(2).map((choice) => (
                <ExamOption
                  key={choice.grade}
                  label={choice.label}
                  accessibilityLabel={
                    choice.available
                      ? `Grade ${choice.grade}`
                      : `Grade ${choice.grade}, coming soon`
                  }
                  available={choice.available}
                  selected={choice.available}
                  fill
                />
              ))}
            </View>
          </View>

          <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel="Stream">
            <Text variant="caption" tone="secondary" uppercase style={styles.sectionLabel}>
              Stream
            </Text>
            <View style={styles.stack}>
              {STREAM_CHOICES.map((choice) => (
                <ExamOption
                  key={choice.stream}
                  label={choice.label}
                  available={choice.available}
                  selected={stream === choice.stream}
                  onPress={() => {
                    setStream(choice.stream);
                    setNotice(undefined);
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.actionBar}>
          {notice ? <FormMessage tone={notice.tone} message={notice.message} /> : null}
          <Button
            label="Save & take diagnostic"
            accessibilityLabel={isPending ? 'Saving your track' : 'Save and take diagnostic'}
            trailing={<ArrowIcon />}
            loading={isPending}
            onPress={onSubmit}
            style={styles.submit}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.raised,
  },
  shell: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: tokens.space[5],
    paddingHorizontal: tokens.space[6],
    paddingBottom: tokens.space[4],
  },
  track: {
    gap: tokens.space[2],
  },
  sectionLabel: {
    paddingHorizontal: tokens.space[1],
  },
  row: {
    flexDirection: 'row',
    gap: tokens.space[3],
  },
  stack: {
    gap: tokens.space[3],
  },
  actionBar: {
    width: '100%',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    borderTopWidth: tokens.stroke.thin,
    borderTopColor: tokens.color.border.subtle,
    backgroundColor: tokens.color.surface.raised,
  },
  submit: {
    width: '100%',
  },
});
