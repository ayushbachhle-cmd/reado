import { Platform } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
};

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

export const MAX_CONTENT_WIDTH = 1120;

// Neubrutalism Design System: Core Style Primitives
export const NEU_BORDER = {
  borderWidth: 2,
  borderColor: '#171717',
};

export const NEU_BORDER_THICK = {
  borderWidth: 2.5,
  borderColor: '#171717',
};

export const NEU_SHADOW_SM = Platform.select({
  web: {
    boxShadow: '2px 2px 0px #171717',
  },
  default: {
    shadowColor: '#171717',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
});

export const NEU_SHADOW = Platform.select({
  web: {
    boxShadow: '3px 3px 0px #171717',
  },
  default: {
    shadowColor: '#171717',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});

export const NEU_SHADOW_LG = Platform.select({
  web: {
    boxShadow: '4px 4px 0px #171717',
  },
  default: {
    shadowColor: '#171717',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
});
