import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function ReadingProgressBar({
  progress = 0,
  showLabel = false,
  fillColor,
  height = 10,
  style,
}) {
  const { colors } = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const activeFill = fillColor || colors.yellow;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: activeFill,
            },
            clampedProgress > 0 &&
              clampedProgress < 100 && {
                borderRightWidth: 2,
                borderRightColor: colors.border,
              },
          ]}
        />
      </View>
      {showLabel ? (
        <View style={[styles.labelBadge, { backgroundColor: colors.border }]}>
          <Text style={[TYPOGRAPHY.sticker, styles.label, { color: colors.background }]}>
            {Math.round(clampedProgress)}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  track: {
    flex: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  labelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
  },
});
