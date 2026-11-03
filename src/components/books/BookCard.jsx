import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';
import { Badge } from '../common/Badge';
import { ReadingProgressBar } from './ReadingProgressBar';

export const BookCard = React.memo(function BookCard({
  book,
  layout = 'grid',
  onPress,
  style,
}) {
  const { colors, neuBorder, neuShadow, neuShadowSm } = useTheme();
  const [imageError, setImageError] = useState(false);

  if (!book) return null;

  const handlePress = () => {
    if (onPress) {
      onPress(book);
    } else {
      router.push({
        pathname: '/book/[id]',
        params: { id: book.id },
      });
    }
  };

  const isList = layout === 'list';
  const showCover = book.cover && !imageError;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        neuBorder,
        isList ? neuShadowSm : neuShadow,
        isList ? styles.listCard : styles.gridCard,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${book.title}`}
    >
      <View
        style={[
          isList ? styles.listCoverWrapper : styles.gridCoverWrapper,
          {
            borderColor: colors.border,
            borderBottomColor: colors.border,
            backgroundColor: colors.surfaceVariant,
          },
        ]}
      >
        {showCover ? (
          <Image
            source={{ uri: book.cover }}
            style={isList ? styles.listCover : styles.gridCover}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            style={[
              isList ? styles.listCover : styles.gridCover,
              styles.placeholderCover,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name={book.type === 'comic' ? 'images-outline' : 'book-outline'}
              size={isList ? 26 : 38}
              color={colors.textSecondary}
            />
          </View>
        )}
        <View style={styles.coverBadgeWrapper}>
          <Badge
            label={(book.type || 'novel').toUpperCase()}
            variant={book.type || 'novel'}
            size="small"
          />
        </View>
      </View>

      <View style={isList ? styles.listContent : styles.gridContent}>
        <View style={styles.metaRow}>
          {book.status ? (
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: colors.text }]}>
                {book.status}
              </Text>
            </View>
          ) : null}
          {book.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#D97706" />
              <Text style={styles.ratingText}>{Number(book.rating).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[TYPOGRAPHY.h3, styles.title, { color: colors.text }]}
          numberOfLines={isList ? 1 : 2}
        >
          {book.title}
        </Text>

        <Text
          style={[TYPOGRAPHY.caption, styles.author, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>

        {book.progress !== undefined && (
          <View style={styles.progressContainer}>
            <ReadingProgressBar progress={book.progress} showLabel={isList} />
            {book.lastReadChapter ? (
              <Text style={[styles.chapterInfo, { color: colors.textSecondary }]}>
                Ch. {book.lastReadChapter} of {book.chaptersCount || 10}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'transform 0.12s ease',
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  gridCard: {
    flex: 1,
    margin: SPACING.xs + 2,
    maxWidth: 240,
    minWidth: 140,
  },
  listCard: {
    flexDirection: 'row',
    marginBottom: SPACING.sm + 2,
    padding: SPACING.sm + 2,
    alignItems: 'center',
  },
  gridCoverWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.72,
    maxHeight: 250,
    borderBottomWidth: 2,
  },
  listCoverWrapper: {
    position: 'relative',
    width: 76,
    height: 108,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
    borderWidth: 2,
  },
  gridCover: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCover: {
    width: '100%',
    height: '100%',
  },
  coverBadgeWrapper: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  gridContent: {
    padding: SPACING.sm + 2,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  listContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  author: {
    marginBottom: SPACING.xs,
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: SPACING.xs,
  },
  chapterInfo: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },
});
