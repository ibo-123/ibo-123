/**
 * Design tokens from Figma Log In — TemariHub · Log In Redesign (Compact) `73:4`.
 * (Plan cites `22:1635`; that node was replaced by this compact frame.)
 *
 * Screens and shared UI read from here; raw hex / magic numbers stay out of components.
 */
export const tokens = {
  color: {
    brand: {
      teal: '#00685F',
      tealMuted: '#F0FDFA',
      tealBorder: 'rgba(0, 104, 95, 0.1)',
      tealShadow: 'rgba(0, 104, 95, 0.2)',
    },
    surface: {
      canvas: '#F9FAFB',
      raised: '#FFFFFF',
      muted: '#F3F4F6',
      subtle: '#F1F5F9',
    },
    text: {
      primary: '#131B2E',
      secondary: '#64748B',
      muted: '#6B7280',
      placeholder: '#9CA3AF',
      strong: '#374151',
      inverse: '#FFFFFF',
      brand: '#00685F',
    },
    border: {
      subtle: '#F3F4F6',
      default: '#E5E7EB',
      strong: '#00685F',
    },
    state: {
      success: '#1B7A4E',
      warning: '#B86E00',
      danger: '#B42318',
      info: '#175CD3',
    },
    overlay: 'rgba(15, 26, 23, 0.45)',
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  stroke: {
    thin: 1,
    thick: 2,
  },
  size: {
    control: 48,
    controlSm: 36,
    /** Google + Apple row — Figma Log In compact frame, 52 dp. */
    social: 52,
    icon: 20,
    iconSm: 16,
    checkbox: 20,
    /** Figma Radio Group `98:116` outer ring. */
    radio: 20,
    /** Selected fill inside the radio ring. */
    radioDot: 10,
    hitSlop: 8,
  },
  typography: {
    display: {
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.45,
      fontWeight: '800' as const,
    },
    title: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.15,
      fontWeight: '400' as const,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
      fontWeight: '700' as const,
    },
    caption: {
      fontSize: 10,
      lineHeight: 15,
      letterSpacing: 0.5,
      fontWeight: '700' as const,
    },
  },
  opacity: {
    pressed: 0.88,
    disabled: 0.45,
  },
  motion: {
    enter: 200,
    pulse: 900,
  },
  shadow: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    brand: {
      shadowColor: '#00685F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
  },
  zIndex: {
    banner: 40,
    sheet: 100,
  },
  layout: {
    sheetMaxHeight: '88%' as const,
  },
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.color;
export type TypographyVariant = keyof typeof tokens.typography;
