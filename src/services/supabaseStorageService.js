import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET_COVERS = 'book-covers';
const BUCKET_PDFS = 'book-pdfs';

export const SupabaseStorageService = {
  /**
   * Resolves the public URL for a book cover image from the 'book-covers' bucket.
   * If the path is already a full HTTPS URL, it is returned unchanged.
   * If missing or unconfigured, returns an empty string safely.
   */
  getCoverUrl(coverPath) {
    if (!coverPath || typeof coverPath !== 'string' || coverPath.trim().length === 0) {
      return '';
    }

    const trimmed = coverPath.trim();

    // Already an absolute HTTP/HTTPS URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (!isSupabaseConfigured) {
      return '';
    }

    try {
      const { data } = supabase.storage.from(BUCKET_COVERS).getPublicUrl(trimmed);
      return data?.publicUrl || '';
    } catch (err) {
      console.warn('SupabaseStorageService.getCoverUrl error:', err);
      return '';
    }
  },

  /**
   * Resolves the public URL for a chapter PDF file from the 'book-pdfs' bucket.
   * If the path is already a full HTTPS URL, it is returned unchanged.
   * If missing or unconfigured, returns an empty string safely.
   */
  getPdfUrl(pdfPath) {
    if (!pdfPath || typeof pdfPath !== 'string' || pdfPath.trim().length === 0) {
      return '';
    }

    const trimmed = pdfPath.trim();

    // Already an absolute HTTP/HTTPS URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (!isSupabaseConfigured) {
      return '';
    }

    try {
      const { data } = supabase.storage.from(BUCKET_PDFS).getPublicUrl(trimmed);
      return data?.publicUrl || '';
    } catch (err) {
      console.warn('SupabaseStorageService.getPdfUrl error:', err);
      return '';
    }
  },
};

