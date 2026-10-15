import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useCompactLayout } from '@/shared/hooks';
import { tokens } from '@/shared/theme';
import { Button, Screen, Text } from '@/shared/ui';

import { AuthHeader } from '../components/AuthHeader';
import { ArrowIcon } from '../components/AuthIcons';
import { FormMessage, type FormMessageTone } from '../components/FormMessage';
import { OtpCodeInput } from '../components/OtpCodeInput';
import { describeVerifyOtpError, useVerifyOtp } from '../hooks/useVerifyOtp';
import { useSessionStore } from '../session.store';

const DEFAULT_EXPIRES_IN = 300;
const ETHIOPIAN_MOBILE = /^\+251[79]\d{8}$/;

type FormNotice = { tone: FormMessageTone; message: string };

function formatPhoneDisplay(phone: string): string {
  // +251912345678 → +251 91 234 5678
  const match = /^\+251([79]\d)(\d{3})(\d{4})$/.exec(phone);
  if (!match) {
    return phone;
  }
  return `+251 ${match[1]} ${match[2]} ${match[3]}`;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Phone OTP verify — plan §7.5 (no dedicated Figma frame yet).
 * Matches the Login/Sign Up auth shell: logo, title, teal CTA.
 * Params from MOB-13: `phone`, `expires_in`.
 */
export function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; expires_in?: string }>();
  const { showBadge, density } = useCompactLayout();
  const { verify, resend, isVerifying, isResending } = useVerifyOtp();

  const pendingPhone = useSessionStore((state) => state.pendingVerificationPhone);
  const profilePhone = useSessionStore((state) => state.profile?.phoneNumber ?? null);
  const pendingExpires = useSessionStore((state) => state.pendingVerificationExpiresIn);
  const hasSession = useSessionStore((state) => Boolean(state.accessToken || state.refreshToken));

  const phone = useMemo(() => {
    const raw = readParam(params.phone) ?? pendingPhone ?? profilePhone ?? undefined;
    return raw && ETHIOPIAN_MOBILE.test(raw) ? raw : undefined;
  }, [params.phone, pendingPhone, profilePhone]);

  const initialExpires = useMemo(() => {
    const raw = readParam(params.expires_in);
    const parsed = raw ? Number(raw) : (pendingExpires ?? DEFAULT_EXPIRES_IN);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_EXPIRES_IN;
  }, [params.expires_in, pendingExpires]);

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(initialExpires);
  const [locked, setLocked] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [notice, setNotice] = useState<FormNotice>();

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const busy = isVerifying || isResending;
  const showResend = secondsLeft <= 0;

  const onCodeChange = (next: string) => {
    setCode(next);
    setOtpError(false);
    setNotice(undefined);
  };

  const onVerify = async (otp: string = code) => {
    if (!phone || busy || locked) {
      return;
    }
    if (otp.length !== 6) {
      setOtpError(true);
      setNotice({ tone: 'error', message: 'Enter the 6-digit code we texted you.' });
      return;
    }

    Keyboard.dismiss();
    setNotice(undefined);
    setOtpError(false);

    try {
      const outcome = await verify({ phone_number: phone, otp });
      if (!outcome) {
        return;
      }
      // Profile is on the session; AuthGate opens Onboarding or Today.
    } catch (error) {
      const view = describeVerifyOtpError(error);
      setOtpError(true);
      setNotice({ tone: 'error', message: view.message });
      setLocked(Boolean(view.locked));
      if (view.code === 'OTP_EXPIRED' || view.locked) {
        setSecondsLeft(0);
      }
    }
  };

  const onResend = async () => {
    if (!phone || busy) {
      return;
    }
    setNotice(undefined);
    setOtpError(false);
    setCode('');

    try {
      const result = await resend({ phone_number: phone });
      if (!result) {
        return;
      }
      setSecondsLeft(result.expires_in);
      setLocked(false);
      setNotice({ tone: 'info', message: 'New code sent. Check your messages.' });
    } catch (error) {
      const view = describeVerifyOtpError(error);
      setNotice({ tone: 'error', message: view.message });
    }
  };

  const changeNumber = () => {
    void useSessionStore.getState().leaveVerification();
    router.replace('/(auth)/signup');
  };

  if (!phone) {
    return (
      <Screen padded={false} style={styles.screen}>
        <View style={styles.missing}>
          <AuthHeader title="Check your phone." showBadge={false} />
          <Text variant="body" tone="secondary" align="center">
            We need your number to verify the code. Go back and create your account again.
          </Text>
          {hasSession ? null : <Button label="Back to Sign Up" onPress={changeNumber} />}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AuthHeader
          title="Enter the code."
          subtitle={`We sent a 6-digit code to ${formatPhoneDisplay(phone)}`}
          showBadge={showBadge && density !== 'compact'}
          badgeLabel="2017 E.C. MATRIC"
        />

        <View style={styles.main}>
          <OtpCodeInput
            value={code}
            onChange={onCodeChange}
            onComplete={(otp) => {
              void onVerify(otp);
            }}
            error={otpError}
            disabled={busy || locked}
          />

          <View style={styles.meta}>
            {showResend ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send a new code"
                disabled={busy}
                hitSlop={tokens.size.hitSlop}
                onPress={onResend}
              >
                <Text variant="body" tone="brand" weight="bold">
                  {isResending ? 'Sending…' : 'Send a new code'}
                </Text>
              </Pressable>
            ) : (
              <Text variant="body" tone="muted">
                Resend in {formatCountdown(secondsLeft)}
              </Text>
            )}

            {hasSession ? null : (
              <Pressable
                accessibilityRole="link"
                hitSlop={tokens.size.hitSlop}
                onPress={changeNumber}
              >
                <Text variant="label" tone="secondary" weight="semibold">
                  Wrong number? Change it
                </Text>
              </Pressable>
            )}
          </View>

          {notice ? <FormMessage tone={notice.tone} message={notice.message} /> : null}

          <Button
            label="Verify & continue"
            accessibilityLabel={isVerifying ? 'Verifying code' : 'Verify and continue'}
            trailing={<ArrowIcon />}
            loading={isVerifying}
            disabled={locked || code.length !== 6}
            onPress={() => onVerify()}
            style={styles.submit}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.raised,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: tokens.space[6],
    paddingBottom: tokens.space[6],
  },
  main: {
    width: '100%',
    gap: tokens.space[5],
    paddingTop: tokens.space[6],
  },
  meta: {
    width: '100%',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  submit: {
    width: '100%',
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    gap: tokens.space[6],
    paddingHorizontal: tokens.space[6],
  },
});
