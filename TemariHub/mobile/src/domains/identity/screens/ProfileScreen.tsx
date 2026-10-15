import { useMemo, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import { Badge, ErrorState, QueryState, Screen, Text, type QueryPhase } from '@/shared/ui';

import {
  CapIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  KeyIcon,
  LogoutIcon,
  PhoneRowIcon,
  ShieldIcon,
} from '../components/ProfileIcons';
import { useLogout } from '../hooks/useLogout';
import { useMe } from '../hooks/useMe';
import { GRADE_CHOICES, STREAM_CHOICES } from '../onboardingTrack';
import type { CurrentUser } from '../types';

const PROFILE_CANVAS = '#FAF8FF';
const CARD_RADIUS = 32;
const ICON_WELL = {
  teal: tokens.color.brand.tealMuted,
  lilac: '#F2F3FF',
  rose: '#FEF2F2',
  slate: '#F1F5F9',
} as const;

const PROVIDER_LABELS: Record<string, string> = {
  phone: 'Phone',
  google: 'Google',
  apple: 'Apple',
  email: 'Email',
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) {
    return '?';
  }
  if (!last || parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function formatTrack(user: CurrentUser): string {
  const gradeLabel =
    GRADE_CHOICES.find((choice) => choice.grade === user.grade)?.label ??
    (user.grade != null ? String(user.grade) : null);
  const streamLabel =
    STREAM_CHOICES.find((choice) => choice.stream === user.stream)?.label ??
    (user.stream ? user.stream.replace(/_/g, ' ') : null);

  if (gradeLabel && streamLabel) {
    return `Grade ${gradeLabel} · ${streamLabel}`;
  }
  if (gradeLabel) {
    return `Grade ${gradeLabel}`;
  }
  if (streamLabel) {
    return streamLabel;
  }
  return 'Track not set yet';
}

function signInMethods(user: CurrentUser): string {
  const fromProviders = (user.auth_providers ?? [])
    .map((provider) => PROVIDER_LABELS[provider] ?? provider)
    .filter(Boolean);

  if (fromProviders.length > 0) {
    return fromProviders.join(' · ');
  }

  const fallback: string[] = [];
  if (user.phone_number) {
    fallback.push('Phone');
  }
  if (user.email) {
    fallback.push('Email');
  }
  return fallback.length > 0 ? fallback.join(' · ') : 'Password';
}

function formatPhone(phone?: string): string | undefined {
  if (!phone) {
    return undefined;
  }
  if (phone.startsWith('+251') && phone.length === 13) {
    return `0${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
  }
  return phone;
}

type ProfileRowProps = {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  well: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
};

function ProfileRow({
  title,
  subtitle,
  icon,
  well,
  trailing,
  onPress,
  showDivider = false,
}: ProfileRowProps) {
  const content = (
    <>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWell, { backgroundColor: well }]}>{icon}</View>
        <View style={styles.rowCopy}>
          <Text variant="title" tone="primary" weight="bold">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="secondary" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ?? (onPress ? <ChevronRightIcon /> : null)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          showDivider ? styles.rowDivider : undefined,
          pressed ? styles.rowPressed : undefined,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, showDivider ? styles.rowDivider : undefined]}>{content}</View>;
}

function ProfileBody({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const { logout, isPending: loggingOut } = useLogout();
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) =>
    reduceMotion ? undefined : FadeInDown.duration(tokens.motion.enter).delay(delay);

  const track = useMemo(() => formatTrack(user), [user]);
  const methods = useMemo(() => signInMethods(user), [user]);
  const phoneDisplay = formatPhone(user.phone_number);
  const twoFactorOn = Boolean(user.two_factor_enabled);

  const onLogout = () => {
    Alert.alert('Log out?', 'You’ll need your phone and password to get back in.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View entering={enter(0)} style={styles.header}>
        <View style={styles.headerSide} />
        <Text variant="title" tone="primary" weight="extrabold" style={styles.headerTitle}>
          Profile
        </Text>
        <View style={[styles.headerSide, styles.capWell]}>
          <CapIcon />
        </View>
      </Animated.View>

      <Animated.View entering={enter(60)} style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text variant="display" tone="brand" weight="extrabold">
              {initialsFromName(user.full_name)}
            </Text>
          </View>
          <View style={styles.checkBadge} accessibilityLabel="Verified account">
            <CheckBadgeIcon />
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text variant="display" tone="primary" weight="extrabold" numberOfLines={2}>
            {user.full_name}
          </Text>
          <Text variant="caption" tone="secondary" weight="bold" uppercase style={styles.track}>
            {track}
          </Text>
          {phoneDisplay ? (
            <Text variant="body" tone="muted">
              {phoneDisplay}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={enter(120)} style={styles.section}>
        <Text variant="caption" tone="muted" weight="extrabold" uppercase style={styles.sectionLabel}>
          Account
        </Text>
        <View style={styles.groupCard}>
          <ProfileRow
            title="Sign-in methods"
            subtitle={methods}
            icon={<PhoneRowIcon />}
            well={ICON_WELL.lilac}
            showDivider
          />
          <ProfileRow
            title="Grade & stream"
            subtitle={track}
            icon={<CapIcon />}
            well={ICON_WELL.teal}
          />
        </View>
      </Animated.View>

      <Animated.View entering={enter(180)} style={styles.section}>
        <Text variant="caption" tone="muted" weight="extrabold" uppercase style={styles.sectionLabel}>
          Security
        </Text>
        <View style={styles.groupCard}>
          <ProfileRow
            title="Two-factor auth"
            subtitle={
              twoFactorOn
                ? 'On — extra check when you sign in'
                : 'Off — turn on later for extra safety'
            }
            icon={<ShieldIcon color={twoFactorOn ? tokens.color.brand.teal : '#EF4444'} />}
            well={twoFactorOn ? ICON_WELL.teal : ICON_WELL.rose}
            trailing={
              <Badge label={twoFactorOn ? 'On' : 'Off'} tone={twoFactorOn ? 'brand' : 'neutral'} />
            }
            showDivider
          />
          <ProfileRow
            title="Change password"
            subtitle="Current → new → confirm"
            icon={<KeyIcon />}
            well={ICON_WELL.teal}
            onPress={() => router.push('/(app)/security/change-password')}
          />
        </View>
      </Animated.View>

      <Animated.View entering={enter(240)} style={styles.logoutWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: loggingOut }}
          disabled={loggingOut}
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed || loggingOut ? styles.logoutPressed : undefined,
          ]}
        >
          <LogoutIcon />
          <Text variant="title" style={styles.logoutLabel} weight="extrabold">
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Text>
        </Pressable>
      </Animated.View>

      <Text variant="caption" tone="muted" align="center" uppercase style={styles.footer}>
        TemariHub · Me
      </Text>
    </ScrollView>
  );
}

/**
 * Me tab — Figma profile redesign `22:2217` without PRO MEMBER, invites, or notification chrome.
 * Name, grade/stream, sign-in methods, 2FA status, change password, secure logout.
 */
export function ProfileScreen() {
  const me = useMe();

  const phase: QueryPhase = me.isPending
    ? 'loading'
    : me.isError
      ? 'error'
      : me.data
        ? 'ready'
        : 'empty';

  return (
    <Screen padded={false} style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryState
        phase={phase}
        empty={
          <ErrorState
            title="No profile yet"
            message="We couldn’t find your account details."
            onRetry={() => {
              void me.refetch();
            }}
          />
        }
        error={
          <ErrorState
            message={
              me.error instanceof Error
                ? me.error.message
                : 'We couldn’t load your profile. Try again.'
            }
            onRetry={() => {
              void me.refetch();
            }}
            retrying={me.isFetching}
          />
        }
      >
        {me.data ? <ProfileBody user={me.data} /> : null}
      </QueryState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PROFILE_CANVAS,
  },
  scroll: {
    paddingHorizontal: tokens.space[6],
    paddingBottom: tokens.space[12],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.space[8],
    paddingBottom: tokens.space[6],
  },
  headerSide: {
    width: tokens.size.control,
    height: tokens.size.control,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  capWell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.brand.tealMuted,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[5],
    padding: tokens.space[6],
    borderRadius: CARD_RADIUS,
    backgroundColor: tokens.color.surface.raised,
    borderWidth: tokens.stroke.thin,
    borderColor: 'rgba(0, 104, 95, 0.04)',
    ...tokens.shadow.card,
    marginBottom: tokens.space[8],
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 80,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: tokens.color.brand.tealMuted,
    backgroundColor: tokens.color.brand.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: tokens.color.surface.raised,
    backgroundColor: tokens.color.brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: tokens.space[1],
  },
  track: {
    letterSpacing: 1.2,
    marginTop: tokens.space[0.5],
    marginBottom: tokens.space[1],
  },
  section: {
    gap: tokens.space[4],
    marginBottom: tokens.space[8],
  },
  sectionLabel: {
    letterSpacing: 2.2,
    paddingHorizontal: tokens.space[2],
  },
  groupCard: {
    borderRadius: CARD_RADIUS,
    backgroundColor: tokens.color.surface.raised,
    borderWidth: tokens.stroke.thin,
    borderColor: 'rgba(0, 104, 95, 0.04)',
    overflow: 'hidden',
    ...tokens.shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
    padding: tokens.space[5],
  },
  rowDivider: {
    borderBottomWidth: tokens.stroke.thin,
    borderBottomColor: tokens.color.border.subtle,
  },
  rowPressed: {
    opacity: tokens.opacity.pressed,
    backgroundColor: tokens.color.surface.subtle,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
  },
  iconWell: {
    width: tokens.size.controlSm + 4,
    height: tokens.size.controlSm + 4,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  logoutWrap: {
    marginTop: tokens.space[2],
  },
  logoutButton: {
    minHeight: 64,
    borderRadius: 28,
    borderWidth: tokens.stroke.thin,
    borderColor: '#FEE2E2',
    backgroundColor: tokens.color.surface.raised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[3],
  },
  logoutPressed: {
    opacity: tokens.opacity.pressed,
  },
  logoutLabel: {
    color: '#EF4444',
  },
  footer: {
    marginTop: tokens.space[8],
    letterSpacing: 3,
    opacity: 0.7,
  },
});
