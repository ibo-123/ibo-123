import { useState, type ReactNode } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useCompactLayout, useKeyboardVisible } from '@/shared/hooks';
import { toEthiopianE164 } from '@/shared/lib';
import { tokens } from '@/shared/theme';
import { Button, Checkbox, Screen, SegmentedToggle, Text, TextField } from '@/shared/ui';

import { AuthHeader } from '../components/AuthHeader';
import { ArrowIcon, LockIcon, MailIcon, UserIcon } from '../components/AuthIcons';
import { FeaturePromoCard } from '../components/FeaturePromoCard';
import { FormMessage, type FormMessageTone } from '../components/FormMessage';
import { SocialRow } from '../components/SocialRow';
import { StreamPicker } from '../components/StreamPicker';
import { describeRegisterError, useRegister } from '../hooks/useRegister';
import { LIVE_ONBOARDING_TRACK, type OnboardingStream } from '../onboardingTrack';
import { useSessionStore } from '../session.store';

type AuthMethod = 'phone' | 'email';

/** Phone default — same as login. Option order matches Figma `73:288` (Email | Phone Number). */
const METHOD_OPTIONS = [
  { label: 'Email', value: 'email' as const },
  { label: 'Phone Number', value: 'phone' as const },
] as const;

const MIN_PASSWORD_LENGTH = 8;

type FormNotice = { tone: FormMessageTone; message: string };

/**
 * Figma Sign Up compact frame `73:288` — Google + Apple, then Email | Phone Number.
 * Exam track lives on onboarding. Phone register is the live path.
 */
export function SignUpScreen() {
  const router = useRouter();
  const keyboardVisible = useKeyboardVisible();
  const { density } = useCompactLayout();
  const { submit, isPending } = useRegister();

  const showPromo = !keyboardVisible && density === 'roomy';
  const showBadge = density === 'roomy';

  const setPreferredStream = useSessionStore((state) => state.setPreferredStream);
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [stream, setStream] = useState<OnboardingStream>(LIVE_ONBOARDING_TRACK.stream);
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [fullNameError, setFullNameError] = useState<string>();
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [termsError, setTermsError] = useState<string>();
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [notice, setNotice] = useState<FormNotice>();

  const activeMethod: AuthMethod = method;
  const isEmail = activeMethod === 'email';

  const clearNotice = () => setNotice(undefined);

  const onFullNameChange = (value: string) => {
    setFullName(value);
    setFullNameError(undefined);
    clearNotice();
  };

  const onIdentifierChange = (value: string) => {
    setIdentifier(value);
    setIdentifierError(undefined);
    setPhoneTaken(false);
    clearNotice();
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(undefined);
    clearNotice();
  };

  const onTermsChange = (next: boolean) => {
    setAcceptedTerms(next);
    setTermsError(undefined);
    clearNotice();
  };

  const onSocialPress = (provider: 'Google' | 'Apple') => {
    setNotice({
      tone: 'info',
      message: `${provider} sign-up is coming soon. Use your phone number.`,
    });
  };

  const onStreamChange = (next: OnboardingStream) => {
    setStream(next);
    setPreferredStream(next);
    clearNotice();
  };

  const onMethodChange = (next: AuthMethod) => {
    setMethod(next);
    setIdentifier('');
    setIdentifierError(undefined);
    setPhoneTaken(false);
    clearNotice();
  };

  const goToLogin = () => router.push('/(auth)/login');

  const onSubmit = async () => {
    if (isPending) {
      return;
    }

    const nextFullNameError = fullName.trim() ? undefined : 'Enter your full name.';

    let nextIdentifierError: string | undefined;
    let phoneNumber: string | null = null;
    if (isEmail) {
      nextIdentifierError = identifier.trim() ? undefined : 'Enter your email address.';
    } else {
      phoneNumber = toEthiopianE164(identifier);
      nextIdentifierError = !identifier.trim()
        ? 'Enter your phone number.'
        : phoneNumber
          ? undefined
          : 'Enter a valid Ethiopian mobile number, like 91 234 5678.';
    }

    const nextPasswordError = !password
      ? 'Enter a password.'
      : password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : undefined;
    const nextTermsError = acceptedTerms
      ? undefined
      : 'Agree to the Terms & Privacy Policy to continue.';

    setFullNameError(nextFullNameError);
    setIdentifierError(nextIdentifierError);
    setPasswordError(nextPasswordError);
    setTermsError(nextTermsError);
    setPhoneTaken(false);
    setNotice(undefined);

    if (nextFullNameError || nextIdentifierError || nextPasswordError || nextTermsError) {
      return;
    }

    if (isEmail) {
      setNotice({ tone: 'info', message: 'Email sign-up is coming soon. Use your phone number.' });
      return;
    }

    if (!phoneNumber) {
      return;
    }

    Keyboard.dismiss();

    try {
      const outcome = await submit({
        phone_number: phoneNumber,
        password,
        password_confirm: password,
        full_name: fullName.trim(),
      });
      // Pending phone is stored; the gate opens Verify (and restores it after a kill).
      if (!outcome) {
        return;
      }
    } catch (error) {
      const view = describeRegisterError(error);
      if (view.field === 'phone_number') {
        setIdentifierError(view.message);
        setPhoneTaken(Boolean(view.showLoginInstead));
      } else if (view.field === 'password') {
        setPasswordError(view.message);
      } else if (view.field === 'full_name') {
        setFullNameError(view.message);
      } else {
        setNotice({ tone: 'error', message: view.message });
      }
    }
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <AuthHeader
            title="Start your journey."
            showBadge={showBadge}
            badgeLabel="2017 E.C. MATRIC"
          />

          <View style={styles.main}>
            <SocialRow
              onGooglePress={() => onSocialPress('Google')}
              onApplePress={() => onSocialPress('Apple')}
            />

            <SegmentedToggle
              options={METHOD_OPTIONS}
              value={activeMethod}
              onChange={onMethodChange}
            />

            <StreamPicker value={stream} onChange={onStreamChange} disabled={isPending} />

            <View style={styles.form}>
              <TextField
                label="Full Name"
                placeholder="Abel Kebede"
                value={fullName}
                onChangeText={onFullNameChange}
                error={fullNameError}
                editable={!isPending}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                autoComplete="name"
                leftSlot={<UserIcon />}
              />

              {isEmail ? (
                <TextField
                  label="Email Address"
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
                  errorAction={
                    phoneTaken ? { label: 'Log in instead', onPress: goToLogin } : undefined
                  }
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
                placeholder="••••••••"
                value={password}
                onChangeText={onPasswordChange}
                error={passwordError}
                editable={!isPending}
                labelHint="Min. 8 chars"
                secureTextEntry
                revealable
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                leftSlot={<LockIcon />}
              />

              <View style={styles.termsBlock}>
                <Checkbox
                  checked={acceptedTerms}
                  onChange={onTermsChange}
                  disabled={isPending}
                  label={<TermsLabel />}
                />
                {termsError ? (
                  <Text variant="label" tone="danger">
                    {termsError}
                  </Text>
                ) : null}
              </View>

              {notice ? <FormMessage tone={notice.tone} message={notice.message} /> : null}
            </View>
          </View>

          <View style={styles.fill} />
        </ScrollView>

        <View style={styles.actionBar}>
          <Button
            label="Create My Account"
            accessibilityLabel={isPending ? 'Creating account' : 'Create My Account'}
            trailing={<ArrowIcon />}
            loading={isPending}
            onPress={onSubmit}
            style={styles.submit}
          />

          <View style={styles.switchRow}>
            <Text variant="body" tone="muted">
              Already have an account?
            </Text>
            <Pressable accessibilityRole="link" hitSlop={tokens.size.hitSlop} onPress={goToLogin}>
              <Text variant="body" tone="brand" weight="bold">
                Log In
              </Text>
            </Pressable>
          </View>

          {showPromo ? (
            <FeaturePromoCard
              compact
              title="Free Diagnostic Included"
              description="Find weak spots fast — then focus your study."
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function TermsLabel(): ReactNode {
  return (
    <Text variant="label" tone="secondary" weight="regular" style={styles.termsCopy}>
      I agree to the{' '}
      <Text variant="label" tone="brand" weight="bold">
        Terms
      </Text>
      {' & '}
      <Text variant="label" tone="brand" weight="bold">
        Privacy Policy
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.color.surface.raised,
  },
  shell: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: tokens.space[6],
    paddingBottom: tokens.space[3],
  },
  main: {
    width: '100%',
    gap: tokens.space[3],
    paddingTop: tokens.space[3],
  },
  form: {
    width: '100%',
    gap: tokens.space[3],
  },
  fill: {
    flexGrow: 1,
    minHeight: tokens.space[2],
  },
  termsBlock: {
    width: '100%',
    gap: tokens.space[1],
  },
  termsCopy: {
    flexShrink: 1,
    paddingTop: tokens.space[0.5],
  },
  actionBar: {
    width: '100%',
    gap: tokens.space[2],
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[1.5],
  },
});
