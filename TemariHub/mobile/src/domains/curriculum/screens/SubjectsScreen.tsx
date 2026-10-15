import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useMe } from '@/domains/identity';
import { tokens } from '@/shared/theme';
import {
  Card,
  EmptyState,
  ErrorState,
  QueryState,
  Screen,
  Text,
  type QueryPhase,
} from '@/shared/ui';

import { useSubjects } from '../hooks/useSubjects';
import type { Subject } from '../types';

function subjectsPhase(
  isPending: boolean,
  isError: boolean,
  count: number | undefined,
): QueryPhase {
  if (isPending) {
    return 'loading';
  }
  if (isError) {
    return 'error';
  }
  if (!count) {
    return 'empty';
  }
  return 'ready';
}

function streamLabel(stream: string | null | undefined): string | undefined {
  if (!stream) {
    return 'Shared';
  }
  if (stream === 'natural_science') {
    return 'Natural Science';
  }
  if (stream === 'social_science') {
    return 'Social Science';
  }
  return stream.replace(/_/g, ' ');
}

function SubjectRow({ subject, onPress }: { subject: Subject; onPress: () => void }) {
  const track = streamLabel(subject.stream);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subject.name}${track ? `, ${track}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.rowPressed : undefined]}
    >
      <Card style={styles.rowCard}>
        <View style={styles.rowBody}>
          <View style={styles.rowCopy}>
            <Text variant="title" weight="bold">
              {subject.name}
            </Text>
            {track ? (
              <Text variant="body" tone="secondary">
                {track}
              </Text>
            ) : null}
          </View>
          <Text variant="title" tone="brand" weight="bold">
            ›
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Learn tab — MOB-30 subjects list.
 * Grade + stream come from GET /auth/me (contract §10 / §13.1).
 */
export function SubjectsScreen() {
  const router = useRouter();
  const me = useMe();
  const grade = me.data?.grade;
  const stream = me.data?.stream;
  const query =
    grade != null && stream
      ? { grade, stream }
      : null;

  const subjects = useSubjects(query);
  const phase = subjectsPhase(
    me.isPending || (query != null && subjects.isPending),
    me.isError || subjects.isError,
    subjects.data?.count,
  );

  const trackLine =
    query != null
      ? `Grade ${query.grade} · ${streamLabel(query.stream) ?? query.stream}`
      : undefined;

  return (
    <Screen edges={['top']} padded={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="display" accessibilityRole="header">
            Learn
          </Text>
          {trackLine ? (
            <Text variant="body" tone="secondary">
              {trackLine}
            </Text>
          ) : null}
        </View>

        <QueryState
          phase={query == null && !me.isPending && !me.isError ? 'empty' : phase}
          empty={
            <EmptyState
              eyebrow="Curriculum"
              title={query == null ? 'Finish your exam track' : 'No subjects yet'}
              message={
                query == null
                  ? 'We need your grade and stream before we can load subjects.'
                  : 'Subjects for your track will show up here when they are ready.'
              }
              action={
                query == null
                  ? { label: 'Open profile', onPress: () => router.push('/(app)/(tabs)/me') }
                  : { label: 'Try again', onPress: () => void subjects.refetch() }
              }
            />
          }
          error={
            <ErrorState
              title="Subjects didn’t load"
              message="Check your connection and try again."
              onRetry={() => {
                void me.refetch();
                void subjects.refetch();
              }}
            />
          }
        >
          <View style={styles.list}>
            {(subjects.data?.items ?? []).map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                onPress={() => router.push(`/(app)/subject/${subject.id}`)}
              />
            ))}
          </View>
        </QueryState>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.canvas,
  },
  content: {
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[6],
    paddingBottom: tokens.space[12],
    gap: tokens.space[6],
  },
  header: {
    gap: tokens.space[1],
  },
  list: {
    gap: tokens.space[3],
  },
  rowCard: {
    borderRadius: tokens.radius.md,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  rowCopy: {
    flex: 1,
    gap: tokens.space[0.5],
  },
  rowPressed: {
    opacity: tokens.opacity.pressed,
  },
});
