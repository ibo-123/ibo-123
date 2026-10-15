import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useCompactLayout, useKeyboardVisible } from '@/shared/hooks';
import { toEthiopianE164 } from '@/shared/lib';
import { tokens } from '@/shared/theme';
import { Button, Checkbox, Screen, SegmentedToggle, Text, TextField } from '@/shared/ui';

import { AuthHeader } from '../components/AuthHeader';
import { ArrowIcon, LockIcon, MailIcon } from '../components/AuthIcons';
import { FormMessage, type FormMessageTone } from '../components/FormMessage';
import { SocialRow } from '../components/SocialRow';
import { describeLoginError, useLogin } from '../hooks/useLogin';

export type AuthMethod = 'phone' | 'email';

/** Phone default — issue #11. Option order matches Figma `73:4` (Email | Phone Number). */
const METHOD_OPTIONS = [
  { label: 'Email', value: 'email' as const },
  { label: 'Phone Number', value: 'phone' as const },
] as const;

type FormNotice = { tone: FormMessageTone; message: string };

/**
 * Figma Log In compact frame `73:4` — one view, no scroll at rest.
 * Logo · badge · title · Google + Apple · or · Email | Phone · fields · Remember me · CTA.
 */
export function LoginScreen() {
  const router = useRouter();
  const keyboardVisible = useKeyboardVisible();
  const { showBadge, showSubtitle, isCompact } = useCompactLayout();
  const { submit, isPending } = useLogin();

  const [method, setMethod] = useState<AuthMethod>('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [notice, setNotice] = useState<FormNotice>();

  const activeMethod: AuthMethod = method;
  const isEmail = activeMethod === 'email';

  const onIdentifierChange = (value: string) => {
    setIdentifier(value);
    setIdentifierError(undefined);
    setNotice(undefined);
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(undefined);
    setNotice(undefined);
  };

  const onSocialPress = (provider: 'Google' | 'Apple') => {
    setIdentifierError(undefined);
    setPasswordError(undefined);
    setNotice({
      tone: 'info',
      message: `${provider} sign-in is coming soon. Use your phone number.`,
    });
  };

  const onMethodChange = (next: AuthMethod) => {
    setMethod(next);
    setIdentifier('');
    setIdentifierError(undefined);
    setNotice(undefined);
  };

  const onSubmit = async () => {
    if (isPending) {
      return;
    }

    if (isEmail) {
      setNotice({ tone: 'info', message: 'Email sign-in is coming soon. Use your phone number.' });
      return;
    }

    const phoneNumber = toEthiopianE164(identifier);
    const nextIdentifierError = !identifier.trim()
      ? 'Enter your phone number.'
      : phoneNumber
        ? undefined
        : 'Enter a valid Ethiopian mobile number, like 91 234 5678.';
    const nextPasswordError = password ? undefined : 'Enter your password.';

    setIdentifierError(nextIdentifierError);
    setPasswordError(nextPasswordError);
    setNotice(undefined);
    if (!phoneNumber || nextPasswordError) {
      return;
    }

    Keyboard.dismiss();

    try {
      const outcome = await submit({ phone_number: phoneNumber, password });
      if (!outcome) {
        return;
      }
      // Session store is updated; AuthGate opens Today, Onboarding, or the 2FA stub.
    } catch (error) {
      const view = describeLoginError(error);
      if (view.field === 'phone_number') {
        setIdentifierError(view.message);
      } else {
        setNotice({ tone: 'error', message: view.message });
      }
    }
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <ScrollView
        scrollEnabled={keyboardVisible}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          keyboardVisible ? styles.contentKeyboard : undefined,
        ]}
      >
        <View style={styles.top}>
          <AuthHeader
            title="Master your next mock."
            subtitle={showSubtitle ? 'Log in to continue your preparation' : undefined}
            showBadge={showBadge}
            logoHeight={48}
            style={styles.header}
          />

          <View style={[styles.main, isCompact ? styles.mainCompact : undefined]}>
            <SocialRow
              onGooglePress={() => onSocialPress('Google')}
              onApplePress={() => onSocialPress('Apple')}
            />

            <SegmentedToggle
              options={METHOD_OPTIONS}
              value={activeMethod}
              onChange={onMethodChange}
            />

            <View style={styles.form}>
              {isEmail ? (
                <TextField
                  label="Student Email"
                  placeholder="abel@example.com"
                  value={identifier}
                  onChangeText={onIdentifierChange}
                  error={identifierError}
                  editable={!isPending}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  leftSlot={<MailIcon />}
                />
              ) : (
                <TextField
                  label="Phone number"
                  placeholder="91 234 5678"
                  value={identifier}
                  onChangeText={onIdentifierChange}
                  error={identifierError}
                  editable={!isPending}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  leftSlot={
                    <Text variant="body" tone="secondary" weight="semibold">
                      +251
                    </Text>
                  }
                />
              )}

              <TextField
                label="Password"
                value={password}
                onChangeText={onPasswordChange}
                error={passwordError}
                editable={!isPending}
                secureTextEntry
                revealable
                textContentType="password"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                labelAction={{
                  label: 'Forgot?',
                  onPress: () => router.push('/(auth)/forgot-password'),
                }}
                leftSlot={<LockIcon />}
              />

              <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            </View>
          </View>
        </View>

        {/* Precise gap under Remember me — leftover height sits below the footer. */}
        <View style={styles.ctaGap} />

        <View style={styles.footer}>
          {notice ? <FormMessage tone={notice.tone} message={notice.message} /> : null}
          <Button
            label="Log In to TemariHub"
            accessibilityLabel={isPending ? 'Logging in' : 'Log In to TemariHub'}
            trailing={<ArrowIcon />}
            loading={isPending}
            onPress={onSubmit}
            style={styles.submit}
          />
          <View style={styles.switchRow}>
            <Text variant="body" tone="muted">
              New here?
            </Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={tokens.size.hitSlop}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text variant="body" tone="brand" weight="bold">
                Create free account
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.fill} />
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
    paddingBottom: tokens.space[4],
  },
  contentKeyboard: {
    paddingBottom: tokens.space[8],
  },
  top: {
    width: '100%',
  },
  header: {
    paddingTop: tokens.space[5],
    gap: tokens.space[4],
  },
  main: {
    width: '100%',
    gap: tokens.space[3],
    paddingTop: tokens.space[4],
  },
  mainCompact: {
    gap: tokens.space[2],
    paddingTop: tokens.space[3],
  },
  form: {
    width: '100%',
    gap: tokens.space[3],
  },
  /** Remember me → Log In — fixed, not stretched by tall phones. */
  ctaGap: {
    height: tokens.space[5],
  },
  fill: {
    flexGrow: 1,
    minHeight: tokens.space[2],
  },
  footer: {
    width: '100%',
    gap: tokens.space[3],
  },
  submit: {
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[1.5],
  },
});
