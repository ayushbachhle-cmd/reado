import { Platform, StyleSheet } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: 'System',
});

export const TYPOGRAPHY = StyleSheet.create({
  display: {
    fontFamily,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -0.5,
    color: '#171717',
  },
  h1: {
    fontFamily,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.3,
    color: '#171717',
  },
  h2: {
    fontFamily,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    color: '#171717',
  },
  h3: {
    fontFamily,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    color: '#171717',
  },
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#171717',
  },
  bodyBold: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: '#171717',
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: '#4A4A4A',
  },
  captionBold: {
    fontFamily,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    letterSpacing: 0.5,
    color: '#171717',
  },
  sticker: {
    fontFamily,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
