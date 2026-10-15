import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  QueryState,
  Screen,
  Skeleton,
  Text,
  type QueryPhase,
} from '@/shared/ui';

import { useTopic } from '../hooks/useTopic';
import type { TopicDetail, TopicPrerequisite, TopicResource } from '../types';

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

/** Humanize estimated_study_minutes — minutes under an hour, otherwise Xh / Xh Ym. */
function formatStudyTime(minutes: number): { value: string; hint: string } {
  if (minutes < 60) {
    return { value: String(minutes), hint: minutes === 1 ? 'minute' : 'minutes' };
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return { value: `${hours}h`, hint: hours === 1 ? 'hour' : 'hours' };
  }
  return { value: `${hours}h ${rest}m`, hint: 'estimated' };
}

function MetaTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card style={styles.metaCard}>
      <View style={styles.metaTile}>
        <Text variant="caption" tone="secondary" uppercase>
          {label}
        </Text>
        <Text variant="display" weight="extrabold" style={styles.metaValue}>
          {value}
        </Text>
        <Text variant="label" tone="muted">
          {hint}
        </Text>
      </View>
    </Card>
  );
}

function PrerequisiteRow({
  item,
  onPress,
}: {
  item: TopicPrerequisite;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open prerequisite ${item.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.prereqRow, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.prereqMark}>
        <Text variant="caption" tone="brand" weight="bold">
          PRE
        </Text>
      </View>
      <Text variant="body" weight="semibold" style={styles.prereqLabel}>
        {item.name}
      </Text>
      <Text variant="title" tone="brand" weight="bold">
        ›
      </Text>
    </Pressable>
  );
}

function ResourceRow({ item }: { item: TopicResource }) {
  const url = item.url;
  const body = (
    <>
      <View style={styles.resourceDot} />
      <Text
        variant="body"
        weight="semibold"
        tone={url ? 'brand' : 'primary'}
        style={styles.resourceLabel}
      >
        {item.title}
      </Text>
      {url ? (
        <Text variant="title" tone="brand" weight="bold">
          ›
        </Text>
      ) : null}
    </>
  );

  if (!url) {
    return <View style={styles.resourceRow}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open resource ${item.title}`}
      onPress={() => {
        void Linking.openURL(url);
      }}
      style={({ pressed }) => [styles.resourceRow, pressed ? styles.pressed : undefined]}
    >
      {body}
    </Pressable>
  );
}

function TopicLoading() {
  return (
    <View style={styles.loading}>
      <Skeleton width={72} height={24} radius={tokens.radius.sm} />
      <Skeleton width="78%" height={30} radius={tokens.radius.sm} />
      <View style={styles.metaRow}>
        <Skeleton width="48%" height={96} radius={tokens.radius.lg} />
        <Skeleton width="48%" height={96} radius={tokens.radius.lg} />
      </View>
      <Skeleton width="100%" height={140} radius={tokens.radius.lg} />
      <Skeleton width="100%" height={120} radius={tokens.radius.lg} />
    </View>
  );
}

function TopicBody({
  topic,
  reduceMotion,
  onOpenPrerequisite,
}: {
  topic: TopicDetail;
  reduceMotion: boolean;
  onOpenPrerequisite: (id: string) => void;
}) {
  const enter = (delay: number) =>
    reduceMotion ? undefined : FadeInDown.duration(tokens.motion.enter).delay(delay);

  const hasMinutes = topic.estimated_study_minutes > 0;
  const study = hasMinutes ? formatStudyTime(topic.estimated_study_minutes) : null;
  const hasQuestions = topic.question_count != null;

  return (
    <View style={styles.body}>
      <Animated.View entering={enter(0)} style={styles.hero}>
        <Badge label="Topic" tone="brand" />
        <Text variant="display" accessibilityRole="header">
          {topic.name}
        </Text>
        <View style={styles.heroRule} />
        <Text variant="body" tone="secondary">
          Glance the load, skim what you’ll learn, then practice when you’re ready.
        </Text>
      </Animated.View>

      <Animated.View entering={enter(40)} style={styles.metaRow}>
        <MetaTile
          label="Study time"
          value={study?.value ?? '—'}
          hint={study?.hint ?? 'not set yet'}
        />
        <MetaTile
          label="Questions"
          value={hasQuestions ? String(topic.question_count) : '—'}
          hint={hasQuestions ? 'in the bank' : 'coming soon'}
        />
      </Animated.View>

      {topic.concepts.length > 0 ? (
        <Animated.View entering={enter(80)}>
          <Card>
            <View style={styles.section}>
              <Text variant="caption" tone="secondary" uppercase>
                Concepts
              </Text>
              <View style={styles.conceptWrap}>
                {topic.concepts.map((concept) => (
                  <View key={concept} style={styles.conceptChip}>
                    <Text variant="label" tone="brand" weight="bold" numberOfLines={1}>
                      {concept}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(120)}>
        <Card>
          <View style={styles.section}>
            <Text variant="caption" tone="secondary" uppercase>
              Learning objectives
            </Text>
            {topic.learning_objectives.length === 0 ? (
              <Text variant="body" tone="secondary">
                We’re still writing the goals for this topic — practice still works.
              </Text>
            ) : (
              <View style={styles.objectiveList}>
                {topic.learning_objectives.map((objective, index) => (
                  <View key={objective} style={styles.objectiveRow}>
                    <View style={styles.objectiveIndex}>
                      <Text variant="label" tone="brand" weight="bold">
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text variant="body" style={styles.objectiveText}>
                      {objective}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={enter(160)}>
        <Card>
          <View style={styles.section}>
            <Text variant="caption" tone="secondary" uppercase>
              Prerequisites
            </Text>
            {topic.prerequisites.length === 0 ? (
              <Text variant="body" tone="secondary">
                No prerequisites — you can jump straight in.
              </Text>
            ) : (
              <View style={styles.prereqList}>
                {topic.prerequisites.map((item) => (
                  <PrerequisiteRow
                    key={item.id}
                    item={item}
                    onPress={() => onOpenPrerequisite(item.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </Card>
      </Animated.View>

      {topic.recommended_resources.length > 0 ? (
        <Animated.View entering={enter(200)}>
          <Card>
            <View style={styles.section}>
              <Text variant="caption" tone="secondary" uppercase>
                Recommended resources
              </Text>
              <View style={styles.resourceList}>
                {topic.recommended_resources.map((item) => (
                  <ResourceRow key={item.title} item={item} />
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * Issue #48 / MOB-32 — topic detail (Figma `32:946`).
 * Contract §13.4 fields optional; live Django lean serializer stays compatible.
 */
export function TopicScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const params = useLocalSearchParams<{ topicId: string }>();
  const topicId = typeof params.topicId === 'string' ? params.topicId : undefined;
  const topic = useTopic(topicId);
  const phase = phaseFor(topic.isPending, topic.isError, Boolean(topic.data));

  const onPractice = () => {
    if (topicId) {
      router.push({
        pathname: '/(app)/(tabs)/practice',
        params: { topicId },
      });
      return;
    }
    router.push('/(app)/(tabs)/practice');
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false} style={styles.screen}>
      <View style={styles.shell}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={tokens.size.hitSlop}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed ? styles.pressed : undefined]}
          >
            <Text variant="body" tone="brand" weight="bold">
              ‹ Back
            </Text>
          </Pressable>

          <QueryState
            phase={phase}
            loading={<TopicLoading />}
            empty={
              <EmptyState
                eyebrow="Topic"
                title="Topic not found"
                message="This topic isn’t on your track — try another from the unit list."
                action={{ label: 'Go back', onPress: () => router.back() }}
              />
            }
            error={
              <ErrorState
                title="Topic didn’t load"
                message="Check your connection and try again."
                onRetry={() => void topic.refetch()}
              />
            }
          >
            {topic.data ? (
              <TopicBody
                topic={topic.data}
                reduceMotion={Boolean(reduceMotion)}
                onOpenPrerequisite={(id) => router.push(`/(app)/topic/${id}`)}
              />
            ) : null}
          </QueryState>
        </ScrollView>

        {topic.data ? (
          <View style={styles.actionBar}>
            <Button
              label="Practice this topic"
              accessibilityLabel="Practice this topic"
              onPress={onPractice}
              style={styles.cta}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.canvas,
  },
  shell: {
    flex: 1,
  },
  content: {
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[8],
    gap: tokens.space[5],
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: tokens.space[1],
  },
  loading: {
    gap: tokens.space[4],
  },
  body: {
    gap: tokens.space[4],
  },
  hero: {
    gap: tokens.space[3],
  },
  heroRule: {
    width: tokens.space[10],
    height: tokens.stroke.thick,
    borderRadius: tokens.stroke.thick,
    backgroundColor: tokens.color.brand.teal,
  },
  metaRow: {
    flexDirection: 'row',
    gap: tokens.space[3],
  },
  metaCard: {
    flex: 1,
  },
  metaTile: {
    gap: tokens.space[1],
  },
  metaValue: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: tokens.color.brand.teal,
  },
  section: {
    gap: tokens.space[3],
  },
  conceptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  conceptChip: {
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[1.5],
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.brand.tealMuted,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.brand.tealBorder,
  },
  objectiveList: {
    gap: tokens.space[3],
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
  },
  objectiveIndex: {
    minWidth: tokens.space[8],
    height: tokens.space[8],
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.brand.tealMuted,
  },
  objectiveText: {
    flex: 1,
    paddingTop: tokens.space[1.5],
  },
  prereqList: {
    gap: tokens.space[2],
  },
  prereqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: tokens.size.control,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface.muted,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.subtle,
  },
  prereqMark: {
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[1],
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.brand.tealMuted,
  },
  prereqLabel: {
    flex: 1,
  },
  resourceList: {
    gap: tokens.space[2],
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: tokens.size.controlSm,
    paddingVertical: tokens.space[1],
  },
  resourceDot: {
    width: tokens.space[2],
    height: tokens.space[2],
    borderRadius: tokens.space[1],
    backgroundColor: tokens.color.brand.teal,
  },
  resourceLabel: {
    flex: 1,
  },
  actionBar: {
    width: '100%',
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    borderTopWidth: tokens.stroke.thin,
    borderTopColor: tokens.color.border.subtle,
    backgroundColor: tokens.color.surface.raised,
    ...tokens.shadow.soft,
  },
  cta: {
    width: '100%',
  },
  pressed: {
    opacity: tokens.opacity.pressed,
  },
});
