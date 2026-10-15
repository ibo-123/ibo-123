/**
 * Font family names registered with expo-font (`@expo-google-fonts/inter`).
 * Map weight → family in Text; custom fonts ignore RN fontWeight on most platforms.
 */
export const fonts = {
  sans: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
} as const;

export type Fonts = typeof fonts;
export type FontWeightName = keyof typeof fonts.sans;
