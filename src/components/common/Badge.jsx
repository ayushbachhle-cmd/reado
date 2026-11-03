import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function Badge({
  label,
  variant = 'default',
  size = 'medium',
  style,
}) {
  const { colors, neuShadowSm } = useTheme();

  const getBadgeColors = () => {
    switch (variant) {
      case 'novel':
        return { bg: colors.sky, text: '#171717' };
      case 'comic':
        return { bg: colors.lavender, text: '#171717' };
      case 'status':
      case 'success':
        return { bg: colors.mint, text: '#171717' };
      case 'primary':
      case 'yellow':
        return { bg: colors.yellow, text: '#171717' };
      case 'coral':
      case 'danger':
        return { bg: colors.coral, text: '#171717' };
      default:
        return { bg: colors.surface, text: colors.text };
    }
  };

  const { bg, text } = getBadgeColors();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: colors.border,
        },
        neuShadowSm,
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <Text
        style={[
          TYPOGRAPHY.sticker,
          { color: text },
          isSmall && styles.textSmall,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
  },
  textSmall: {
    fontSize: 9,
    lineHeight: 12,
  },
});
