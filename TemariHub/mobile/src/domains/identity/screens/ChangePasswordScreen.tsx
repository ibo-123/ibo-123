import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { tokens } from '@/shared/theme';
import { Button, IconButton, Screen, Text, TextField } from '@/shared/ui';

import { FormMessage, type FormMessageTone } from '../components/FormMessage';
import { ChevronLeftIcon } from '../components/ProfileIcons';
import { LockIcon } from '../components/AuthIcons';
import {
  describeChangePasswordError,
  useChangePassword,
} from '../hooks/useChangePassword';

const MIN_PASSWORD_LENGTH = 8;
const PROFILE_CANVAS = '#FAF8FF';

type FormNotice = { tone: FormMessageTone; message: string };

/**
 * Change password — current → new → confirm.
 * Inline contract errors (WEAK_PASSWORD, wrong current, mismatch).
 */
export function ChangePasswordScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { submit, isPending } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentError, setCurrentError] = useState<string>();
  const [newError, setNewError] = useState<string>();
  const [confirmError, setConfirmError] = useState<string>();
  const [notice, setNotice] = useState<FormNotice>();

  const enter = (delay: number) =>
    reduceMotion ? undefined : FadeInDown.duration(tokens.motion.enter).delay(delay);

  const clearFieldErrors = () => {
    setCurrentError(undefined);
    setNewError(undefined);
    setConfirmError(undefined);
    setNotice(undefined);
  };

  const onSubmit = async () => {
    if (isPending) {
      return;
    }

    const nextCurrent = currentPassword ? undefined : 'Enter your current password.';
    const nextNew = !newPassword
      ? 'Enter a new password.'
      : newPassword.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : undefined;
    const nextConfirm = !confirmPassword
      ? 'Confirm your new password.'
      : confirmPassword !== newPassword
        ? 'Passwords do not match.'
        : undefined;

    setCurrentError(nextCurrent);
    setNewError(nextNew);
    setConfirmError(nextConfirm);
    setNotice(undefined);

    if (nextCurrent || nextNew || nextConfirm) {
      return;
    }

    Keyboard.dismiss();

    try {
      const result = await submit({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      if (!result) {
        return;
      }
      setNotice({ tone: 'info', message: 'Password updated. You’re still signed in.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        }
      }, 700);
    } catch (error) {
      const view = describeChangePasswordError(error);
      if (view.field === 'current_password') {
        setCurrentError(view.message);
      } else if (view.field === 'new_password') {
        setNewError(view.message);
      } else if (view.field === 'new_password_confirm') {
        setConfirmError(view.message);
      } else {
        setNotice({ tone: 'error', message: view.message });
      }
    }
  };

  return (
    <Screen padded={false} style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)} style={styles.header}>
          <IconButton
            accessibilityLabel="Back to profile"
            variant="outline"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(app)/(tabs)/me');
              }
            }}
            style={styles.backButton}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Text variant="title" tone="primary" weight="extrabold" style={styles.headerTitle}>
            Password
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.View entering={enter(80)} style={styles.intro}>
          <Text variant="display" tone="primary" weight="extrabold">
            Change password
          </Text>
          <Text variant="body" tone="secondary">
            Use your current password, then pick a stronger new one. We’ll keep you signed in on
            this device.
          </Text>
        </Animated.View>

        <Animated.View entering={enter(140)} style={styles.form}>
          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              clearFieldErrors();
            }}
            error={currentError}
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            leftSlot={<LockIcon />}
            returnKeyType="next"
          />
          <TextField
            label="New password"
            labelHint={`Min. ${MIN_PASSWORD_LENGTH} chars`}
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              clearFieldErrors();
            }}
            error={newError}
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            leftSlot={<LockIcon />}
            returnKeyType="next"
          />
          <TextField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearFieldErrors();
            }}
            error={confirmError}
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            leftSlot={<LockIcon />}
            returnKeyType="done"
            onSubmitEditing={() => {
              void onSubmit();
            }}
          />

          {notice ? <FormMessage tone={notice.tone} message={notice.message} /> : null}

          <Button
            label="Update password"
            onPress={() => {
              void onSubmit();
            }}
            loading={isPending}
            style={styles.submit}
          />

          <Pressable
            accessibilityRole="link"
            hitSlop={tokens.size.hitSlop}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              }
            }}
            style={styles.cancel}
          >
            <Text variant="label" tone="brand" align="center">
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
    paddingTop: tokens.space[6],
    paddingBottom: tokens.space[6],
  },
  backButton: {
    width: tokens.size.control,
    height: tokens.size.control,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface.raised,
    ...tokens.shadow.soft,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: tokens.size.control,
  },
  intro: {
    gap: tokens.space[2],
    marginBottom: tokens.space[8],
  },
  form: {
    gap: tokens.space[4],
  },
  submit: {
    marginTop: tokens.space[2],
  },
  cancel: {
    paddingVertical: tokens.space[3],
  },
});
