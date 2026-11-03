import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function LoadingIndicator({ message = 'Loading...', style }) {
  const { colors, neuBorder, neuShadowSm } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.yellow, borderColor: colors.border },
          neuBorder,
          neuShadowSm,
        ]}
      >
        <ActivityIndicator size="small" color="#171717" />
        <Text style={[TYPOGRAPHY.sticker, styles.message]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  message: {
    color: '#171717',
  },
});
