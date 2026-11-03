import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LIBRARY: '@novel_reader_library',
  HISTORY: '@novel_reader_history',
  SETTINGS: '@novel_reader_settings',
  LAST_OPENED: '@novel_reader_last_opened',
  DETAILED_PROGRESS: '@novel_reader_detailed_progress',
};

const DEMO_BOOK_IDS = new Set(['novel-1', 'comic-1', 'novel-2', 'comic-2', 'novel-3', 'comic-3']);

function isDemoId(id) {
  if (!id || typeof id !== 'string') return false;
  return DEMO_BOOK_IDS.has(id) || id.startsWith('novel-') || id.startsWith('comic-');
}

export const StorageService = {
  // ==========================================
  // LIBRARY MANAGEMENT
  // ==========================================
  async getLibrary() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LIBRARY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo entries without disturbing genuine user books
          const cleaned = parsed.filter((b) => !isDemoId(b?.id));
          if (cleaned.length !== parsed.length) {
            await AsyncStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching library from AsyncStorage:', error);
      return [];
    }
  },

  async toggleLibrary(book) {
    try {
      const current = await this.getLibrary();
      const exists = current.some((item) => item.id === book.id);
      let updated;
      if (exists) {
        updated = current.filter((item) => item.id !== book.id);
      } else {
        updated = [book, ...current];
      }
      await AsyncStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error toggling library item:', error);
      return [];
    }
  },

  async isInLibrary(bookId) {
    try {
      const current = await this.getLibrary();
      return current.some((item) => item.id === bookId);
    } catch {
      return false;
    }
  },

  // ==========================================
  // LAST OPENED & DETAILED PROGRESS (Requirement 6)
  // ==========================================
  async getLastOpened() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_OPENED);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && isDemoId(parsed.bookId)) {
          await AsyncStorage.removeItem(STORAGE_KEYS.LAST_OPENED);
          return null;
        }
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Error getting last opened book:', error);
      return null;
    }
  },

  async getDetailedProgressMap() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DETAILED_PROGRESS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          // Clean legacy demo keys
          let hasDemoKeys = false;
          const cleaned = {};
          for (const key of Object.keys(parsed)) {
            if (isDemoId(key)) {
              hasDemoKeys = true;
            } else {
              cleaned[key] = parsed[key];
            }
          }
          if (hasDemoKeys) {
            await AsyncStorage.setItem(STORAGE_KEYS.DETAILED_PROGRESS, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      return {};
    } catch (error) {
      console.error('Error getting detailed progress map:', error);
      return {};
    }
  },

  async getBookDetailedProgress(bookId) {
    try {
      const map = await this.getDetailedProgressMap();
      return map[bookId] || null;
    } catch {
      return null;
    }
  },

  async getChapterProgress(bookId, chapterNumber) {
    try {
      const bookProg = await this.getBookDetailedProgress(bookId);
      if (bookProg && bookProg.chapters && bookProg.chapters[chapterNumber]) {
        return bookProg.chapters[chapterNumber];
      }
      return null;
    } catch {
      return null;
    }
  },

  async recordReadingProgress(book, chapterNumber, pageNumber = 1, totalPages = 1) {
    try {
      if (!book) return;

      const progressMap = await this.getDetailedProgressMap();
      const currentBookProgress = progressMap[book.id] || { chapters: {} };

      // Calculate chapter percentage
      const chapterPercent = totalPages > 0 ? Math.min(100, Math.round((pageNumber / totalPages) * 100)) : 0;

      // Update chapter specific data
      currentBookProgress.chapters = currentBookProgress.chapters || {};
      currentBookProgress.chapters[chapterNumber] = {
        page: pageNumber,
        totalPages,
        percent: chapterPercent,
        updatedAt: new Date().toISOString(),
      };

      // Overall book progress calculation
      const totalBookChapters = book.chaptersCount || 10;
      const completedChapters = Object.keys(currentBookProgress.chapters).filter(
        (ch) => currentBookProgress.chapters[ch].percent >= 90
      ).length;
      const overallProgress = Math.min(
        100,
        Math.max(
          Math.round(((completedChapters + chapterPercent / 100) / totalBookChapters) * 100),
          1
        )
      );

      currentBookProgress.lastChapter = chapterNumber;
      currentBookProgress.lastPage = pageNumber;
      currentBookProgress.overallProgress = overallProgress;
      currentBookProgress.lastReadAt = new Date().toISOString();

      progressMap[book.id] = currentBookProgress;
      await AsyncStorage.setItem(STORAGE_KEYS.DETAILED_PROGRESS, JSON.stringify(progressMap));

      // Save last opened book info
      const lastOpened = {
        bookId: book.id,
        chapter: chapterNumber,
        page: pageNumber,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPENED, JSON.stringify(lastOpened));

      // Update Reading History list
      const history = await this.getHistory();
      const filtered = history.filter((item) => item.id !== book.id);
      const updatedHistoryItem = {
        ...book,
        lastReadChapter: chapterNumber,
        lastReadPage: pageNumber,
        progress: overallProgress,
        lastReadAt: new Date().toISOString(),
      };
      const updatedHistory = [updatedHistoryItem, ...filtered];
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

      return {
        bookProgress: currentBookProgress,
        history: updatedHistory,
      };
    } catch (error) {
      console.error('Error saving reading progress:', error);
      return null;
    }
  },

  // ==========================================
  // READING HISTORY
  // ==========================================
  async getHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((b) => !isDemoId(b?.id));
          if (cleaned.length !== parsed.length) {
            await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching reading history:', error);
      return [];
    }
  },

  async clearHistory() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
      return [];
    } catch (error) {
      console.error('Error clearing history:', error);
      return [];
    }
  },

  // Reset Reading Progress (DOES NOT DELETE LIBRARY)
  async resetAllProgress() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HISTORY,
        STORAGE_KEYS.LAST_OPENED,
        STORAGE_KEYS.DETAILED_PROGRESS,
      ]);
      return true;
    } catch (error) {
      console.error('Error resetting reading progress:', error);
      return false;
    }
  },

  // ==========================================
  // USER SETTINGS
  // ==========================================
  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return JSON.parse(data);
      }
      const defaultSettings = {
        theme: 'system',
        novelScrollMode: 'vertical', // 'vertical' continuous
        comicReadingMode: 'paged', // 'paged' (page-by-page) or 'vertical'
        defaultTimerMinutes: 30,
        autoBookmark: true,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        theme: 'system',
        novelScrollMode: 'vertical',
        comicReadingMode: 'paged',
        defaultTimerMinutes: 30,
        autoBookmark: true,
      };
    }
  },

  async updateSettings(newSettings) {
    try {
      const current = await this.getSettings();
      const merged = { ...current, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return merged;
    } catch (error) {
      console.error('Error updating settings:', error);
      return null;
    }
  },
};
