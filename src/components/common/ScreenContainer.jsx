import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { MAX_CONTENT_WIDTH, SPACING } from '../../constants/layout';
import { useResponsive } from '../../hooks/useResponsive';

export function ScreenContainer({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
}) {
  const { colors } = useTheme();
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {scrollable ? (
        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={[
            styles.scrollContent,
            isWide && styles.wideScrollContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.scrollInnerContainer,
              isWide && styles.wideInnerContainer,
              style,
            ]}
          >
            {children}
          </View>
        </ScrollView>
      ) : (
        <View
          style={[
            styles.nonScrollContainer,
            isWide && styles.wideNonScrollContainer,
            style,
          ]}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: '100%',
    width: '100%',
    ...Platform.select({
      web: {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  scrollView: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
      },
      default: {},
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  wideScrollContent: {
    alignItems: 'center',
  },
  scrollInnerContainer: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  nonScrollContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    paddingHorizontal: SPACING.md,
  },
  wideInnerContainer: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  wideNonScrollContainer: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
});
