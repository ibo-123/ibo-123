import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { tokens } from '@/shared/theme';

type IconProps = {
  color?: string;
  size?: number;
};

/** Back chevron — Figma profile header. */
export function ChevronLeftIcon({ color = tokens.color.text.primary, size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M10.5 3.5L6 8l4.5 4.5"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function ChevronRightIcon({ color = tokens.color.text.placeholder, size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M5.5 3.5L10 8l-4.5 4.5"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function CheckBadgeIcon({ color = tokens.color.text.inverse, size = 10 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
        <Path
          d="M2 5.2L4.1 7.3L8 2.8"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function LockRowIcon({ color = tokens.color.brand.teal, size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M4.5 7V5.5a3.5 3.5 0 017 0V7M4 7h8a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 0112 15H4a1.5 1.5 0 01-1.5-1.5v-5A1.5 1.5 0 014 7z"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function ShieldIcon({ color = '#EF4444', size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M8 1.5l5 2v4.2c0 3.1-2.1 5.5-5 6.3-2.9-.8-5-3.2-5-6.3V3.5l5-2z"
          stroke={color}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function KeyIcon({ color = tokens.color.brand.teal, size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M9.5 7.2a3.25 3.25 0 11-1.6-2.45L14 4.5v2.2h-1.5V8H11V6.6L9.5 7.2z"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function PhoneRowIcon({ color = tokens.color.brand.teal, size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M5.2 2.5h5.6c.7 0 1.2.5 1.2 1.2v8.6c0 .7-.5 1.2-1.2 1.2H5.2c-.7 0-1.2-.5-1.2-1.2V3.7c0-.7.5-1.2 1.2-1.2zM8 11.5h.01"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function LogoutIcon({ color = '#EF4444', size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M6 3H3.75A1.75 1.75 0 002 4.75v6.5C2 12.216 2.784 13 3.75 13H6M10.5 11.5L14 8l-3.5-3.5M14 8H6"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function CapIcon({ color = tokens.color.brand.teal, size = 16 }: IconProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M1.5 6.5L8 3l6.5 3.5L8 10 1.5 6.5zM4 8.2v2.6c0 .9 1.8 2.2 4 2.2s4-1.3 4-2.2V8.2"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
