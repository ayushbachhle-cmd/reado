-- ==============================================================================
-- NOVEL & COMIC READING APP - DATABASE SCHEMA (PHASE 2A)
-- Run this migration in your Supabase Project Dashboard -> SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. BOOKS TABLE
-- Stores catalog metadata for novels and comics.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,                                                       -- Path in Storage (e.g. "covers/comic-1.jpg") or public URL
  type TEXT NOT NULL CHECK (type IN ('novel', 'comic')),                 -- Restricted to novel or comic
  genres TEXT[] NOT NULL DEFAULT '{}',                                   -- Array of genre tags e.g. '{"Fantasy", "Cyberpunk"}'
  status TEXT NOT NULL DEFAULT 'Ongoing' CHECK (status IN ('Ongoing', 'Completed')),
  rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
  chapters_count INTEGER NOT NULL DEFAULT 0,                             -- Maintained automatically via trigger
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. CHAPTERS TABLE
-- Stores chapter metadata and PDF storage paths belonging to each book.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,   -- Cascading delete: deleting a book deletes all its chapters
  chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
  title TEXT NOT NULL,
  pdf_path TEXT NOT NULL,                                                -- Storage path (e.g. "novels/novel-1/chapter-1.pdf")
  estimated_pages INTEGER NOT NULL DEFAULT 1 CHECK (estimated_pages > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_book_chapter UNIQUE (book_id, chapter_number)            -- Prevent duplicate chapter numbers per book
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- Optimizes filtering by type, sorting by date, and fetching book chapters.
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_books_type ON public.books(type);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id_number ON public.chapters(book_id, chapter_number ASC);

-- ==============================================================================
-- 5. AUTOMATIC CHAPTER COUNT TRIGGER
-- Automatically increments/decrements books.chapters_count whenever chapters
-- are inserted, deleted, or reassigned between books.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_chapters_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books
    SET chapters_count = chapters_count + 1,
        updated_at = now()
    WHERE id = NEW.book_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.books
    SET chapters_count = GREATEST(0, chapters_count - 1),
        updated_at = now()
    WHERE id = OLD.book_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.book_id <> OLD.book_id THEN
    -- Handled in case a chapter is reassigned to another book
    UPDATE public.books
    SET chapters_count = GREATEST(0, chapters_count - 1),
        updated_at = now()
    WHERE id = OLD.book_id;

    UPDATE public.books
    SET chapters_count = chapters_count + 1,
        updated_at = now()
    WHERE id = NEW.book_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chapters_count_change ON public.chapters;
CREATE TRIGGER trg_chapters_count_change
AFTER INSERT OR DELETE OR UPDATE OF book_id ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.handle_chapters_count_change();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Read-only access for client applications (anon and authenticated).
-- ==============================================================================

-- Enable RLS on both tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Allow public read access to books" ON public.books;
DROP POLICY IF EXISTS "Allow public read access to chapters" ON public.chapters;

-- Read policy: Anyone (anon client or authenticated user) can read books
CREATE POLICY "Allow public read access to books"
ON public.books
FOR SELECT
TO anon, authenticated
USING (true);

-- Read policy: Anyone (anon client or authenticated user) can read chapters
CREATE POLICY "Allow public read access to chapters"
ON public.chapters
FOR SELECT
TO anon, authenticated
USING (true);

-- ==============================================================================
-- 7. ROLE PERMISSIONS & GRANTS
-- Explicit schema usage and SELECT grants for client access.
-- Explicit revocation of mutation privileges for client roles.
-- ==============================================================================

-- Grant schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant read privileges to client roles
GRANT SELECT ON TABLE public.books TO anon, authenticated;
GRANT SELECT ON TABLE public.chapters TO anon, authenticated;

-- Explicitly revoke write privileges from client roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.books FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.chapters FROM anon, authenticated;
