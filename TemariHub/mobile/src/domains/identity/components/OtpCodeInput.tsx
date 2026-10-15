import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { fonts, tokens } from '@/shared/theme';

const LENGTH = 6;

export type OtpCodeInputProps = {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
};

/**
 * Six digit boxes with SMS autofill (Expo Go).
 * First cell owns `sms-otp` / `oneTimeCode`; paste/autofill fills all six.
 */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
}: OtpCodeInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, index) => value[index] ?? '');

  const commit = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, LENGTH);
    onChange(cleaned);
    if (cleaned.length === LENGTH) {
      onComplete?.(cleaned);
    }
  };

  const onChangeAt = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      commit(cleaned);
      const focusIndex = Math.min(cleaned.length, LENGTH) - 1;
      refs.current[focusIndex]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    const next = nextDigits.join('').replace(/\s/g, '');
    commit(next);

    if (cleaned && index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const onKeyPressAt = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }
    if (digits[index]) {
      return;
    }
    if (index > 0) {
      refs.current[index - 1]?.focus();
      commit(value.slice(0, index - 1));
    }
  };

  return (
    <View style={styles.row} accessibilityRole="none">
      {digits.map((digit, index) => (
        <Pressable
          key={index}
          disabled={disabled}
          onPress={() => refs.current[index]?.focus()}
          style={[
            styles.box,
            digit ? styles.boxFilled : undefined,
            error ? styles.boxError : undefined,
            disabled ? styles.boxDisabled : undefined,
          ]}
        >
          <TextInput
            ref={(node) => {
              refs.current[index] = node;
            }}
            value={digit}
            onChangeText={(text) => onChangeAt(index, text)}
            onKeyPress={(event) => onKeyPressAt(index, event)}
            editable={!disabled}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? 'sms-otp' : 'off'}
            maxLength={index === 0 ? LENGTH : 1}
            selectTextOnFocus
            caretHidden
            style={styles.input}
            accessibilityLabel={`Digit ${index + 1} of ${LENGTH}`}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.space[2],
  },
  box: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    maxWidth: 52,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.border.default,
    backgroundColor: tokens.color.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: tokens.color.brand.teal,
    borderWidth: tokens.stroke.thick,
  },
  boxError: {
    borderColor: tokens.color.state.danger,
  },
  boxDisabled: {
    opacity: tokens.opacity.disabled,
    backgroundColor: tokens.color.surface.muted,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: fonts.sans.bold,
    fontSize: tokens.typography.title.fontSize,
    lineHeight: tokens.typography.title.lineHeight,
    color: tokens.color.text.primary,
    padding: 0,
  },
});
