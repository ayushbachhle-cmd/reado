import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { SearchBar } from '../../components/common/SearchBar';
import { BookCard } from '../../components/books/BookCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingIndicator } from '../../components/feedback/LoadingIndicator';
import { ReadingTimerPill } from '../../components/common/ReadingTimerPill';
import { useLibrary } from '../../hooks/useStorage';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { BOOK_CATEGORIES, SORT_OPTIONS } from '../../constants/categories';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export default function LibraryScreen() {
  const { library, loading, refreshLibrary } = useLibrary();
  const { colors, neuBorder, neuShadow, neuShadowSm } = useTheme();
  const { bookColumns, isDesktop } = useResponsive();

  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'novel' | 'comic'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortOption, setSortOption] = useState('title-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshLibrary();
    }, [refreshLibrary])
  );

  const filteredAndSortedBooks = useMemo(() => {
    let result = [...library];

    if (selectedType !== 'all') {
      result = result.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    if (selectedGenre !== 'all') {
      result = result.filter((b) =>
        b.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'rating-desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'chapters-desc':
          return (b.chaptersCount || 0) - (a.chaptersCount || 0);
        case 'progress-desc':
          return (b.progress || 0) - (a.progress || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [library, selectedType, searchQuery, selectedGenre, sortOption]);

  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortOption)?.label || 'Sort';

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }) => (
      <BookCard
        book={item}
        layout="grid"
        onPress={() =>
          router.push({
            pathname: '/book/[id]',
            params: { id: item.id },
          })
        }
      />
    ),
    []
  );

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title="SAVED LIBRARY"
        subtitle={`${filteredAndSortedBooks.length} of ${library.length} book${library.length === 1 ? '' : 's'} available offline`}
        rightAction={<ReadingTimerPill forceShow={true} />}
      />

      {/* 1. SEPARATE NOVELS & COMICS */}
      <View
        style={[
          styles.typeTabsWrapper,
          isDesktop && styles.typeTabsWrapperDesktop,
          { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
          neuBorder,
        ]}
      >
        {[
          { id: 'all', label: 'ALL BOOKS', color: colors.surface },
          { id: 'novel', label: '📖 NOVELS', color: colors.sky },
          { id: 'comic', label: '🎨 COMICS', color: colors.lavender },
        ].map((tab) => {
          const isActive = selectedType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedType(tab.id)}
              style={[
                styles.typeTab,
                isActive && {
                  backgroundColor: tab.color,
                  borderColor: colors.border,
                },
                isActive && neuBorder,
                isActive && neuShadowSm,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  TYPOGRAPHY.sticker,
                  styles.typeTabText,
                  { color: isActive ? '#171717' : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. SEARCH BAR */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={`Search ${selectedType === 'all' ? 'library' : selectedType + 's'}...`}
        style={styles.searchBar}
      />

      {/* 3. CONTROLS ROW */}
      <View style={styles.controlsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genresList}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {BOOK_CATEGORIES.filter((c) => c.id !== 'novel' && c.id !== 'comic').map(
            (cat) => {
              const isSelected = selectedGenre === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedGenre(cat.id)}
                  style={[
                    styles.genreChip,
                    {
                      backgroundColor: isSelected ? colors.yellow : colors.surface,
                      borderColor: colors.border,
                    },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      TYPOGRAPHY.sticker,
                      styles.genreText,
                      { color: isSelected ? '#171717' : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: colors.coral, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical" size={14} color="#171717" />
          <Text style={styles.sortButtonText}>{activeSortLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Sort options menu */}
      {showSortMenu && (
        <View
          style={[
            styles.sortDropdown,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadow,
          ]}
        >
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.sortOption,
                sortOption === opt.id && {
                  backgroundColor: colors.yellow,
                  borderColor: colors.border,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => {
                setSortOption(opt.id);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  { color: sortOption === opt.id ? '#171717' : colors.text },
                ]}
              >
                {opt.label}
              </Text>
              {sortOption === opt.id && (
                <Ionicons name="checkmark-sharp" size={16} color="#171717" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 4. BOOKS GRID */}
      <FlatList
        data={filteredAndSortedBooks}
        key={bookColumns}
        numColumns={bookColumns}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={bookColumns > 1 ? styles.columnWrapper : undefined}
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
            <LoadingIndicator message="Loading your library..." />
          ) : (
            <EmptyState
              icon="bookmark"
              title="LIBRARY EMPTY"
              message={
                searchQuery || selectedGenre !== 'all' || selectedType !== 'all'
                  ? 'No library items match the active filters.'
                  : 'Your library is empty. Save novels or comics to read offline.'
              }
              action={
                <TouchableOpacity
                  style={[
                    styles.browseButton,
                    { backgroundColor: colors.yellow, borderColor: colors.border },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.browseButtonText}>BROWSE CATALOG</Text>
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
  columnWrapper: {
    gap: SPACING.xs + 2,
    justifyContent: 'flex-start',
  },
  typeTabsWrapper: {
    flexDirection: 'row',
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  typeTabsWrapperDesktop: {
    alignSelf: 'flex-start',
    width: 420,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.xs,
  },
  typeTabText: {
    fontSize: 10,
  },
  searchBar: {
    marginBottom: SPACING.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  genresList: {
    gap: SPACING.xs,
  },
  genreChip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
  },
  genreText: {
    fontSize: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
  },
  sortButtonText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '900',
  },
  sortDropdown: {
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.xs,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: SPACING.xxl + 24,
  },
  browseButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  browseButtonText: {
    color: '#171717',
    fontWeight: '900',
    letterSpacing: 0.5,
    fontSize: 12,
  },
});
