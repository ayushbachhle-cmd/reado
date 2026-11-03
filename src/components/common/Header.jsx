import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useDrawer } from '../../context/DrawerContext';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS } from '../../constants/layout';

export function Header({
  title,
  subtitle,
  showBack = false,
  showMenu = true,
  onMenuPress,
  rightAction,
  style,
}) {
  const { colors, neuBorder, neuShadowSm } = useTheme();
  const { openDrawer } = useDrawer();

  const handleMenuPress = () => {
    if (typeof onMenuPress === 'function') {
      onMenuPress();
    } else if (typeof openDrawer === 'function') {
      openDrawer();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        {/* Left Action: Either Back Button or Hamburger Menu */}
        {showBack ? (
          <TouchableOpacity
            style={[
              styles.leftButton,
              { backgroundColor: colors.surface },
              neuBorder,
              neuShadowSm,
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity
            style={[
              styles.leftButton,
              { backgroundColor: colors.yellow },
              neuBorder,
              neuShadowSm,
            ]}
            onPress={handleMenuPress}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            {/* 3-line Neubrutalism Hamburger Icon (☰) */}
            <View style={styles.hamburgerIconBox} pointerEvents="none">
              <View style={[styles.hamburgerBar, { backgroundColor: '#171717' }]} />
              <View style={[styles.hamburgerBar, { backgroundColor: '#171717' }]} />
              <View style={[styles.hamburgerBar, { backgroundColor: '#171717' }]} />
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.textContainer}>
          <Text
            style={[TYPOGRAPHY.h1, styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                TYPOGRAPHY.caption,
                styles.subtitle,
                { color: colors.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftButton: {
    marginRight: SPACING.sm + 2,
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIconBox: {
    width: 22,
    height: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hamburgerBar: {
    width: 22,
    height: 2.5,
    borderRadius: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontWeight: '600',
  },
  rightActionContainer: {
    marginLeft: SPACING.sm,
  },
});
