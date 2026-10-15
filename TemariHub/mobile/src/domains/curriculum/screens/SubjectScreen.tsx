import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import {
  EmptyState,
  ErrorState,
  QueryState,
  Screen,
  Text,
  type QueryPhase,
} from '@/shared/ui';

import { UnitTopicsBlock } from '../components/UnitTopicsBlock';
import { useSubjectUnits } from '../hooks/useSubjectUnits';

function phaseFor(isPending: boolean, isError: boolean, count: number | undefined): QueryPhase {
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

/** Subject stack — units with nested topics (MOB-30). */
export function SubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId: string }>();
  const subjectId = typeof params.subjectId === 'string' ? params.subjectId : undefined;
  const units = useSubjectUnits(subjectId);
  const phase = phaseFor(units.isPending, units.isError, units.data?.count);

  return (
    <Screen edges={['top']} padded={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to subjects"
            hitSlop={tokens.size.hitSlop}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed ? styles.pressed : undefined]}
          >
            <Text variant="body" tone="brand" weight="bold">
              ‹ Subjects
            </Text>
          </Pressable>
          <Text variant="display" accessibilityRole="header">
            {units.data?.subject.name ?? 'Subject'}
          </Text>
          {units.data ? (
            <Text variant="body" tone="secondary">
              {units.data.count} {units.data.count === 1 ? 'unit' : 'units'}
            </Text>
          ) : null}
        </View>

        <QueryState
          phase={phase}
          empty={
            <EmptyState
              eyebrow="Units"
              title="No units yet"
              message="This subject doesn’t have units to browse right now."
              action={{ label: 'Back to subjects', onPress: () => router.back() }}
            />
          }
          error={
            <ErrorState
              title="Units didn’t load"
              message="Check your connection and try again."
              onRetry={() => void units.refetch()}
            />
          }
        >
          <View style={styles.list}>
            {(units.data?.items ?? []).map((unit) => (
              <UnitTopicsBlock key={unit.id} unit={unit} />
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
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[12],
    gap: tokens.space[6],
  },
  header: {
    gap: tokens.space[1],
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: tokens.space[1],
  },
  list: {
    gap: tokens.space[4],
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
});
