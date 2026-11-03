import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export function EmptyState({
  icon = 'book-outline',
  title = 'No Items Found',
  message = 'There is nothing here yet.',
  action,
  style,
}) {
  const { colors, neuBorder, neuShadow } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        neuBorder,
        neuShadow,
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: colors.yellow, borderColor: colors.border },
        ]}
      >
        <Ionicons name={icon} size={36} color="#171717" />
      </View>
      <Text style={[TYPOGRAPHY.h2, styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[TYPOGRAPHY.body, styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {action ? <View style={styles.actionContainer}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.md,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 290,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: SPACING.md,
  },
});
