import { useWindowDimensions, Platform } from 'react-native';
import { BREAKPOINTS, MAX_CONTENT_WIDTH } from '../constants/layout';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isLargeDesktop = width >= 1200;

  // Stable book grid columns based on screen width:
  // Desktop wide (>=1300px): 5 columns
  // Desktop standard (>=1024px): 4 columns
  // Tablet (768px - 1023px): 3 columns
  // Mobile (<768px): 2 columns (rock-solid, no 1-pixel scrollbar threshold bounce)
  let bookColumns = 2;
  if (width >= 1300) {
    bookColumns = 5;
  } else if (width >= BREAKPOINTS.desktop) {
    bookColumns = 4;
  } else if (width >= BREAKPOINTS.tablet) {
    bookColumns = 3;
  } else {
    bookColumns = 2;
  }

  // Clamped content width for large screens so desktop web looks elegant and centered
  const containerWidth = Math.min(width, MAX_CONTENT_WIDTH);

  return {
    width,
    height,
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    bookColumns,
    containerWidth,
  };
}

