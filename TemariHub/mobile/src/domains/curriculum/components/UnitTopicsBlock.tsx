import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

import { useUnitTopics } from '../hooks/useUnitTopics';
import type { Unit } from '../types';

type UnitTopicsBlockProps = {
  unit: Unit;
};

/** One unit section: topics list, or “Topics coming soon” when empty (MOB-30). */
export function UnitTopicsBlock({ unit }: UnitTopicsBlockProps) {
  const router = useRouter();
  const topics = useUnitTopics(unit.id);

  return (
    <View style={styles.root}>
      <Text variant="title" weight="bold" style={styles.unitTitle}>
        {unit.name}
      </Text>

      {topics.isPending ? (
        <Text variant="body" tone="muted">
          Loading topics…
        </Text>
      ) : null}

      {topics.isError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Retry loading topics for ${unit.name}`}
          onPress={() => void topics.refetch()}
        >
          <Text variant="body" tone="danger" weight="semibold">
            Couldn’t load topics. Tap to retry.
          </Text>
        </Pressable>
      ) : null}

      {topics.isSuccess && topics.data.count === 0 ? (
        <Text variant="body" tone="secondary">
          Topics coming soon
        </Text>
      ) : null}

      {topics.isSuccess && topics.data.count > 0 ? (
        <View style={styles.topics}>
          {topics.data.items.map((topic) => (
            <Pressable
              key={topic.id}
              accessibilityRole="button"
              accessibilityLabel={`${topic.name}, ${topic.estimated_study_minutes} minutes`}
              onPress={() => router.push(`/(app)/topic/${topic.id}`)}
              style={({ pressed }) => [
                styles.topicRow,
                pressed ? styles.pressed : undefined,
              ]}
            >
              <View style={styles.topicCopy}>
                <Text variant="body" weight="semibold">
                  {topic.name}
                </Text>
                <Text variant="caption" tone="secondary">
                  {topic.estimated_study_minutes} min
                </Text>
              </View>
              <Text variant="body" tone="brand" weight="bold">
                ›
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface.raised,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.subtle,
  },
  unitTitle: {
    paddingBottom: tokens.space[1],
  },
  topics: {
    gap: tokens.space[2],
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: tokens.size.control,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface.muted,
  },
  topicCopy: {
    flex: 1,
    gap: tokens.space[0.5],
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
});
