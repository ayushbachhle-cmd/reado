import { supabase, isSupabaseConfigured } from './supabase';
import { SupabaseStorageService } from './supabaseStorageService';

/**
 * Adapter function to transform a Supabase books row into the UI component data model.
 */
export function formatBook(rawBook) {
  if (!rawBook) return null;

  const coverUrl = SupabaseStorageService.getCoverUrl(rawBook.cover_path);

  return {
    id: rawBook.id,
    title: rawBook.title || 'Untitled',
    author: rawBook.author || 'Unknown Author',
    description: rawBook.description || '',
    cover: coverUrl,
    cover_path: rawBook.cover_path || '',
    type: rawBook.type || 'novel',
    genres: Array.isArray(rawBook.genres) ? rawBook.genres : [],
    status: rawBook.status || 'Ongoing',
    rating: rawBook.rating !== null && rawBook.rating !== undefined ? Number(rawBook.rating) : 5.0,
    chaptersCount: rawBook.chapters_count || 0,
    chapters_count: rawBook.chapters_count || 0,
    createdAt: rawBook.created_at,
    updatedAt: rawBook.updated_at,
  };
}

/**
 * Adapter function to transform a Supabase chapters row into the UI chapter model.
 */
export function formatChapter(rawChapter) {
  if (!rawChapter) return null;

  const pdfUrl = SupabaseStorageService.getPdfUrl(rawChapter.pdf_path);

  return {
    id: rawChapter.id,
    bookId: rawChapter.book_id,
    book_id: rawChapter.book_id,
    chapterNumber: rawChapter.chapter_number,
    chapter_number: rawChapter.chapter_number,
    title: rawChapter.title || `Chapter ${rawChapter.chapter_number}`,
    pdfPath: rawChapter.pdf_path || '',
    pdf_path: rawChapter.pdf_path || '',
    pdfUrl: pdfUrl,
    estimatedPages: rawChapter.estimated_pages || 1,
    estimated_pages: rawChapter.estimated_pages || 1,
    createdAt: rawChapter.created_at,
  };
}

// In-memory cache to prevent repeated Supabase requests on tab switches
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
let cachedBooks = null;
let lastBooksFetchTime = 0;
const cachedBookDetails = new Map(); // id -> { data, timestamp }
const cachedChapters = new Map(); // bookId -> { data, timestamp }

export const BookService = {
  /**
   * Invalidate all in-memory caches (e.g. after refresh).
   */
  clearCache() {
    cachedBooks = null;
    lastBooksFetchTime = 0;
    cachedBookDetails.clear();
    cachedChapters.clear();
  },

  /**
   * Fetch all books from Supabase ordered by creation date descending.
   * Uses in-memory cache unless forceRefresh is true or TTL expired.
   * Returns { data: Book[], error: Error | null }
   */
  async getBooks(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedBooks && now - lastBooksFetchTime < CACHE_TTL_MS) {
      return { data: cachedBooks, error: null };
    }

    if (!isSupabaseConfigured) {
      console.warn('BookService.getBooks: Supabase credentials are not configured.');
      return { data: cachedBooks || [], error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('BookService.getBooks query error:', error.message);
        return { data: cachedBooks || [], error };
      }

      const formatted = (data || []).map(formatBook);
      cachedBooks = formatted;
      lastBooksFetchTime = now;
      // Pre-warm individual book cache
      formatted.forEach((b) => {
        cachedBookDetails.set(b.id, { data: b, timestamp: now });
      });

      return { data: formatted, error: null };
    } catch (err) {
      console.error('BookService.getBooks network exception:', err);
      return { data: cachedBooks || [], error: err };
    }
  },

  /**
   * Fetch a single book by ID from Supabase.
   * Uses in-memory cache if available and fresh.
   * Returns { data: Book | null, error: Error | null }
   */
  async getBookById(id, forceRefresh = false) {
    if (!id) return { data: null, error: new Error('Book ID is required') };

    const now = Date.now();
    const cached = cachedBookDetails.get(id);
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { data: cached.data, error: null };
    }

    if (!isSupabaseConfigured) {
      console.warn('BookService.getBookById: Supabase credentials are not configured.');
      return { data: cached?.data || null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`BookService.getBookById error for id ${id}:`, error.message);
        return { data: cached?.data || null, error };
      }

      if (!data) {
        return { data: null, error: null };
      }

      const formatted = formatBook(data);
      cachedBookDetails.set(id, { data: formatted, timestamp: now });
      return { data: formatted, error: null };
    } catch (err) {
      console.error(`BookService.getBookById network exception for id ${id}:`, err);
      return { data: cached?.data || null, error: err };
    }
  },

  /**
   * Fetch chapters belonging to a book ordered by chapter_number ascending.
   * Uses in-memory cache if available and fresh.
   * Returns { data: Chapter[], error: Error | null }
   */
  async getChaptersByBookId(bookId, forceRefresh = false) {
    if (!bookId) return { data: [], error: new Error('Book ID is required') };

    const now = Date.now();
    const cached = cachedChapters.get(bookId);
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { data: cached.data, error: null };
    }

    if (!isSupabaseConfigured) {
      console.warn('BookService.getChaptersByBookId: Supabase credentials are not configured.');
      return { data: cached?.data || [], error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .order('chapter_number', { ascending: true });

      if (error) {
        console.error(`BookService.getChaptersByBookId error for book ${bookId}:`, error.message);
        return { data: cached?.data || [], error };
      }

      const formatted = (data || []).map(formatChapter);
      cachedChapters.set(bookId, { data: formatted, timestamp: now });
      return { data: formatted, error: null };
    } catch (err) {
      console.error(`BookService.getChaptersByBookId network exception for book ${bookId}:`, err);
      return { data: cached?.data || [], error: err };
    }
  },
};

