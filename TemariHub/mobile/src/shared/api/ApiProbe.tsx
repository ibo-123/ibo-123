import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLogout, useMe, useSessionStore } from '@/domains/identity';
import { env } from '@/config/env';
import { ApiError } from '@/shared/api/errors';
import { mockTokens } from '@/shared/api/mocks';
import { tokens } from '@/shared/theme';
import { Badge, Button, Card, Text } from '@/shared/ui';

type ProbeStatus = 'idle' | 'signed_out' | 'signed_in' | 'refreshed' | 'error';

export function ApiProbe() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);
  const accessToken = useSessionStore((s) => s.accessToken);
  const refreshToken = useSessionStore((s) => s.refreshToken);
  const hydrated = useSessionStore((s) => s.hydrated);
  const { logout, isPending: isLoggingOut } = useLogout();
  const [probeNote, setProbeNote] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<ProbeStatus>('idle');

  const meQuery = useMe({ enabled: env.useMocks && hydrated && Boolean(accessToken || refreshToken) });

  const runProbe = useCallback(async () => {
    setProbeNote(null);
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    try {
      const result = await meQuery.refetch();
      if (result.error) {
        throw result.error;
      }
      setLastStatus('signed_in');
      setProbeNote(`Signed in as ${result.data?.full_name ?? 'student'}.`);
    } catch (error) {
      setLastStatus('error');
      if (error instanceof ApiError) {
        setProbeNote(`${error.code}: ${error.message}`);
      } else {
        setProbeNote('Unexpected error — check Metro logs.');
      }
    }
  }, [meQuery, queryClient]);

  const mockSignIn = useCallback(async () => {
    await setSession({
      accessToken: mockTokens.activeAccess,
      refreshToken: mockTokens.initialRefresh,
    });
    setLastStatus('signed_in');
    setProbeNote('Mock session stored in SecureStore.');
    await runProbe();
  }, [runProbe, setSession]);

  const mockExpireAccess = useCallback(async () => {
    if (!refreshToken) {
      setProbeNote('Sign in first.');
      return;
    }
    await setSession({
      accessToken: mockTokens.expiredAccess,
      refreshToken,
    });
    setProbeNote('Access token expired — next /auth/me should refresh once.');
    setLastStatus('refreshed');
    await runProbe();
  }, [refreshToken, runProbe, setSession]);

  const mockSignOut = useCallback(async () => {
    await logout();
    setLastStatus('signed_out');
    setProbeNote('Logged out via POST /auth/logout — SecureStore + cache cleared.');
  }, [logout]);

  if (!env.useMocks) {
    return (
      <Card style={styles.card}>
        <Text variant="label" tone="secondary">
          API client
        </Text>
        <Text variant="body" tone="secondary">
          Set EXPO_PUBLIC_USE_MOCKS=true to exercise refresh rotation locally without the backend.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="title">API probe</Text>
        <Badge label="Mocks on" tone="neutral" />
      </View>
      <Text variant="body" tone="secondary">
        Contract client · 401 → one refresh → retry · rotation updates SecureStore immediately.
      </Text>

      <View style={styles.tokenRow}>
        <Text variant="caption" tone="secondary">
          Hydrated · {hydrated ? 'yes' : 'no'}
        </Text>
        <Text variant="caption" tone="secondary">
          Access · {accessToken ? `${accessToken.slice(0, 18)}…` : 'none'}
        </Text>
        <Text variant="caption" tone="secondary">
          Refresh · {refreshToken ?? 'none'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Mock sign-in" onPress={() => void mockSignIn()} />
        <Button
          label="Expire access & call /auth/me"
          variant="secondary"
          onPress={() => void mockExpireAccess()}
        />
        <Button
          label="Log out (POST /auth/logout)"
          variant="ghost"
          loading={isLoggingOut}
          onPress={() => void mockSignOut()}
        />
      </View>

      {meQuery.isFetching ? (
        <Text variant="caption" tone="secondary">
          Calling GET /auth/me…
        </Text>
      ) : null}

      {probeNote ? (
        <View
          style={[styles.note, lastStatus === 'error' ? styles.noteDanger : styles.noteSuccess]}
        >
          <Text variant="label" tone={lastStatus === 'error' ? 'primary' : 'brand'}>
            {probeNote}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
  },
  tokenRow: {
    gap: tokens.space[1],
    paddingVertical: tokens.space[2],
  },
  actions: {
    gap: tokens.space[2],
  },
  note: {
    borderRadius: tokens.radius.sm,
    padding: tokens.space[3],
  },
  noteSuccess: {
    backgroundColor: tokens.color.brand.tealMuted,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.brand.tealBorder,
  },
  noteDanger: {
    backgroundColor: tokens.color.surface.muted,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
  },
});
