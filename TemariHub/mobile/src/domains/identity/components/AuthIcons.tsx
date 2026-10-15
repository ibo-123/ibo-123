import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { tokens } from '@/shared/theme';

const logoSource = require('../../../../assets/images/auth/temarihub-logo.png');
const googleSource = require('../../../../assets/images/auth/google.png');

/** TemariHub wordmark + mark from Figma Log In `73:4` (62×40). */
export function TemariLogo({ height = 40 }: { height?: number }) {
  const width = Math.round(height * (62 / 40));
  return (
    <Image
      source={logoSource}
      accessibilityLabel="TemariHub"
      style={{ width, height }}
      resizeMode="contain"
    />
  );
}

export function GoogleMark({ size = tokens.size.icon }: { size?: number }) {
  return (
    <Image
      source={googleSource}
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

/** Apple mark — exact Figma path (`73:37`), root 16×20 preserved. */
export function AppleMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
        <Path
          d="M13.1125 10.2625C13.1042 8.73333 13.7958 7.57917 15.1958 6.72916C14.4125 5.60833 13.2291 4.99167 11.6667 4.87084C10.1875 4.75417 8.57084 5.73333 7.97917 5.73333C7.35417 5.73333 5.92083 4.9125 4.79583 4.9125C2.47084 4.94999 -4.17233e-07 6.76667 -4.17233e-07 10.4625C-4.17233e-07 11.5541 0.2 12.6819 0.6 13.8459C1.13333 15.375 3.05834 19.125 5.06667 19.0625C6.11667 19.0375 6.85834 18.3167 8.225 18.3167C9.54999 18.3167 10.2375 19.0625 11.4083 19.0625C13.4333 19.0334 15.175 15.625 15.6833 14.0916C12.9666 12.8125 13.1125 10.3417 13.1125 10.2625ZM10.7541 3.42083C11.8916 2.07084 11.7875 0.841666 11.7541 0.399999C10.75 0.458333 9.5875 1.08333 8.925 1.85416C8.19583 2.67917 7.76667 3.7 7.85834 4.85C8.94583 4.93333 9.9375 4.375 10.7541 3.42083Z"
          fill={tokens.color.text.primary}
        />
      </Svg>
    </View>
  );
}

/** Grade 12 Prep badge bolt — Figma 8×10 teal fill. */
export function BoltIcon() {
  return (
    <View style={styles.bolt} accessibilityElementsHidden>
      <View style={styles.boltCore} />
    </View>
  );
}

/** Full name field leading icon — Figma Sign Up `73:338`, root 12.25×14 preserved. */
export function UserIcon() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={12.25} height={14} viewBox="0 0 12.25 14" fill="none">
        <Path
          d="M6.125 7C7.05326 7 7.9435 6.63125 8.59987 5.97487C9.25625 5.3185 9.625 4.42826 9.625 3.5C9.625 2.57174 9.25625 1.6815 8.59987 1.02513C7.9435 0.368749 7.05326 0 6.125 0C5.19674 0 4.3065 0.368749 3.65013 1.02513C2.99375 1.6815 2.625 2.57174 2.625 3.5C2.625 4.42826 2.99375 5.3185 3.65013 5.97487C4.3065 6.63125 5.19674 7 6.125 7ZM4.87539 8.3125C2.18203 8.3125 0 10.4945 0 13.1879C0 13.6363 0.363672 14 0.812109 14H11.4379C11.8863 14 12.25 13.6363 12.25 13.1879C12.25 10.4945 10.068 8.3125 7.37461 8.3125H4.87539Z"
          fill={tokens.color.text.secondary}
        />
      </Svg>
    </View>
  );
}

/** Email field leading icon — Figma 16×12. */
export function MailIcon() {
  return (
    <View style={styles.mail} accessibilityElementsHidden>
      <View style={styles.mailFlap} />
    </View>
  );
}

/** Password field leading icon — Figma 14×16. */
export function LockIcon() {
  return (
    <View style={styles.lock} accessibilityElementsHidden>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody}>
        <View style={styles.lockKeyhole} />
      </View>
    </View>
  );
}

/** Primary CTA trailing arrow — Figma 12×12 white. */
export function ArrowIcon() {
  return (
    <View style={styles.arrow} accessibilityElementsHidden>
      <View style={styles.arrowShaft} />
      <View style={styles.arrowHead} />
    </View>
  );
}

/** Feature card mark — Figma 20×20. */
export function FeatureBoltIcon() {
  return (
    <View style={styles.featureBolt} accessibilityElementsHidden>
      <View style={styles.featureRing}>
        <View style={styles.featureCore} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bolt: {
    width: 8,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boltCore: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: tokens.color.brand.teal,
  },
  mail: {
    width: 16,
    height: 12,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.text.secondary,
    borderRadius: tokens.space[0.5],
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  mailFlap: {
    width: 12,
    height: 12,
    borderWidth: tokens.stroke.thin,
    borderColor: tokens.color.text.secondary,
    transform: [{ rotate: '45deg' }, { translateY: -6 }],
    alignSelf: 'center',
  },
  lock: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockShackle: {
    width: 8,
    height: 6,
    borderWidth: tokens.stroke.thick,
    borderBottomWidth: 0,
    borderColor: tokens.color.text.secondary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: -1,
  },
  lockBody: {
    width: 14,
    height: 10,
    borderRadius: tokens.space[0.5],
    backgroundColor: tokens.color.text.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockKeyhole: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: tokens.color.surface.raised,
  },
  arrow: {
    width: 12,
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowShaft: {
    width: 8,
    height: tokens.stroke.thick,
    backgroundColor: tokens.color.text.inverse,
  },
  arrowHead: {
    width: 0,
    height: 0,
    marginLeft: -2,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: tokens.color.text.inverse,
  },
  featureBolt: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: tokens.stroke.thick,
    borderColor: tokens.color.brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCore: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: tokens.color.brand.teal,
  },
});
