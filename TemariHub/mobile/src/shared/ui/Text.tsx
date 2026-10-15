import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { fonts, tokens, type FontWeightName, type TypographyVariant } from '@/shared/theme';

const weightToFamily: Record<FontWeightName, string> = {
  regular: fonts.sans.regular,
  medium: fonts.sans.medium,
  semibold: fonts.sans.semibold,
  bold: fonts.sans.bold,
  extrabold: fonts.sans.extrabold,
};

const variantWeight: Record<TypographyVariant, FontWeightName> = {
  display: 'extrabold',
  title: 'bold',
  body: 'regular',
  label: 'bold',
  caption: 'bold',
};

export type TextTone =
  'primary' | 'secondary' | 'muted' | 'placeholder' | 'strong' | 'inverse' | 'brand' | 'danger';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
  weight?: FontWeightName;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
};

const toneColor: Record<TextTone, string> = {
  primary: tokens.color.text.primary,
  secondary: tokens.color.text.secondary,
  muted: tokens.color.text.muted,
  placeholder: tokens.color.text.placeholder,
  strong: tokens.color.text.strong,
  inverse: tokens.color.text.inverse,
  brand: tokens.color.text.brand,
  danger: tokens.color.state.danger,
};

export function Text({
  variant = 'body',
  tone = 'primary',
  weight,
  align,
  uppercase = false,
  style,
  children,
  ...rest
}: TextProps) {
  const family = weightToFamily[weight ?? variantWeight[variant]];
  const type = tokens.typography[variant];

  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: family,
          fontSize: type.fontSize,
          lineHeight: type.lineHeight,
          letterSpacing: type.letterSpacing,
          color: toneColor[tone],
          textAlign: align,
          textTransform: uppercase ? 'uppercase' : undefined,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
