import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { BookCard } from '../../components/books/BookCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingIndicator } from '../../components/feedback/LoadingIndicator';
import { ReadingTimerPill } from '../../components/common/ReadingTimerPill';
import { useHistory } from '../../hooks/useStorage';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export default function HistoryScreen() {
  const { history, loading, refreshHistory, clearHistory } = useHistory();
  const { colors, neuBorder, neuShadowSm } = useTheme();

  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  const handleClearHistory = () => {
    const confirmMsg = 'Are you sure you want to clear your reading history? Saved library books will remain intact.';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        clearHistory();
      }
    } else {
      Alert.alert('Clear History', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]);
    }
  };

  const handlePressHistoryItem = (item) => {
    router.push({
      pathname: '/reader/[id]',
      params: {
        id: item.id,
        initialChapter: item.lastReadChapter || 1,
        initialPage: item.lastReadPage || 1,
      },
    });
  };

  const rightAction = (
    <View style={styles.headerRightGroup}>
      <ReadingTimerPill forceShow={true} />
      {history.length > 0 && (
        <TouchableOpacity
          onPress={handleClearHistory}
          style={[
            styles.clearButton,
            { backgroundColor: colors.coral, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Clear history"
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={15} color="#171717" />
          <Text style={styles.clearText}>CLEAR</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }) => (
      <BookCard
        book={item}
        layout="list"
        onPress={() => handlePressHistoryItem(item)}
      />
    ),
    []
  );

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title="READING LOG"
        subtitle="Chronological record of books and chapters"
        rightAction={rightAction}
      />

      {history.length > 0 && (
        <View style={styles.summaryBar}>
          <View
            style={[
              styles.summaryBadge,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              neuBorder,
            ]}
          >
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {history.length} BOOK{history.length === 1 ? '' : 'S'} IN PROGRESS
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        disableVirtualization={Platform.OS === 'web'}
        maxToRenderPerBatch={10}
        windowSize={11}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        style={styles.flatList}
        ListEmptyComponent={
          loading ? (
            <LoadingIndicator message="Loading reading log..." />
          ) : (
            <EmptyState
              icon="time"
              title="NO HISTORY YET"
              message="Novels and comics you open will automatically track here with chapter and page bookmarks."
              action={
                <TouchableOpacity
                  style={[
                    styles.exploreButton,
                    { backgroundColor: colors.yellow, borderColor: colors.border },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.exploreButtonText}>EXPLORE CATALOG</Text>
                </TouchableOpacity>
              }
            />
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        overflowY: 'auto',
      },
      default: {},
    }),
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  clearText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: SPACING.xxl + 24,
  },
  summaryBar: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  summaryText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  exploreButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  exploreButtonText: {
    color: '#171717',
    fontWeight: '900',
    letterSpacing: 0.5,
    fontSize: 12,
  },
});
