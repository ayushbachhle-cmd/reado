import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Badge } from '../../components/common/Badge';
import { ReadingProgressBar } from '../../components/books/ReadingProgressBar';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingIndicator } from '../../components/feedback/LoadingIndicator';
import { ReadingTimerPill } from '../../components/common/ReadingTimerPill';
import { BookService } from '../../services/bookService';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [detailedProgress, setDetailedProgress] = useState(null);
  const { colors, neuBorder, neuBorderThick, neuShadow, neuShadowSm } = useTheme();
  const { isDesktop } = useResponsive();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);

    const [bookRes, chaptersRes] = await Promise.all([
      BookService.getBookById(id),
      BookService.getChaptersByBookId(id),
    ]);

    if (bookRes.error && !bookRes.data) {
      // In case book was opened from local saved library while offline
      const localLib = await StorageService.getLibrary();
      const localBook = localLib.find((b) => b.id === id);
      if (localBook) {
        setBook(localBook);
        setChapters(chaptersRes.data || []);
      } else {
        setBook(null);
        setFetchError(bookRes.error);
      }
    } else if (bookRes.data) {
      setBook(bookRes.data);
      setChapters(chaptersRes.data || []);
    } else {
      setBook(null);
    }

    const isSaved = await StorageService.isInLibrary(id);
    setInLibrary(isSaved);

    const prog = await StorageService.getBookDetailedProgress(id);
    setDetailedProgress(prog);

    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleLibrary = async () => {
    if (!book) return;
    const updated = await StorageService.toggleLibrary(book);
    setInLibrary(updated.some((b) => b.id === book.id));
  };

  const handleOpenReader = (chapterNum = 1, pageNum = 1) => {
    if (!book) return;
    router.push({
      pathname: '/reader/[id]',
      params: {
        id: book.id,
        initialChapter: chapterNum,
        initialPage: pageNum,
      },
    });
  };

  if (loading && !book) {
    return (
      <ScreenContainer>
        <LoadingIndicator message="Loading book details from Supabase..." />
      </ScreenContainer>
    );
  }

  if (!book) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={fetchError ? 'cloud-offline-outline' : 'alert-circle'}
          title={fetchError ? 'CONNECTION ERROR' : 'BOOK NOT FOUND'}
          message={
            fetchError
              ? 'Could not connect to Supabase. Please check your network connection.'
              : 'The requested novel or comic could not be located in the catalog.'
          }
          action={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {fetchError ? (
                <TouchableOpacity
                  style={[
                    styles.browseBackButton,
                    { backgroundColor: colors.yellow, borderColor: colors.border },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  onPress={loadData}
                  activeOpacity={0.85}
                >
                  <Text style={styles.browseBackButtonText}>RETRY</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.browseBackButton,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  neuBorder,
                  neuShadowSm,
                ]}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={[styles.browseBackButtonText, { color: colors.text }]}>GO BACK</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </ScreenContainer>
    );
  }

  const currentChapter = detailedProgress?.lastChapter || book.lastReadChapter || 1;
  const currentPage = detailedProgress?.lastPage || book.lastReadPage || 1;
  const overallProgress =
    detailedProgress?.overallProgress !== undefined
      ? detailedProgress.overallProgress
      : book.progress || 0;

  return (
    <ScreenContainer scrollable={true} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Bar with Back Button & Reading Timer */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backNavButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.backNavText, { color: colors.text }]}>BACK</Text>
        </TouchableOpacity>
        <ReadingTimerPill forceShow={true} />
      </View>

      {/* 1. COVER & BOOK HERO */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          neuShadow,
        ]}
      >
        <View
          style={[
            styles.coverFrame,
            isDesktop && styles.coverFrameDesktop,
            { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
            neuBorder,
          ]}
        >
          {book.cover ? (
            <Image
              source={{ uri: book.cover }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverImage, styles.placeholderCover]}>
              <Ionicons
                name={book.type === 'comic' ? 'images-outline' : 'book-outline'}
                size={40}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>

        <View style={styles.metaSection}>
          <View style={styles.badgeRow}>
            <Badge label={book.type.toUpperCase()} variant={book.type} />
            <Badge label={book.status.toUpperCase()} variant="status" />
          </View>

          <Text style={[TYPOGRAPHY.h1, styles.title, { color: colors.text }]}>
            {book.title}
          </Text>
          <Text
            style={[
              TYPOGRAPHY.bodyBold,
              styles.author,
              { color: colors.textSecondary },
            ]}
          >
            WRITTEN BY {book.author.toUpperCase()}
          </Text>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
            >
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={[styles.statPillText, { color: colors.text }]}>
                {book.rating ? Number(book.rating).toFixed(1) : '5.0'}
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
            >
              <Ionicons name="document-text" size={13} color={colors.text} />
              <Text style={[styles.statPillText, { color: colors.text }]}>
                {chapters.length || book.chaptersCount || 0} CHS
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. ACTION BUTTONS */}
      <View style={[styles.actionRow, isDesktop && styles.actionRowDesktop]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.yellow, borderColor: colors.border },
            neuBorderThick,
            neuShadowSm,
          ]}
          onPress={() => handleOpenReader(currentChapter, currentPage)}
          activeOpacity={0.85}
        >
          <Ionicons name="book" size={20} color="#171717" />
          <Text style={styles.primaryButtonText}>
            {overallProgress > 0
              ? `CONTINUE CH. ${currentChapter}`
              : 'START READING'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              backgroundColor: inLibrary ? colors.mint : colors.surface,
              borderColor: colors.border,
            },
            neuBorderThick,
            neuShadowSm,
          ]}
          onPress={handleToggleLibrary}
          activeOpacity={0.85}
        >
          <Ionicons
            name={inLibrary ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={inLibrary ? '#171717' : colors.text}
          />
          <Text
            style={[
              styles.secondaryButtonText,
              { color: inLibrary ? '#171717' : colors.text },
            ]}
          >
            {inLibrary ? 'IN LIBRARY' : 'ADD TO LIBRARY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reading Progress Card */}
      {overallProgress > 0 && (
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[TYPOGRAPHY.sticker, { color: colors.text }]}>
              CURRENT READING PROGRESS
            </Text>
            <Text style={[styles.progressChapter, { color: colors.text }]}>
              CH. {currentChapter} • PAGE {currentPage} ({overallProgress}%)
            </Text>
          </View>
          <ReadingProgressBar
            progress={overallProgress}
            showLabel={false}
            fillColor={colors.yellow}
            height={12}
          />
        </View>
      )}

      {/* Genres Sticker Badges */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionTag,
            { backgroundColor: colors.lavender, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.sectionTagText}>GENRES & TAGS</Text>
        </View>
        <View style={styles.genresRow}>
          {book.genres.map((genre) => (
            <Badge key={genre} label={genre.toUpperCase()} variant="default" />
          ))}
        </View>
      </View>

      {/* Synopsis Card */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionTag,
            { backgroundColor: colors.mint, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.sectionTagText}>SYNOPSIS</Text>
        </View>
        <View
          style={[
            styles.synopsisCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
        >
          <Text style={[TYPOGRAPHY.body, styles.synopsis, { color: colors.text }]}>
            {book.description}
          </Text>
        </View>
      </View>

      {/* Chapter List */}
      <View style={styles.section}>
        <View style={styles.chaptersHeader}>
          <View
            style={[
              styles.sectionTag,
              { backgroundColor: colors.coral, borderColor: colors.border },
              neuShadowSm,
            ]}
          >
            <Text style={styles.sectionTagText}>
              AVAILABLE CHAPTERS ({chapters.length})
            </Text>
          </View>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
            Tap any chapter to launch actual PDF reader
          </Text>
        </View>

        {chapters.length === 0 ? (
          <View
            style={[
              styles.emptyChaptersCard,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              neuBorder,
            ]}
          >
            <Ionicons name="document-text-outline" size={28} color={colors.textSecondary} />
            <Text style={[styles.emptyChaptersText, { color: colors.textSecondary }]}>
              No chapters uploaded yet for this title.
            </Text>
          </View>
        ) : (
          <View style={styles.chaptersList}>
            {chapters.map((ch) => {
              const chProgress = detailedProgress?.chapters?.[ch.chapterNumber];
              const isCurrent = ch.chapterNumber === currentChapter;

              return (
                <TouchableOpacity
                  key={ch.id}
                  style={[
                    styles.chapterItem,
                    {
                      backgroundColor: isCurrent ? colors.yellow : colors.surface,
                      borderColor: colors.border,
                    },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  onPress={() =>
                    handleOpenReader(ch.chapterNumber, chProgress?.page || 1)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.chapterLeft}>
                    <View
                      style={[
                        styles.chapterIconBox,
                        {
                          backgroundColor: isCurrent
                            ? colors.surface
                            : colors.surfaceVariant,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chapterNumText,
                          { color: isCurrent ? '#171717' : colors.text },
                        ]}
                      >
                        {ch.chapterNumber}
                      </Text>
                    </View>
                    <View style={styles.chapterInfo}>
                      <Text
                        style={[
                          TYPOGRAPHY.bodyBold,
                          styles.chapterTitle,
                          { color: isCurrent ? '#171717' : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {ch.title}
                      </Text>
                      <Text
                        style={[
                          styles.chapterMeta,
                          { color: isCurrent ? '#4A4A4A' : colors.textSecondary },
                        ]}
                      >
                        PDF • {ch.estimatedPages} pages
                        {chProgress ? ` • Page ${chProgress.page} (${chProgress.percent}%)` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chapterRight}>
                    {chProgress?.percent >= 90 ? (
                      <Badge label="READ" variant="status" size="small" />
                    ) : isCurrent ? (
                      <Badge label="CURRENT" variant="comic" size="small" />
                    ) : (
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={colors.text}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
    marginTop: SPACING.xs,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  backNavText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2.5,
    flexDirection: 'row',
    marginTop: 4,
    gap: SPACING.md,
  },
  coverFrame: {
    width: 105,
    height: 152,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  coverFrameDesktop: {
    width: 135,
    height: 195,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaSection: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 2,
  },
  author: {
    marginBottom: SPACING.sm,
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionRowDesktop: {
    maxWidth: 580,
  },
  primaryButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.sm,
  },
  primaryButtonText: {
    color: '#171717',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.sm,
  },
  secondaryButtonText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  progressCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressChapter: {
    fontSize: 11,
    fontWeight: '800',
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs + 2,
  },
  sectionTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginTop: 2,
  },
  synopsisCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  synopsis: {
    lineHeight: 22,
    fontWeight: '500',
  },
  chaptersHeader: {
    marginBottom: SPACING.xs,
  },
  chaptersList: {
    gap: SPACING.xs + 2,
    marginBottom: SPACING.xxl,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  chapterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  chapterIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumText: {
    fontSize: 12,
    fontWeight: '900',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 13,
  },
  chapterMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chapterRight: {
    marginLeft: SPACING.xs,
  },
  browseBackButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  browseBackButtonText: {
    color: '#171717',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emptyChaptersCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.xxl,
  },
  emptyChaptersText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
