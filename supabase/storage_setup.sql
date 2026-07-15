-- ============================================================================
-- BASS PHONK — Supabase Storage Buckets Setup (Idempotent & Error-Free)
-- ============================================================================
-- Version: 1.1.0
-- Last Updated: 2026-07-15
-- Description: Creates storage buckets and their access policies.
--              Run this in the Supabase SQL Editor AFTER schema.sql.
-- ============================================================================


-- ============================================================================
-- 1. CREATE STORAGE BUCKETS (ON CONFLICT DO NOTHING to avoid duplicate key errors)
-- ============================================================================

-- tracks — Audio files (max 50MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tracks',
    'tracks',
    true,
    52428800,  -- 50 MB
    ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/flac','audio/x-m4a','audio/mp4']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- artwork — Album/track artwork (max 5MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'artwork',
    'artwork',
    true,
    5242880,   -- 5 MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- avatars — User profile pictures (max 2MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152,   -- 2 MB
    ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- wallpapers — Community wallpapers (max 10MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'wallpapers',
    'wallpapers',
    true,
    10485760,  -- 10 MB
    ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================================================
-- 2. STORAGE POLICIES
-- ============================================================================

-- Clean up existing policies first to prevent conflicts
DROP POLICY IF EXISTS "Tracks: public read access" ON storage.objects;
DROP POLICY IF EXISTS "Tracks: authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Tracks: owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Tracks: owner can delete" ON storage.objects;

DROP POLICY IF EXISTS "Artwork: public read access" ON storage.objects;
DROP POLICY IF EXISTS "Artwork: authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Artwork: owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Artwork: owner can delete" ON storage.objects;

DROP POLICY IF EXISTS "Avatars: public read access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: owner can delete" ON storage.objects;

DROP POLICY IF EXISTS "Wallpapers: public read access" ON storage.objects;


-- --------------------------------------------------------------------------
-- TRACKS BUCKET
-- --------------------------------------------------------------------------

-- Anyone can read/download tracks (public bucket)
CREATE POLICY "Tracks: public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'tracks');

-- Authenticated users can upload tracks to their own folder
CREATE POLICY "Tracks: authenticated upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'tracks'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own track files
CREATE POLICY "Tracks: owner can update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'tracks'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own track files
CREATE POLICY "Tracks: owner can delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'tracks'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- --------------------------------------------------------------------------
-- ARTWORK BUCKET
-- --------------------------------------------------------------------------

-- Anyone can view artwork
CREATE POLICY "Artwork: public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'artwork');

-- Authenticated users can upload artwork to their own folder
CREATE POLICY "Artwork: authenticated upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'artwork'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own artwork
CREATE POLICY "Artwork: owner can update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'artwork'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own artwork
CREATE POLICY "Artwork: owner can delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'artwork'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- --------------------------------------------------------------------------
-- AVATARS BUCKET
-- --------------------------------------------------------------------------

-- Anyone can view avatars
CREATE POLICY "Avatars: public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Avatars: authenticated upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
CREATE POLICY "Avatars: owner can update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
CREATE POLICY "Avatars: owner can delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- --------------------------------------------------------------------------
-- WALLPAPERS BUCKET
-- --------------------------------------------------------------------------

-- Anyone can view wallpapers
CREATE POLICY "Wallpapers: public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wallpapers');

-- Only admin/service_role can upload wallpapers
-- This is enforced by NOT having an INSERT policy for authenticated users.
-- Wallpapers are managed via the Supabase Dashboard or service_role API key.

-- ============================================================================
-- DONE — Storage buckets and policies are ready.
-- ============================================================================
