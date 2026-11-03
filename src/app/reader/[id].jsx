import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PdfViewer } from '../../components/pdf/PdfViewer';
import { ReadingTimerPill } from '../../components/common/ReadingTimerPill';
import { LoadingIndicator } from '../../components/feedback/LoadingIndicator';
import { BookService } from '../../services/bookService';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const bookId = params.id;
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colors, isDark, neuBorder, neuShadowSm } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width < 560;

  const topInset = Platform.select({
    android: Math.max(insets.top, RNStatusBar.currentHeight || 24),
    ios: insets.top,
    default: insets.top,
  });

  const pdfViewerRef = useRef(null);

  const [currentChapterNum, setCurrentChapterNum] = useState(
    params.initialChapter ? parseInt(params.initialChapter, 10) : 1
  );

  const [startingPage, setStartingPage] = useState(
    params.initialPage ? parseInt(params.initialPage, 10) : 1
  );

  const [currentPage, setCurrentPage] = useState(
    params.initialPage ? parseInt(params.initialPage, 10) : 1
  );
  const [totalPages, setTotalPages] = useState(1);

  const [readingMode, setReadingMode] = useState('vertical');
  const [zoomLevel, setZoomLevel] = useState(1.0);

  useEffect(() => {
    let isMounted = true;

    async function loadReaderData() {
      if (!bookId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [bookRes, chaptersRes] = await Promise.all([
        BookService.getBookById(bookId),
        BookService.getChaptersByBookId(bookId),
      ]);

      if (!isMounted) return;

      let loadedBook = bookRes?.data || null;
      if (!loadedBook) {
        const localLib = await StorageService.getLibrary();
        loadedBook = localLib.find((b) => b.id === bookId) || null;
      }

      const loadedChapters = chaptersRes?.data || [];
      setBook(loadedBook);
      setChapters(loadedChapters);

      if (loadedBook) {
        setReadingMode(loadedBook.type === 'comic' ? 'paged' : 'vertical');

        if (params.initialChapter) {
          const chNum = parseInt(params.initialChapter, 10);
          setCurrentChapterNum(chNum);
          const savedCh = await StorageService.getChapterProgress(loadedBook.id, chNum);
          if (savedCh?.page) {
            setCurrentPage(savedCh.page);
            setStartingPage(savedCh.page);
          } else if (params.initialPage) {
            const initP = parseInt(params.initialPage, 10);
            setCurrentPage(initP);
            setStartingPage(initP);
          }
        } else {
          const savedBook = await StorageService.getBookDetailedProgress(loadedBook.id);
          if (savedBook && savedBook.lastChapter) {
            const chNum = savedBook.lastChapter;
            setCurrentChapterNum(chNum);
            const savedCh = savedBook.chapters?.[chNum];
            if (savedCh?.page) {
              setCurrentPage(savedCh.page);
              setStartingPage(savedCh.page);
            } else if (savedBook.lastPage) {
              setCurrentPage(savedBook.lastPage);
              setStartingPage(savedBook.lastPage);
            }
          }
        }
      }

      setLoading(false);
    }

    loadReaderData();

    return () => {
      isMounted = false;
    };
  }, [bookId, params.initialChapter, params.initialPage]);

  const currentChapter =
    chapters.find((c) => c.chapterNumber === currentChapterNum) || chapters[0];

  const saveProgressFor = useCallback(
    async (targetChapter, page, total) => {
      if (!book) return;
      await StorageService.recordReadingProgress(
        book,
        targetChapter,
        page,
        total || totalPages
      );
    },
    [book, totalPages]
  );

  const handlePageChange = useCallback(
    (page, total) => {
      setCurrentPage(page);
      if (total) setTotalPages(total);
      saveProgressFor(currentChapterNum, page, total);
    },
    [currentChapterNum, saveProgressFor]
  );

  const handleLoadSuccess = useCallback(
    (total) => {
      setTotalPages(total);
      saveProgressFor(currentChapterNum, currentPage, total);
    },
    [currentChapterNum, currentPage, saveProgressFor]
  );

  const handleError = useCallback((err) => {
    console.error('PDF view error:', err);
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(2.5, +(zoomLevel + 0.25).toFixed(2));
    setZoomLevel(newZoom);
    if (pdfViewerRef.current) pdfViewerRef.current.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.75, +(zoomLevel - 0.25).toFixed(2));
    setZoomLevel(newZoom);
    if (pdfViewerRef.current) pdfViewerRef.current.setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    if (pdfViewerRef.current) pdfViewerRef.current.setZoom(1.0);
  };

  const toggleReadingMode = () => {
    const nextMode = readingMode === 'vertical' ? 'paged' : 'vertical';
    setReadingMode(nextMode);
    if (pdfViewerRef.current) pdfViewerRef.current.setMode(nextMode);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      if (pdfViewerRef.current) pdfViewerRef.current.setPage(prev);
      saveProgressFor(currentChapterNum, prev, totalPages);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      if (pdfViewerRef.current) pdfViewerRef.current.setPage(next);
      saveProgressFor(currentChapterNum, next, totalPages);
    }
  };

  const goToPreviousChapter = async () => {
    if (currentChapterNum > 1) {
      const prevChapter = currentChapterNum - 1;
      const saved = await StorageService.getChapterProgress(book.id, prevChapter);
      const targetPage = saved?.page || 1;

      setCurrentChapterNum(prevChapter);
      setStartingPage(targetPage);
      setCurrentPage(targetPage);
      saveProgressFor(prevChapter, targetPage, saved?.totalPages || 1);
    }
  };

  const goToNextChapter = async () => {
    if (currentChapterNum < chapters.length) {
      const nextChapter = currentChapterNum + 1;
      const saved = await StorageService.getChapterProgress(book.id, nextChapter);
      const targetPage = saved?.page || 1;

      setCurrentChapterNum(nextChapter);
      setStartingPage(targetPage);
      setCurrentPage(targetPage);
      saveProgressFor(nextChapter, targetPage, saved?.totalPages || 1);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background, paddingTop: topInset },
        ]}
      >
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor={colors.background}
        />
        <LoadingIndicator message="Loading document from Supabase..." />
      </View>
    );
  }

  if (!book || !currentChapter || !currentChapter.pdfUrl) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background, paddingTop: topInset },
        ]}
      >
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor={colors.background}
        />
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.text, marginTop: 12 }]}>
          {!book
            ? 'Document not found in catalog.'
            : 'No PDF available for this chapter.'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: colors.yellow, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
        >
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.surface}
      />

      {/* 1. TOP TOOLBAR WITH SAFE AREA AND THEME SYNC */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topInset,
          },
        ]}
      >
        {isCompact ? (
          <View style={styles.compactHeaderContent}>
            {/* Row 1: Back Button & Book Title (Full width) */}
            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[
                  styles.backButton,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  neuBorder,
                  neuShadowSm,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text
                  style={[TYPOGRAPHY.bodyBold, styles.titleText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {book.title}
                </Text>
                <Text
                  style={[styles.subtitleText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  CH. {currentChapterNum} • {(currentChapter.title || 'FULL BOOK').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Row 2: Chapter Info Tag + Timer & Mode Controls */}
            <View style={styles.controlsRow}>
              <View
                style={[
                  styles.chapterBadge,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  neuBorder,
                ]}
              >
                <Ionicons name="bookmark-outline" size={12} color={colors.textSecondary} />
                <Text
                  style={[styles.chapterBadgeText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {chapters.length > 1
                    ? `CH. ${currentChapterNum} / ${chapters.length}`
                    : `PAGE ${currentPage}${totalPages > 1 ? ` / ${totalPages}` : ''}`}
                </Text>
              </View>

              <View style={styles.topRightActions}>
                <ReadingTimerPill forceShow={true} style={styles.timerPill} />
                <TouchableOpacity
                  style={[
                    styles.modePill,
                    {
                      backgroundColor:
                        readingMode === 'paged' ? colors.lavender : colors.mint,
                      borderColor: colors.border,
                    },
                    neuBorder,
                    neuShadowSm,
                  ]}
                  onPress={toggleReadingMode}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${readingMode === 'paged' ? 'vertical' : 'paged'} mode`}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Ionicons
                    name={readingMode === 'paged' ? 'book' : 'layers'}
                    size={14}
                    color="#171717"
                  />
                  <Text style={styles.modeText}>
                    {readingMode === 'paged' ? 'PAGED' : 'VERTICAL'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Desktop & Tablet Wide Layout: Single Row */
          <View style={styles.wideHeaderContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backButton,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
                neuShadowSm,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.titleContainerWide}>
              <Text
                style={[TYPOGRAPHY.bodyBold, styles.titleText, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {book.title}
              </Text>
              <Text
                style={[styles.subtitleText, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                CH. {currentChapterNum} • {(currentChapter.title || 'FULL BOOK').toUpperCase()}
              </Text>
            </View>

            <View style={styles.topRightActions}>
              <ReadingTimerPill forceShow={true} style={styles.timerPill} />
              <TouchableOpacity
                style={[
                  styles.modePill,
                  {
                    backgroundColor:
                      readingMode === 'paged' ? colors.lavender : colors.mint,
                    borderColor: colors.border,
                  },
                  neuBorder,
                  neuShadowSm,
                ]}
                onPress={toggleReadingMode}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${readingMode === 'paged' ? 'vertical' : 'paged'} mode`}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Ionicons
                  name={readingMode === 'paged' ? 'book' : 'layers'}
                  size={14}
                  color="#171717"
                />
                <Text style={styles.modeText}>
                  {readingMode === 'paged' ? 'PAGED' : 'VERTICAL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 2. PDF VIEWER CONTAINER (PDF Content readable without color distortion) */}
      <View style={styles.viewerWrapper}>
        <PdfViewer
          key={`${currentChapter.pdfUrl}-${currentChapterNum}`}
          ref={pdfViewerRef}
          pdfUrl={currentChapter.pdfUrl}
          mode={readingMode}
          initialPage={startingPage}
          zoom={zoomLevel}
          onPageChange={handlePageChange}
          onLoadSuccess={handleLoadSuccess}
          onError={handleError}
          style={styles.pdfViewer}
        />

        {/* Minimal Zoom Controls */}
        <View
          style={[
            styles.zoomOverlay,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            neuBorder,
            neuShadowSm,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.zoomBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
            onPress={handleZoomIn}
            accessibilityLabel="Zoom In"
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomResetBtn}
            onPress={handleResetZoom}
            accessibilityLabel="Reset Zoom"
          >
            <Text style={[styles.zoomLevelText, { color: colors.text }]}>
              {Math.round(zoomLevel * 100)}%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.zoomBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
            onPress={handleZoomOut}
            accessibilityLabel="Zoom Out"
          >
            <Ionicons name="remove" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. BOTTOM TOOLBAR WITH THEME SYNC */}
      <View
        style={[
          styles.bottomToolbar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(SPACING.sm, insets.bottom),
          },
        ]}
      >
        {/* Previous Chapter */}
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
            currentChapterNum <= 1 && styles.navButtonDisabled,
          ]}
          disabled={currentChapterNum <= 1}
          onPress={goToPreviousChapter}
          accessibilityRole="button"
          accessibilityLabel="Previous chapter"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons name="arrow-back" size={14} color={colors.text} />
          <Text style={[styles.navBtnLabel, { color: colors.text }]}>
            PREV CH
          </Text>
        </TouchableOpacity>

        {/* Page status pill */}
        <View style={styles.pageCenterBlock}>
          {readingMode === 'paged' && (
            <TouchableOpacity
              style={[
                styles.pageArrowBtn,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
                currentPage <= 1 && styles.pageArrowBtnDisabled,
              ]}
              disabled={currentPage <= 1}
              onPress={goToPreviousPage}
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="chevron-back" size={16} color={colors.text} />
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.pageNumberBadge,
              {
                backgroundColor: colors.yellow,
                borderColor: colors.border,
              },
              neuBorder,
              neuShadowSm,
            ]}
          >
            <Text style={styles.pageNumberText}>
              PAGE {currentPage} / {totalPages}
            </Text>
          </View>

          {readingMode === 'paged' && (
            <TouchableOpacity
              style={[
                styles.pageArrowBtn,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
                currentPage >= totalPages && styles.pageArrowBtnDisabled,
              ]}
              disabled={currentPage >= totalPages}
              onPress={goToNextPage}
              accessibilityRole="button"
              accessibilityLabel="Next page"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Next Chapter */}
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
            currentChapterNum >= chapters.length && styles.navButtonDisabled,
          ]}
          disabled={currentChapterNum >= chapters.length}
          onPress={goToNextChapter}
          accessibilityRole="button"
          accessibilityLabel="Next chapter"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={[styles.navBtnLabel, { color: colors.text }]}>
            NEXT CH
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  headerContainer: {
    borderBottomWidth: 2.5,
    zIndex: 10,
  },
  compactHeaderContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  wideHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: SPACING.sm + 2,
    justifyContent: 'center',
  },
  titleContainerWide: {
    flex: 1,
    marginHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
    borderRadius: RADIUS.xs,
  },
  chapterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  timerPill: {
    minHeight: 38,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: SPACING.sm + 3,
    paddingVertical: 7,
    borderRadius: RADIUS.xs,
  },
  modeText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  viewerWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  pdfViewer: {
    flex: 1,
  },
  zoomOverlay: {
    position: 'absolute',
    right: 14,
    bottom: 20,
    borderRadius: RADIUS.sm,
    padding: 3,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  zoomResetBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  zoomLevelText: {
    fontSize: 10,
    fontWeight: '900',
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 2.5,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.xs,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navBtnLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pageCenterBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageArrowBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xs,
  },
  pageArrowBtnDisabled: {
    opacity: 0.3,
  },
  pageNumberBadge: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 8,
    borderRadius: RADIUS.xs,
  },
  pageNumberText: {
    color: '#171717',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  backBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  backBtnText: {
    color: '#171717',
    fontWeight: '900',
  },
});
