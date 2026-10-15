import { useEffect, useState } from 'react';

/**
 * Hook to detect mobile devices and viewport size
 * Useful for conditional rendering and responsive behavior
 */
export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    // Set initial values
    const updateViewport = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    updateViewport();

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewport, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', updateViewport, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateViewport);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    viewportWidth,
  };
}

/**
 * Hook to detect if device supports touch
 */
export function useTouchSupport() {
  const [supportsTouch, setSupportsTouch] = useState(false);

  useEffect(() => {
    const hasTouch = () => {
      return (
        typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          (navigator as any).msMaxTouchPoints > 0)
      );
    };

    setSupportsTouch(hasTouch());
  }, []);

  return supportsTouch;
}

/**
 * Hook to handle safe area insets for notch devices
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        setSafeArea({
          top: parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-top') || '0'),
          right: parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-right') || '0'),
          bottom: parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-bottom') || '0'),
          left: parseInt(getComputedStyle(root).getPropertyValue('--safe-area-inset-left') || '0'),
        });
      }
    };

    updateSafeArea();
    window.addEventListener('orientationchange', updateSafeArea, { passive: true });

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * Hook to detect if device has high DPI screen (retina)
 */
export function useHighDPI() {
  const [isHighDPI, setIsHighDPI] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHighDPI(window.devicePixelRatio > 1);
    }
  }, []);

  return isHighDPI;
}
