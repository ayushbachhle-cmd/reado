import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { BookService } from '../services/bookService';

export function useLibrary() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = useCallback(async (forceLoading = false) => {
    if (forceLoading) setLoading(true);
    const data = await StorageService.getLibrary();
    setLibrary(data);
    setLoading(false);
  }, []);

  const toggleBook = async (book) => {
    const updated = await StorageService.toggleLibrary(book);
    setLibrary(updated);
  };

  useEffect(() => {
    fetchLibrary(true);
  }, [fetchLibrary]);

  return { library, loading, refreshLibrary: fetchLibrary, toggleBook };
}

export function useHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (forceLoading = false) => {
    if (forceLoading) setLoading(true);
    const data = await StorageService.getHistory();
    setHistory(data);
    setLoading(false);
  }, []);

  const clearHistory = async () => {
    await StorageService.clearHistory();
    setHistory([]);
  };

  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  return { history, loading, refreshHistory: fetchHistory, clearHistory };
}

export function useLastOpenedBook() {
  const [lastOpened, setLastOpened] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLastOpened = useCallback(async (forceLoading = false) => {
    if (forceLoading) setLoading(true);
    const item = await StorageService.getLastOpened();
    if (item && item.bookId) {
      const bookRes = await BookService.getBookById(item.bookId);
      const book = bookRes?.data || null;

      if (book) {
        const progressMap = await StorageService.getDetailedProgressMap();
        const bookProg = progressMap[book.id] || {};

        setLastOpened({
          ...item,
          chapter: bookProg.lastChapter || item.chapter || 1,
          page: bookProg.lastPage || item.page || 1,
          progress: bookProg.overallProgress !== undefined ? bookProg.overallProgress : book.progress || 0,
        });
        setBookData(book);
      } else {
        setLastOpened(null);
        setBookData(null);
      }
    } else {
      setLastOpened(null);
      setBookData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLastOpened(true);
  }, [fetchLastOpened]);

  return { lastOpened, bookData, loading, refreshLastOpened: fetchLastOpened };
}

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSetting = async (key, value) => {
    if (!settings) return;
    const updated = await StorageService.updateSettings({ [key]: value });
    if (updated) setSettings(updated);
  };

  return { settings, loading, updateSetting };
}
