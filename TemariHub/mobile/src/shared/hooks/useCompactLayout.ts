import { useWindowDimensions } from 'react-native';

/**
 * Auth height budget tiers (MOB-10 one-view rule).
 * Compact phones drop badge/subtitle/feature card so the Log In CTA stays on-screen.
 */
export type LayoutDensity = 'compact' | 'regular' | 'roomy';

export type CompactLayout = {
  density: LayoutDensity;
  isCompact: boolean;
  windowHeight: number;
  showBadge: boolean;
  showSubtitle: boolean;
  showFeatureCard: boolean;
};

export function useCompactLayout(): CompactLayout {
  const { height } = useWindowDimensions();

  const density: LayoutDensity = height < 700 ? 'compact' : height < 780 ? 'regular' : 'roomy';

  return {
    density,
    isCompact: density === 'compact',
    windowHeight: height,
    showBadge: density !== 'compact',
    showSubtitle: density !== 'compact',
    showFeatureCard: density === 'roomy',
  };
}
