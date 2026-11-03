import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { SearchBar } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import { BookCard } from '../../components/books/BookCard';
import { ReadingProgressBar } from '../../components/books/ReadingProgressBar';
import { ReadingTimerPill } from '../../components/common/ReadingTimerPill';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingIndicator } from '../../components/feedback/LoadingIndicator';
import { BookService } from '../../services/bookService';
import { BOOK_CATEGORIES } from '../../constants/categories';
import { useHistory, useLastOpenedBook, useLibrary } from '../../hooks/useStorage';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export default function HomeScreen() {
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { history, refreshHistory } = useHistory();
  const { lastOpened, bookData, refreshLastOpened } = useLastOpenedBook();
  const { library, refreshLibrary } = useLibrary();
  const { colors, neuBorder, neuBorderThick, neuShadow, neuShadowSm } = useTheme();
  const { bookColumns, isDesktop } = useResponsive();

  const fetchCatalog = useCallback(async (isInitial = false) => {
    if (isInitial && books.length === 0) {
      setLoadingBooks(true);
    }
    setCatalogError(null);
    const res = await BookService.getBooks();
    if (res.error) {
      setCatalogError(res.error);
      setBooks((prev) => (prev.length > 0 ? prev : []));
    } else {
      setBooks(res.data || []);
      setCatalogError(null);
    }
    setLoadingBooks(false);
  }, [books.length]);

  useFocusEffect(
    useCallback(() => {
      fetchCatalog(false);
      refreshHistory(false);
      refreshLastOpened(false);
      refreshLibrary(false);
    }, [fetchCatalog, refreshHistory, refreshLastOpened, refreshLibrary])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCatalog(false),
      refreshHistory(false),
      refreshLastOpened(false),
      refreshLibrary(false),
    ]);
    setRefreshing(false);
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'novel') return book.type === 'novel';
      if (selectedCategory === 'comic') return book.type === 'comic';

      return book.genres?.some(
        (g) => g.toLowerCase() === selectedCategory.toLowerCase()
      );
    });
  }, [books, searchQuery, selectedCategory]);

  const handleContinueReading = (book, chapter, page) => {
    router.push({
      pathname: '/reader/[id]',
      params: {
        id: book.id,
        initialChapter: chapter || 1,
        initialPage: page || 1,
      },
    });
  };

  const completedCount = history.filter((b) => (b.progress || 0) >= 90).length;
  const inProgressCount = history.length;
  const savedBooksCount = library.length;

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }) => <BookCard book={item} layout="grid" />,
    []
  );

  const listHeader = useMemo(() => (
    <View style={styles.headerBlock}>
      {/* 1. WELCOME BANNER */}
      {!searchQuery && (
        <View
          style={[
            styles.welcomeBanner,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <View style={styles.welcomeBadgeRow}>
            <View
              style={[
                styles.stickerYellow,
                { backgroundColor: colors.yellow, borderColor: colors.border },
              ]}
            >
              <Text style={styles.stickerText}>★ DIGITAL READER</Text>
            </View>
            <View
              style={[
                styles.stickerMint,
                { backgroundColor: colors.mint, borderColor: colors.border },
              ]}
            >
              <Text style={styles.stickerText}>OFFLINE READY</Text>
            </View>
          </View>
          <Text style={[styles.welcomeHeading, { color: colors.text }]}>
            DISCOVER NOVELS & COMICS.
          </Text>
          <Text style={[styles.welcomeSubheading, { color: colors.textSecondary }]}>
            Read actual PDFs with page-level progress tracking and offline storage.
          </Text>
        </View>
      )}

      {/* 2. READING STATISTICS ROW */}
      {!searchQuery && (
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.yellow, borderColor: colors.border },
              neuBorder,
              neuShadowSm,
            ]}
          >
            <Text style={styles.statNumber}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.lavender, borderColor: colors.border },
              neuBorder,
              neuShadowSm,
            ]}
          >
            <Text style={styles.statNumber}>{savedBooksCount}</Text>
            <Text style={styles.statLabel}>SAVED</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.coral, borderColor: colors.border },
              neuBorder,
              neuShadowSm,
            ]}
          >
            <Text style={styles.statNumber}>5d</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.mint, borderColor: colors.border },
              neuBorder,
              neuShadowSm,
            ]}
          >
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>DONE</Text>
          </View>
        </View>
      )}

      {/* 3. FEATURED CURRENTLY READING BOOK CARD */}
      {bookData && !searchQuery ? (
        <View
          style={[
            styles.currentBookCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuShadow,
          ]}
        >
          <View
            style={[
              styles.currentCardHeader,
              { backgroundColor: colors.yellow, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.currentSticker}>
              <Ionicons name="flash" size={13} color="#171717" />
              <Text style={styles.currentStickerText}>NOW READING</Text>
            </View>
            <Badge
              label={bookData.type.toUpperCase()}
              variant={bookData.type}
              size="small"
            />
          </View>

          <View style={styles.currentBookContent}>
            <Image
              source={{ uri: bookData.cover }}
              style={[
                styles.currentBookCover,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
                neuBorder,
              ]}
              resizeMode="cover"
            />
            <View style={styles.currentBookInfo}>
              <Text
                style={[
                  TYPOGRAPHY.h2,
                  styles.currentBookTitle,
                  { color: colors.text },
                ]}
                numberOfLines={2}
              >
                {bookData.title}
              </Text>
              <Text
                style={[
                  TYPOGRAPHY.caption,
                  styles.currentBookAuthor,
                  { color: colors.textSecondary },
                ]}
              >
                BY {bookData.author.toUpperCase()}
              </Text>

              <View style={styles.chapterBadgeRow}>
                <View
                  style={[
                    styles.chapterPill,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chapterPillText, { color: colors.text }]}>
                    CHAPTER {lastOpened?.chapter || 1} • PAGE {lastOpened?.page || 1}
                  </Text>
                </View>
              </View>

              <ReadingProgressBar
                progress={lastOpened?.progress || 0}
                showLabel={true}
                fillColor={colors.yellow}
                height={12}
                style={styles.progressBar}
              />

              <TouchableOpacity
                style={[
                  isDesktop ? styles.continueButtonDesktop : styles.continueButton,
                  { backgroundColor: colors.yellow, borderColor: colors.border },
                  neuBorder,
                  neuShadowSm,
                ]}
                onPress={() =>
                  handleContinueReading(
                    bookData,
                    lastOpened?.chapter,
                    lastOpened?.page
                  )
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="play"
                  size={15}
                  color="#171717"
                />
                <Text style={styles.continueButtonText}>
                  CONTINUE READING
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {/* 4. RECENTLY OPENED CAROUSEL */}
      {history.length > 0 && !searchQuery ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View
              style={[
                styles.sectionHeaderTag,
                { backgroundColor: colors.lavender, borderColor: colors.border },
                neuShadowSm,
              ]}
            >
              <Text style={styles.sectionTagText}>RECENTLY OPENED</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={[styles.seeAllText, { color: colors.text }]}>
                VIEW ALL →
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {history.map((item) => (
              <View key={item.id} style={styles.recentCardWrapper}>
                <BookCard book={item} layout="list" />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 5. EXPLORE CATALOG & SEARCH */}
      <View style={styles.catalogSectionHeader}>
        <View
          style={[
            styles.catalogTag,
            { backgroundColor: colors.mint, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.catalogTagText}>EXPLORE CATALOG</Text>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search novels, comics, authors..."
        style={styles.searchBar}
      />

      {/* Genre Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesContainer}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {BOOK_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryChip,
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
                  styles.categoryText,
                  { color: isSelected ? '#171717' : colors.text },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  ), [
    searchQuery,
    colors,
    neuShadow,
    neuBorder,
    neuShadowSm,
    inProgressCount,
    savedBooksCount,
    completedCount,
    bookData,
    lastOpened,
    isDesktop,
    history,
    selectedCategory,
  ]);

  return (
    <ScreenContainer scrollable={false}>
      {/* Neubrutalist Header */}
      <Header
        title="READO"
        subtitle="Novels & Comics with Real PDF Viewer"
        rightAction={<ReadingTimerPill forceShow={true} />}
      />

      {/* Main Content List */}
      <FlatList
        data={filteredBooks}
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
        ListHeaderComponent={listHeader}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          loadingBooks ? (
            <LoadingIndicator message="Connecting to Supabase catalog..." />
          ) : catalogError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="CONNECTION ERROR"
              message="Unable to reach the Supabase catalog. Please check your internet connection or verify credentials."
              action={
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.yellow, borderColor: colors.border },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  onPress={fetchCatalog}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retryButtonText}>RETRY CONNECTION</Text>
                </TouchableOpacity>
              }
            />
          ) : (
            <EmptyState
              icon={searchQuery || selectedCategory !== 'all' ? 'search' : 'book-outline'}
              title={searchQuery || selectedCategory !== 'all' ? 'NO RESULTS FOUND' : 'CATALOG EMPTY'}
              message={
                searchQuery || selectedCategory !== 'all'
                  ? `No books found matching the active filters.`
                  : 'No novels or comics have been uploaded to the catalog yet.'
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
  listContent: {
    paddingBottom: SPACING.xxl + 24,
  },
  headerBlock: {
    marginBottom: SPACING.sm,
  },
  welcomeBanner: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2.5,
    marginBottom: SPACING.md,
  },
  welcomeBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.xs + 2,
  },
  stickerYellow: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
  },
  stickerMint: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
  },
  stickerText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  welcomeHeading: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 25,
    marginBottom: 4,
  },
  welcomeSubheading: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs + 4,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  currentBookCard: {
    borderRadius: RADIUS.md,
    borderWidth: 2.5,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  currentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  currentSticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentStickerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.8,
  },
  currentBookContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  currentBookCover: {
    width: 96,
    height: 138,
    borderRadius: RADIUS.xs,
  },
  currentBookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  currentBookTitle: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  currentBookAuthor: {
    marginBottom: SPACING.xs,
    fontSize: 11,
  },
  chapterBadgeRow: {
    marginBottom: 4,
  },
  chapterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  chapterPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressBar: {
    marginVertical: SPACING.xs,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs + 2,
  },
  continueButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs + 2,
    alignSelf: 'flex-start',
  },
  continueButtonText: {
    color: '#171717',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  sectionHeaderTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
  },
  sectionTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '900',
  },
  recentList: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  recentCardWrapper: {
    width: 295,
  },
  catalogSectionHeader: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  catalogTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  catalogTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  searchBar: {
    marginBottom: SPACING.sm,
  },
  categoriesContainer: {
    marginBottom: SPACING.md,
  },
  categoriesContent: {
    gap: SPACING.xs + 2,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    fontSize: 11,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  retryButtonText: {
    color: '#171717',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
