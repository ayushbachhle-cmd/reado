import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { LoadingIndicator } from '../../components/feedback/LoadingIndicator';
import { ReadingTimerPill } from '../../components/common/ReadingTimerPill';
import { useSettings, useLibrary } from '../../hooks/useStorage';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';
import { SPACING, RADIUS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';

export default function SettingsScreen() {
  const { settings, loading, updateSetting } = useSettings();
  const { library, refreshLibrary } = useLibrary();
  const { themePreference, setThemePreference, isDark, colors, neuBorder, neuShadow, neuShadowSm } = useTheme();
  const [resetting, setResetting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshLibrary();
    }, [refreshLibrary])
  );

  const handleResetProgress = () => {
    const confirmMessage =
      'Reset all reading progress, chapter bookmarks, and history? Your saved library items will NOT be deleted.';

    const executeReset = async () => {
      setResetting(true);
      await StorageService.resetAllProgress();
      await refreshLibrary();
      setResetting(false);

      const successMsg = 'Reading progress and history have been reset. Library books remain intact.';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert('Progress Reset', successMsg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        executeReset();
      }
    } else {
      Alert.alert(
        'Reset Reading Progress',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Progress',
            style: 'destructive',
            onPress: executeReset,
          },
        ]
      );
    }
  };

  if (loading && !settings) {
    return (
      <ScreenContainer>
        <LoadingIndicator message="Loading preferences..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true}>
      <Header
        title="PREFERENCES"
        subtitle="Theme, reader defaults, timers & storage"
        rightAction={<ReadingTimerPill forceShow={true} />}
      />

      {/* 1. THEME SELECTION (Dark Mode Feature) */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionTag,
            { backgroundColor: colors.yellow, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.sectionTagText}>APPEARANCE & THEME</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadow,
          ]}
        >
          <View style={styles.themeHeaderRow}>
            <View>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                Visual Theme
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                Neubrutalism styling across all views (Active: {isDark ? 'Dark' : 'Light'})
              </Text>
            </View>
          </View>

          {/* 3-Option Theme Selector: Light, Dark, System Default */}
          <View
            style={[
              styles.themeSelectorGroup,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              neuBorder,
            ]}
          >
            {[
              { id: 'light', label: 'LIGHT', icon: 'sunny' },
              { id: 'dark', label: 'DARK', icon: 'moon' },
              { id: 'system', label: 'SYSTEM DEFAULT', icon: 'phone-portrait' },
            ].map((item) => {
              const isSelected = themePreference === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeOptionBtn,
                    isSelected && {
                      backgroundColor: colors.yellow,
                      borderColor: colors.border,
                      borderWidth: 1.5,
                    },
                    isSelected && neuShadowSm,
                  ]}
                  onPress={() => setThemePreference(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={isSelected ? '#171717' : colors.text}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? '#171717' : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 2. READER DEFAULTS */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionTag,
            { backgroundColor: colors.lavender, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.sectionTagText}>READER DEFAULTS</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadow,
          ]}
        >
          {/* Comic Reading Mode */}
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                Comic Reading Format
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                Default mode when opening comic PDF issues
              </Text>
            </View>
            <View
              style={[
                styles.toggleGroup,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
              ]}
            >
              {['paged', 'vertical'].map((mode) => {
                const isActive = settings.comicReadingMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => updateSetting('comicReadingMode', mode)}
                    style={[
                      styles.toggleBtn,
                      isActive && {
                        backgroundColor: colors.yellow,
                        borderColor: colors.border,
                        borderWidth: 1.5,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        { color: isActive ? '#171717' : colors.textSecondary },
                      ]}
                    >
                      {mode === 'paged' ? 'PAGE FLIP' : 'VERTICAL'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Default Timer Duration */}
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                Default Reading Timer
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                Initial session duration for quick countdowns
              </Text>
            </View>
            <View
              style={[
                styles.toggleGroup,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                neuBorder,
              ]}
            >
              {[15, 30, 60].map((mins) => {
                const isActive = settings.defaultTimerMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => updateSetting('defaultTimerMinutes', mins)}
                    style={[
                      styles.toggleBtn,
                      isActive && {
                        backgroundColor: colors.yellow,
                        borderColor: colors.border,
                        borderWidth: 1.5,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        { color: isActive ? '#171717' : colors.textSecondary },
                      ]}
                    >
                      {mins}M
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Auto Bookmark */}
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                Auto-Bookmark Progress
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                Automatically persist active PDF page to AsyncStorage
              </Text>
            </View>
            <Switch
              value={settings.autoBookmark}
              onValueChange={(val) => updateSetting('autoBookmark', val)}
              trackColor={{ false: colors.surfaceVariant, true: colors.yellow }}
              thumbColor={isDark ? colors.text : '#171717'}
            />
          </View>
        </View>
      </View>

      {/* 3. STORAGE & RESET DATA */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionTag,
            { backgroundColor: colors.mint, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.sectionTagText}>STORAGE & DATA</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadow,
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                Saved Library Books
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                {library.length} book{library.length === 1 ? '' : 's'} preserved locally
              </Text>
            </View>
            <View
              style={[
                styles.protectedPill,
                { backgroundColor: colors.mint, borderColor: colors.border },
                neuShadowSm,
              ]}
            >
              <Ionicons name="shield-checkmark" size={14} color="#171717" />
              <Text style={styles.protectedPillText}>PROTECTED</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Reset Reading Progress Button */}
          <View style={styles.resetRow}>
            <View style={styles.resetInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.dangerLabel, { color: colors.coral }]}>
                Reset Reading Progress
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                Clears active chapters, last read pages, and log without deleting your library books.
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.resetButton,
                { backgroundColor: colors.coral, borderColor: colors.border },
                neuBorder,
                neuShadowSm,
              ]}
              onPress={handleResetProgress}
              disabled={resetting}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#171717" />
              <Text style={styles.resetButtonText}>
                {resetting ? 'RESETTING...' : 'RESET'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. SYSTEM & ENVIRONMENT */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionTag,
            { backgroundColor: colors.sky, borderColor: colors.border },
            neuShadowSm,
          ]}
        >
          <Text style={styles.sectionTagText}>SYSTEM ARCHITECTURE</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadow,
          ]}
        >
          <View style={styles.row}>
            <View
              style={[
                styles.platformIconBox,
                { backgroundColor: colors.yellow, borderColor: colors.border },
                neuBorder,
              ]}
            >
              <Ionicons
                name={Platform.OS === 'web' ? 'globe' : 'phone-portrait'}
                size={20}
                color="#171717"
              />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                Active Platform
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                {Platform.OS.toUpperCase()} (Expo SDK 58 / React Native Web)
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View
              style={[
                styles.platformIconBox,
                { backgroundColor: colors.lavender, borderColor: colors.border },
                neuBorder,
              ]}
            >
              <Ionicons name="document-text" size={20} color="#171717" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[TYPOGRAPHY.bodyBold, styles.rowLabel, { color: colors.text }]}>
                PDF Engine
              </Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
                {Platform.OS === 'web'
                  ? 'Mozilla PDF.js (HTML5 Canvas)'
                  : 'Mozilla PDF.js via Expo WebView'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.aboutCard}>
        <View
          style={[
            styles.aboutBadge,
            { backgroundColor: colors.surface, borderColor: colors.border },
            neuBorder,
            neuShadowSm,
          ]}
        >
          <Text style={[styles.aboutBadgeText, { color: colors.text }]}>
            NOVEL & COMIC READER • {isDark ? 'DARK MODE' : 'LIGHT MODE'}
          </Text>
        </View>
        <Text style={[styles.aboutSubtext, { color: colors.textSecondary }]}>
          Neubrutalism design with dynamic safe-area insets and theme synchronization.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
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
    fontSize: 10,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  themeHeaderRow: {
    marginBottom: SPACING.sm,
  },
  themeSelectorGroup: {
    flexDirection: 'row',
    borderRadius: RADIUS.xs,
    padding: 3,
    gap: 4,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.xs,
  },
  themeOptionText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  rowLabel: {
    fontSize: 14,
  },
  dangerLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  rowSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    marginVertical: SPACING.md,
  },
  toggleGroup: {
    flexDirection: 'row',
    borderRadius: RADIUS.xs,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  protectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
  },
  protectedPillText: {
    color: '#171717',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  resetInfo: {
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.xs,
  },
  resetButtonText: {
    color: '#171717',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  platformIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  aboutCard: {
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxl,
  },
  aboutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  aboutBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aboutSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 320,
  },
});
