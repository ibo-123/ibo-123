import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  OfflineBanner,
  QueryState,
  RadioGroup,
  Screen,
  SegmentedToggle,
  Sheet,
  SkeletonScreen,
  Text,
  TextField,
  type QueryPhase,
} from '@/shared/ui';

type AuthMode = 'email' | 'phone';
/** Same stream values as docs/api-contract.md (§10–11, §13.1). */
type ContractStream = 'natural_science' | 'social_science';

export default function KitchenSinkScreen() {
  const [mode, setMode] = useState<AuthMode>('email');
  const [remember, setRemember] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [phase, setPhase] = useState<QueryPhase>('loading');
  const [stream, setStream] = useState<ContractStream>('natural_science');

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.section}>
        <Text variant="display">UI Kit</Text>
        <Text variant="body" tone="secondary">
          Every shared primitive from Figma Log In — pressed, disabled, and error where it matters.
        </Text>
      </View>

      <Section title="Text">
        <Text variant="display">Display · Master your next mock.</Text>
        <Text variant="title">Title · Log In to TemariHub</Text>
        <Text variant="body" tone="secondary">
          Body · Log in to continue your preparation
        </Text>
        <Text variant="label" tone="secondary">
          Label · Student Email
        </Text>
        <Text variant="caption" tone="secondary" uppercase>
          Caption · Grade 12 Prep
        </Text>
      </Section>

      <Section title="Badge">
        <View style={styles.row}>
          <Badge label="Grade 12 Prep" leading={<Bolt />} />
          <Badge label="Neutral" tone="neutral" />
        </View>
      </Section>

      <Section title="Button">
        <Button label="Log In to TemariHub" trailing={<Arrow />} />
        <Button label="Pressed look" style={styles.pressedDemo} />
        <Button label="Secondary" variant="secondary" />
        <Button label="Ghost" variant="ghost" />
        <Button label="Loading" loading />
        <Button label="Disabled" disabled />
      </Section>

      <Section title="IconButton">
        <View style={styles.row}>
          <IconButton accessibilityLabel="Ghost icon" onPress={() => undefined}>
            <Bolt />
          </IconButton>
          <IconButton accessibilityLabel="Subtle icon" variant="subtle" onPress={() => undefined}>
            <Bolt />
          </IconButton>
          <IconButton accessibilityLabel="Outline icon" variant="outline" onPress={() => undefined}>
            <Bolt />
          </IconButton>
          <IconButton accessibilityLabel="Disabled icon" disabled onPress={() => undefined}>
            <Bolt />
          </IconButton>
        </View>
      </Section>

      <Section title="SegmentedToggle">
        <SegmentedToggle
          options={[
            { label: 'Email', value: 'email' },
            { label: 'Phone Number', value: 'phone' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <SegmentedToggle
          options={[
            { label: 'Email', value: 'email' },
            { label: 'Phone Number', value: 'phone' },
          ]}
          value={mode}
          onChange={setMode}
          disabled
        />
      </Section>

      <Section title="TextField">
        <TextField
          label="Student Email"
          placeholder="abel@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftSlot={<FieldIcon label="@" />}
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          revealable
          labelAction={{ label: 'Forgot?', onPress: () => setSheetOpen(true) }}
          leftSlot={<FieldIcon label="*" />}
        />
        <TextField
          label="With error"
          value="bad@"
          onChangeText={() => undefined}
          error="Enter a valid student email."
        />
        <TextField label="Disabled" value="Locked value" editable={false} />
      </Section>

      <Section title="Checkbox">
        <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
        <Checkbox checked={false} onChange={() => undefined} label="Unchecked" />
        <Checkbox checked disabled onChange={() => undefined} label="Disabled" />
      </Section>

      <Section title="RadioGroup">
        <Text variant="caption" tone="secondary" weight="medium">
          Figma `98:116` · values match contract stream enums
        </Text>
        <RadioGroup
          label="Stream"
          options={[
            { label: 'Natural Science', value: 'natural_science' },
            { label: 'Social Science', value: 'social_science' },
          ]}
          value={stream}
          onChange={setStream}
        />
        <RadioGroup
          label="Stream (stack)"
          layout="stack"
          options={[
            { label: 'Natural Science', value: 'natural_science' },
            { label: 'Social Science', value: 'social_science' },
          ]}
          value={stream}
          onChange={setStream}
        />
        <RadioGroup
          label="Disabled"
          options={[
            { label: 'Natural Science', value: 'natural_science' },
            { label: 'Social Science', value: 'social_science' },
          ]}
          value={stream}
          onChange={setStream}
          disabled
        />
      </Section>

      <Section title="Card">
        <Card>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <Bolt />
            </View>
            <View style={styles.cardCopy}>
              <Text variant="body" weight="bold">
                Timed Mocks Anywhere
              </Text>
              <Text variant="caption" tone="secondary" weight="medium">
                Take exams offline, sync when ready. Prep on the go.
              </Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Sheet">
        <Button label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
        <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Reset password">
          <Text variant="body" tone="secondary">
            Sheet primitive for bottom drawers. Backdrop dismiss and close control included.
          </Text>
          <Button label="Got it" onPress={() => setSheetOpen(false)} />
        </Sheet>
      </Section>

      <Section title="Skeleton">
        <SkeletonScreen />
      </Section>

      <Section title="Empty">
        <EmptyState
          eyebrow="Mistake notebook"
          title="No mistakes yet"
          message="Wrong answers from a practice set land here."
          action={{ label: 'Practice a topic', onPress: () => undefined }}
        />
      </Section>

      <Section title="Error">
        <ErrorState
          title="Today didn't load"
          message="The plan didn't arrive. Your last answers are still on this phone."
          onRetry={() => undefined}
        />
      </Section>

      <Section title="Offline">
        <OfflineBanner placement="inline" />
        <Text variant="caption" tone="secondary" weight="medium">
          The live bar floats on every screen in airplane mode.
        </Text>
      </Section>

      <Section title="Query state">
        <SegmentedToggle
          options={[
            { label: 'Load', value: 'loading' },
            { label: 'Empty', value: 'empty' },
            { label: 'Error', value: 'error' },
            { label: 'Ready', value: 'ready' },
          ]}
          value={phase}
          onChange={setPhase}
        />
        <QueryState
          phase={phase}
          empty={
            <EmptyState
              eyebrow="Mistake notebook"
              title="No mistakes yet"
              message="Wrong answers from a practice set land here."
              action={{ label: 'Practice a topic', onPress: () => setPhase('ready') }}
            />
          }
          error={
            <ErrorState
              title="Today didn't load"
              message="The plan didn't arrive. Your last answers are still on this phone."
              onRetry={() => setPhase('ready')}
            />
          }
        >
          <Card>
            <Text variant="body" weight="bold">
              Chemical equilibrium
            </Text>
            <Text variant="body" tone="secondary">
              3 of 4 right last time. Le Chatelier is next.
            </Text>
          </Card>
        </QueryState>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="muted" uppercase>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Bolt() {
  return <View style={styles.bolt} />;
}

function Arrow() {
  return (
    <Text variant="body" tone="inverse" weight="bold">
      {'>'}
    </Text>
  );
}

function FieldIcon({ label }: { label: string }) {
  return (
    <Text variant="label" tone="placeholder">
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: tokens.space[6],
    paddingBottom: tokens.space[12],
    gap: tokens.space[8],
  },
  section: {
    gap: tokens.space[3],
  },
  sectionBody: {
    gap: tokens.space[3],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[3],
    alignItems: 'center',
  },
  pressedDemo: {
    opacity: tokens.opacity.pressed,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
  },
  cardIcon: {
    width: tokens.space[10],
    height: tokens.size.control,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: tokens.space[0.5],
  },
  bolt: {
    width: tokens.space[2],
    height: tokens.space[2] + tokens.space[0.5],
    borderRadius: tokens.space[0.5],
    backgroundColor: tokens.color.brand.teal,
  },
});
