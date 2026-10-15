import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { fonts, tokens } from '@/shared/theme';

import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  /** Muted trailing label copy (e.g. Sign Up password “Min. 8 chars”). */
  labelHint?: string;
  labelAction?: { label: string; onPress: () => void };
  /** Inline action under an error (e.g. PHONE_TAKEN → “Log in instead”). */
  errorAction?: { label: string; onPress: () => void };
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  /** Built-in show/hide control for password fields. */
  revealable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  hint,
  labelHint,
  labelAction,
  errorAction,
  leftSlot,
  rightSlot,
  revealable = false,
  secureTextEntry,
  containerStyle,
  editable = true,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(error);
  const isSecure = Boolean(secureTextEntry) && !revealed;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
        {labelAction ? (
          <Pressable
            accessibilityRole="link"
            hitSlop={tokens.size.hitSlop}
            onPress={labelAction.onPress}
          >
            <Text variant="label" tone="brand">
              {labelAction.label}
            </Text>
          </Pressable>
        ) : labelHint ? (
          <Text variant="caption" tone="muted" weight="medium">
            {labelHint}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.field,
          focused && !hasError ? styles.fieldFocused : undefined,
          hasError ? styles.fieldError : undefined,
          !editable ? styles.fieldDisabled : undefined,
        ]}
      >
        {leftSlot ? <View style={styles.leftSlot}>{leftSlot}</View> : null}
        <TextInput
          {...inputProps}
          editable={editable}
          secureTextEntry={isSecure}
          placeholderTextColor={tokens.color.text.placeholder}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={[
            styles.input,
            leftSlot ? styles.inputWithLeft : undefined,
            revealable || rightSlot ? styles.inputWithRight : undefined,
          ]}
        />
        {revealable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={tokens.size.hitSlop}
            onPress={() => setRevealed((value) => !value)}
            style={styles.reveal}
          >
            <Text variant="caption" tone="strong" weight="bold">
              {revealed ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        ) : rightSlot ? (
          <View style={styles.rightSlot}>{rightSlot}</View>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorBlock}>
          <Text variant="label" tone="danger">
            {error}
          </Text>
          {errorAction ? (
            <Pressable
              accessibilityRole="link"
              hitSlop={tokens.size.hitSlop}
              onPress={errorAction.onPress}
            >
              <Text variant="label" tone="brand" weight="bold">
                {errorAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : hint ? (
        <Text variant="label" tone="muted" weight="regular">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.space[1.5],
    width: '100%',
  },
  errorBlock: {
    gap: tokens.space[1],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[1],
  },
  field: {
    minHeight: tokens.size.control,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
    backgroundColor: tokens.color.surface.raised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
  },
  fieldFocused: {
    borderColor: tokens.color.border.strong,
  },
  fieldError: {
    borderColor: tokens.color.state.danger,
  },
  fieldDisabled: {
    opacity: tokens.opacity.disabled,
    backgroundColor: tokens.color.surface.muted,
  },
  leftSlot: {
    marginRight: tokens.space[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    marginLeft: tokens.space[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: tokens.size.control,
    fontFamily: fonts.sans.regular,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    color: tokens.color.text.primary,
    paddingVertical: tokens.space[3.5],
  },
  inputWithLeft: {
    paddingLeft: 0,
  },
  inputWithRight: {
    paddingRight: tokens.space[2],
  },
  reveal: {
    backgroundColor: tokens.color.surface.subtle,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[1],
  },
});
