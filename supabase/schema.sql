-- ============================================================================
-- BASS PHONK — Complete Supabase Database Schema (Error-Free Setup)
-- ============================================================================
-- Version: 1.4.0
-- Last Updated: 2026-07-15
-- Description: Paste directly into Supabase SQL Editor.
--              Includes self-cleaning drop statements, ordered table definitions,
--              fail-safe trigger guards, and pre-formatted seed data.
-- ============================================================================

-- ============================================================================
-- 0. CLEAN RESET (Drops existing objects to ensure a clean install)
-- ============================================================================

-- Safely drop auth trigger inside DO block to prevent permission/existence errors
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipped dropping trigger on auth.users: %', SQLERRM;
END
$$;

-- Drop triggers in public schema
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_tracks_updated_at ON public.tracks;
DROP TRIGGER IF EXISTS trg_playlists_updated_at ON public.playlists;
DROP TRIGGER IF EXISTS trg_comments_updated_at ON public.comments;
DROP TRIGGER IF EXISTS trg_likes_count ON public.likes;
DROP TRIGGER IF EXISTS trg_playlist_stats ON public.playlist_tracks;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_play_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_playlist_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_trending_tracks(INT) CASCADE;
DROP FUNCTION IF EXISTS public.get_weekly_leaderboard(INT) CASCADE;
DROP FUNCTION IF EXISTS public.search_tracks(TEXT, INT) CASCADE;

-- Drop tables (Cascade handles foreign keys automatically)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.wallpapers CASCADE;
DROP TABLE IF EXISTS public.downloads CASCADE;
DROP TABLE IF EXISTS public.play_history CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.playlist_tracks CASCADE;
DROP TABLE IF EXISTS public.playlists CASCADE;
DROP TABLE IF EXISTS public.tracks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES (Created in exact dependency order)
-- ============================================================================

-- 2a. profiles (Linked to user accounts by ID, foreign key constraint omitted to avoid migration ordering issues)
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL
                        CHECK (char_length(username) >= 3 AND char_length(username) <= 30
                               AND username ~ '^[a-zA-Z0-9_]+$'),
    display_name    TEXT,
    avatar_url      TEXT,
    bio             TEXT CHECK (char_length(bio) <= 500),
    is_artist       BOOLEAN DEFAULT false,
    is_premium      BOOLEAN DEFAULT false,
    premium_until   TIMESTAMPTZ,
    badge_ids       TEXT[] DEFAULT '{}',
    total_plays     INT DEFAULT 0,
    total_likes_received INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth accounts';

-- 2b. tracks
CREATE TABLE public.tracks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    artist_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    artist_name     TEXT NOT NULL,
    album           TEXT,
    genre           TEXT NOT NULL
                        CHECK (genre IN ('brazilian','drift','memphis','cowbell','dark','underground','aggressive','house','gym','wave','tiktok')),
    subgenre        TEXT,
    bpm             INT CHECK (bpm >= 60 AND bpm <= 300),
    duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
    audio_url       TEXT NOT NULL,
    artwork_url     TEXT,
    waveform_data   JSONB,
    play_count      INT DEFAULT 0,
    like_count      INT DEFAULT 0,
    is_featured     BOOLEAN DEFAULT false,
    is_trending     BOOLEAN DEFAULT false,
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.tracks IS 'Music tracks';

-- 2c. playlists
CREATE TABLE public.playlists (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL,
    description             TEXT,
    cover_url               TEXT,
    creator_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_public               BOOLEAN DEFAULT true,
    is_curated              BOOLEAN DEFAULT false,
    category                TEXT CHECK (category IS NULL OR category IN (
                                'gym','gaming','night_drive','car_meet','workout','tiktok_trending')),
    track_count             INT DEFAULT 0,
    total_duration_seconds  INT DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.playlists IS 'User-created and curated playlists';

-- 2d. playlist_tracks (Junction table)
CREATE TABLE public.playlist_tracks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id    UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    position    INT NOT NULL CHECK (position >= 0),
    added_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (playlist_id, track_id)
);

-- 2e. comments
CREATE TABLE public.comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id    UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL CHECK (char_length(content) <= 1000),
    parent_id   UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    is_edited   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2f. likes
CREATE TABLE public.likes (
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id    UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, track_id)
);

-- 2g. follows
CREATE TABLE public.follows (
    follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 2h. play_history
CREATE TABLE public.play_history (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id          UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    played_at         TIMESTAMPTZ DEFAULT now(),
    duration_listened INT CHECK (duration_listened >= 0)
);

-- 2i. downloads
CREATE TABLE public.downloads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id        UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    downloaded_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, track_id)
);

-- 2j. wallpapers
CREATE TABLE public.wallpapers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    image_url       TEXT NOT NULL,
    thumbnail_url   TEXT,
    category        TEXT NOT NULL
                        CHECK (category IN ('cars','anime','cyberpunk','jdm','skyline',
                                            'supra','drift','dark_aesthetic')),
    is_premium      BOOLEAN DEFAULT false,
    download_count  INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2k. badges
CREATE TABLE public.badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url    TEXT,
    criteria    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2l. user_badges
CREATE TABLE public.user_badges (
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id  UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

-- 2m. reports
CREATE TABLE public.reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_type   TEXT NOT NULL CHECK (reported_type IN ('track','comment','user')),
    reported_id     UUID NOT NULL,
    reason          TEXT NOT NULL,
    status          TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','reviewed','resolved','dismissed')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2n. notifications
CREATE TABLE public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('like','comment','follow','badge','system')),
    title       TEXT NOT NULL,
    body        TEXT,
    data        JSONB,
    is_read     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================
CREATE INDEX idx_tracks_genre          ON public.tracks (genre);
CREATE INDEX idx_tracks_artist_id      ON public.tracks (artist_id);
CREATE INDEX idx_tracks_play_count     ON public.tracks (play_count DESC);
CREATE INDEX idx_tracks_created_at     ON public.tracks (created_at DESC);
CREATE INDEX idx_tracks_is_trending    ON public.tracks (is_trending) WHERE is_trending = true;
CREATE INDEX idx_tracks_is_featured    ON public.tracks (is_featured) WHERE is_featured = true;

CREATE INDEX idx_tracks_fts ON public.tracks
    USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(artist_name,'')));

CREATE INDEX idx_playlists_creator_id  ON public.playlists (creator_id);
CREATE INDEX idx_playlists_category    ON public.playlists (category);
CREATE INDEX idx_playlists_is_curated  ON public.playlists (is_curated) WHERE is_curated = true;

CREATE INDEX idx_playlist_tracks_playlist ON public.playlist_tracks (playlist_id, position);
CREATE INDEX idx_comments_track_created ON public.comments (track_id, created_at DESC);
CREATE INDEX idx_likes_track_id ON public.likes (track_id);
CREATE INDEX idx_follows_following_id ON public.follows (following_id);
CREATE INDEX idx_play_history_user_played ON public.play_history (user_id, played_at DESC);
CREATE INDEX idx_notifications_user_read ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_downloads_user_id ON public.downloads (user_id);
CREATE INDEX idx_wallpapers_category ON public.wallpapers (category);

-- ============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================================

-- 4a. handle_new_user() — Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g')),
            'user_' || SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8)
        ),
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        INSERT INTO public.profiles (id, username, display_name, avatar_url)
        VALUES (
            NEW.id,
            'user_' || SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12),
            COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
            NEW.raw_user_meta_data ->> 'avatar_url'
        );
        RETURN NEW;
END;
$$;

-- Safely wrap trigger creation in DO block to handle auth.users schema access errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipped creating trigger on auth.users (likely permission/existence issue): %', SQLERRM;
END
$$;

-- 4b. update_updated_at() — Auto-set updated_at on row update
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_tracks_updated_at
    BEFORE UPDATE ON public.tracks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_playlists_updated_at
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4c. increment_play_count(track_id) — Atomic play count increment
CREATE OR REPLACE FUNCTION public.increment_play_count(p_track_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.tracks
       SET play_count = play_count + 1
     WHERE id = p_track_id;

    UPDATE public.profiles
       SET total_plays = total_plays + 1
     WHERE id = (SELECT artist_id FROM public.tracks WHERE id = p_track_id);
END;
$$;

-- 4d. update_like_count() — Trigger on likes insert/delete
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.tracks
           SET like_count = like_count + 1
         WHERE id = NEW.track_id;

        UPDATE public.profiles
           SET total_likes_received = total_likes_received + 1
         WHERE id = (SELECT artist_id FROM public.tracks WHERE id = NEW.track_id);

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.tracks
           SET like_count = GREATEST(like_count - 1, 0)
         WHERE id = OLD.track_id;

        UPDATE public.profiles
           SET total_likes_received = GREATEST(total_likes_received - 1, 0)
         WHERE id = (SELECT artist_id FROM public.tracks WHERE id = OLD.track_id);

        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER trg_likes_count
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_like_count();

-- 4e. update_playlist_stats() — Trigger on playlist_tracks changes
CREATE OR REPLACE FUNCTION public.update_playlist_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_playlist_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_playlist_id := OLD.playlist_id;
    ELSE
        v_playlist_id := NEW.playlist_id;
    END IF;

    UPDATE public.playlists
       SET track_count = (
               SELECT COUNT(*) FROM public.playlist_tracks WHERE playlist_id = v_playlist_id
           ),
           total_duration_seconds = COALESCE((
               SELECT SUM(t.duration_seconds)
                 FROM public.playlist_tracks pt
                 JOIN public.tracks t ON t.id = pt.track_id
                WHERE pt.playlist_id = v_playlist_id
           ), 0),
           updated_at = now()
     WHERE id = v_playlist_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_playlist_stats
    AFTER INSERT OR DELETE ON public.playlist_tracks
    FOR EACH ROW EXECUTE FUNCTION public.update_playlist_stats();

-- 4f. get_trending_tracks(limit) — Weighted trending algorithm
CREATE OR REPLACE FUNCTION public.get_trending_tracks(p_limit INT DEFAULT 20)
RETURNS SETOF public.tracks
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT t.*
      FROM public.tracks t
     ORDER BY (
         (SELECT COUNT(*) FROM public.play_history ph
           WHERE ph.track_id = t.id
             AND ph.played_at >= now() - INTERVAL '7 days') * 3
         +
         (SELECT COUNT(*) FROM public.likes l
           WHERE l.track_id = t.id
             AND l.created_at >= now() - INTERVAL '7 days') * 5
         +
         t.play_count * 0.1
     ) DESC
     LIMIT p_limit;
$$;

-- 4g. get_weekly_leaderboard(limit) — Weekly plays leaderboard
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_limit INT DEFAULT 50)
RETURNS TABLE (
    track_id        UUID,
    track_title     TEXT,
    artist_name     TEXT,
    artwork_url     TEXT,
    weekly_plays    BIGINT,
    total_plays     INT,
    like_count      INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        t.id            AS track_id,
        t.title         AS track_title,
        t.artist_name   AS artist_name,
        t.artwork_url   AS artwork_url,
        COUNT(ph.id)    AS weekly_plays,
        t.play_count    AS total_plays,
        t.like_count    AS like_count
      FROM public.tracks t
      LEFT JOIN public.play_history ph
        ON ph.track_id = t.id
       AND ph.played_at >= now() - INTERVAL '7 days'
     GROUP BY t.id
    HAVING COUNT(ph.id) > 0
     ORDER BY weekly_plays DESC
     LIMIT p_limit;
$$;

-- 4h. search_tracks(query, limit) — Full-text search helper
CREATE OR REPLACE FUNCTION public.search_tracks(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS SETOF public.tracks
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
      FROM public.tracks
     WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(artist_name,''))
           @@ plainto_tsquery('english', p_query)
     ORDER BY play_count DESC
     LIMIT p_limit;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallpapers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles: anyone can view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: users can update own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Tracks: anyone can view" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Tracks: artists can insert own" ON public.tracks FOR INSERT WITH CHECK (auth.uid() = artist_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_artist = true));
CREATE POLICY "Tracks: owner can update" ON public.tracks FOR UPDATE USING (auth.uid() = artist_id) WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Tracks: owner can delete" ON public.tracks FOR DELETE USING (auth.uid() = artist_id);

CREATE POLICY "Playlists: public are viewable" ON public.playlists FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "Playlists: authenticated can create" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Playlists: owner can update" ON public.playlists FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Playlists: owner can delete" ON public.playlists FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Playlist tracks: viewable if playlist is visible" ON public.playlist_tracks FOR SELECT USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND (p.is_public = true OR p.creator_id = auth.uid())) );
CREATE POLICY "Playlist tracks: owner can insert" ON public.playlist_tracks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.creator_id = auth.uid()));
CREATE POLICY "Playlist tracks: owner can delete" ON public.playlist_tracks FOR DELETE USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.creator_id = auth.uid()));

CREATE POLICY "Comments: anyone can view" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments: authenticated can insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments: owner can update" ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments: owner can delete" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes: anyone can view" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Likes: authenticated can insert own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Likes: authenticated can delete own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Follows: anyone can view" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Follows: authenticated can insert own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Follows: authenticated can delete own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Play history: users can view own" ON public.play_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Play history: users can insert own" ON public.play_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Downloads: users can view own" ON public.downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Downloads: users can insert own" ON public.downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Downloads: users can delete own" ON public.downloads FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Wallpapers: anyone can view" ON public.wallpapers FOR SELECT USING (true);
CREATE POLICY "Badges: anyone can view" ON public.badges FOR SELECT USING (true);
CREATE POLICY "User badges: anyone can view" ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "Reports: authenticated can insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Notifications: users can view own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications: users can update own (mark read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- 6a. Badges
INSERT INTO public.badges (name, description, icon_url, criteria) VALUES
    ('First Play',        'Listened to your first track',               '/badges/first_play.svg',        '{"type": "plays", "threshold": 1}'),
    ('Bass Addict',       'Listened to 50 tracks',                      '/badges/bass_addict.svg',       '{"type": "plays", "threshold": 50}'),
    ('Century Club',      'Hit 100 total plays',                        '/badges/century_club.svg',      '{"type": "plays", "threshold": 100}'),
    ('Phonk Master',      'Reached 1,000 total plays',                  '/badges/phonk_master.svg',      '{"type": "plays", "threshold": 1000}'),
    ('Heartbreaker',      'Received 100 likes on your tracks',          '/badges/heartbreaker.svg',      '{"type": "likes_received", "threshold": 100}'),
    ('Night Rider',       'Listened to 10 tracks between midnight and 5 AM', '/badges/night_rider.svg',  '{"type": "night_plays", "threshold": 10}'),
    ('Genre Explorer',    'Listened to tracks in all 6 genres',         '/badges/genre_explorer.svg',    '{"type": "genres_explored", "threshold": 6}'),
    ('OG Supporter',      'Joined BASS PHONK in the first month',      '/badges/og_supporter.svg',      '{"type": "early_adopter", "threshold": 30}');

-- 6b. Demo Profiles
INSERT INTO public.profiles (id, username, display_name, bio, is_artist, total_plays, total_likes_received) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'driftking808',    'DRIFT KING 808',    'Brazilian phonk producer from São Paulo 🇧🇷 Bass & cowbell specialist.',         true,  12450, 890),
    ('a0000000-0000-0000-0000-000000000002', 'memphis_demon',   'MEMPHIS DEMON',     'Dark Memphis phonk. Three 6 Mafia inspired. Underground forever.',               true,  8900,  650),
    ('a0000000-0000-0000-0000-000000000003', 'bassquake_',      'BASSQUAKE',         'Shaking subwoofers since 2019. Drift phonk & car meet anthems.',                  true,  15200, 1200),
    ('a0000000-0000-0000-0000-000000000004', 'cowbell_cartel',  'COWBELL CARTEL',    'If it ain''t got cowbell, it ain''t phonk. 🔔',                                   true,  6300,  430),
    ('a0000000-0000-0000-0000-000000000005', 'nightshift_808',  'NIGHTSHIFT',        'Late night vibes only. Dark phonk producer & DJ. Bookings open.',                 true,  9800,  720);

-- 6c. Tracks (25 across all genres)
INSERT INTO public.tracks (title, artist_id, artist_name, album, genre, subgenre, bpm, duration_seconds, audio_url, artwork_url, play_count, like_count, is_featured, is_trending, tags) VALUES
    ('Baile do Submundo',         'a0000000-0000-0000-0000-000000000001', 'DRIFT KING 808',  'Submundo Vol. 1',      'brazilian',   'funk phonk',   140, 198, '/tracks/baile_do_submundo.mp3',     '/artwork/baile_submundo.jpg',     4520, 312, true,  true,  '{"bass","brazil","funk"}'),
    ('Cowbell Inferno',           'a0000000-0000-0000-0000-000000000001', 'DRIFT KING 808',  'Submundo Vol. 1',      'brazilian',   'cowbell funk',  145, 175, '/tracks/cowbell_inferno.mp3',       '/artwork/cowbell_inferno.jpg',    3200, 245, false, true,  '{"cowbell","brazil","fire"}'),
    ('Favela Bass',               'a0000000-0000-0000-0000-000000000001', 'DRIFT KING 808',  NULL,                   'brazilian',   NULL,            138, 210, '/tracks/favela_bass.mp3',           '/artwork/favela_bass.jpg',        2890, 198, false, false, '{"favela","bass","heavy"}'),
    ('Noite Sem Fim',             'a0000000-0000-0000-0000-000000000001', 'DRIFT KING 808',  'Noite Eterna',         'brazilian',   'dark funk',     135, 224, '/tracks/noite_sem_fim.mp3',         '/artwork/noite_sem_fim.jpg',      1840, 134, false, false, '{"night","dark","brazil"}'),
    ('Midnight Touge',            'a0000000-0000-0000-0000-000000000003', 'BASSQUAKE',       'Mountain Pass',        'drift',       'touge',         130, 240, '/tracks/midnight_touge.mp3',        '/artwork/midnight_touge.jpg',     6780, 520, true,  true,  '{"drift","jdm","night","touge"}'),
    ('Eurobeat Underworld',       'a0000000-0000-0000-0000-000000000003', 'BASSQUAKE',       'Mountain Pass',        'drift',       NULL,            155, 195, '/tracks/eurobeat_underworld.mp3',   '/artwork/eurobeat_under.jpg',     4300, 380, false, true,  '{"eurobeat","drift","speed"}'),
    ('Sideways Anthem',           'a0000000-0000-0000-0000-000000000003', 'BASSQUAKE',       NULL,                   'drift',       'car meet',      128, 218, '/tracks/sideways_anthem.mp3',       '/artwork/sideways.jpg',           3950, 290, true,  false, '{"drift","car","anthem"}'),
    ('Smoke & Tires',             'a0000000-0000-0000-0000-000000000003', 'BASSQUAKE',       'Burnout Season',       'drift',       NULL,            132, 185, '/tracks/smoke_tires.mp3',           '/artwork/smoke_tires.jpg',        2100, 175, false, false, '{"smoke","tires","drift"}'),
    ('Sideways City',             'a0000000-0000-0000-0000-000000000003', 'BASSQUAKE',       'Burnout Season',       'drift',       NULL,            136, 202, '/tracks/skid_marks.mp3',            '/artwork/skid_marks.jpg',         1760, 142, false, false, '{"skid","drift","bass"}'),
    ('Triple Six Ritual',         'a0000000-0000-0000-0000-000000000002', 'MEMPHIS DEMON',   'Ritual Tape',          'memphis',     'horrorcore',    78,  265, '/tracks/triple_six_ritual.mp3',     '/artwork/triple_six.jpg',         5600, 410, true,  true,  '{"memphis","dark","ritual","horrorcore"}'),
    ('Sippin on Darkness',        'a0000000-0000-0000-0000-000000000002', 'MEMPHIS DEMON',   'Ritual Tape',          'memphis',     NULL,            82,  230, '/tracks/sippin_darkness.mp3',       '/artwork/sippin_dark.jpg',        3400, 265, false, true,  '{"memphis","sip","dark"}'),
    ('Casket Music',              'a0000000-0000-0000-0000-000000000002', 'MEMPHIS DEMON',   NULL,                   'memphis',     'lo-fi',         75,  248, '/tracks/casket_music.mp3',          '/artwork/casket_music.jpg',       2200, 180, false, false, '{"casket","memphis","lofi"}'),
    ('Graveyard Shift',           'a0000000-0000-0000-0000-000000000002', 'MEMPHIS DEMON',   'Underworld Chronicles','memphis',     NULL,            80,  215, '/tracks/graveyard_shift.mp3',       '/artwork/graveyard.jpg',          1950, 155, false, false, '{"graveyard","memphis","night"}'),
    ('Cowbell Massacre',          'a0000000-0000-0000-0000-000000000004', 'COWBELL CARTEL',  'Bell Season',          'cowbell',     NULL,            140, 188, '/tracks/cowbell_massacre.mp3',      '/artwork/cowbell_massacre.jpg',   3100, 245, true,  true,  '{"cowbell","bell","hard"}'),
    ('Ring Ring Phonk',           'a0000000-0000-0000-0000-000000000004', 'COWBELL CARTEL',  'Bell Season',          'cowbell',     NULL,            142, 172, '/tracks/ring_ring_phonk.mp3',       '/artwork/ring_ring.jpg',          2650, 198, false, false, '{"cowbell","ring","bounce"}'),
    ('Bell Tower Bass',           'a0000000-0000-0000-0000-000000000004', 'COWBELL CARTEL',  NULL,                   'cowbell',     'heavy bell',    138, 195, '/tracks/bell_tower_bass.mp3',       '/artwork/bell_tower.jpg',         1900, 148, false, false, '{"bell","tower","bass"}'),
    ('Ding Dong Drift',           'a0000000-0000-0000-0000-000000000004', 'COWBELL CARTEL',  'Bell Season',          'cowbell',     NULL,            145, 168, '/tracks/ding_dong_drift.mp3',       '/artwork/ding_dong.jpg',          1650, 120, false, false, '{"ding","drift","cowbell"}'),
    ('Shadow Realm',              'a0000000-0000-0000-0000-000000000005', 'NIGHTSHIFT',      'After Hours',          'dark',        'ambient dark',  90,  280, '/tracks/shadow_realm.mp3',          '/artwork/shadow_realm.jpg',       4800, 370, true,  true,  '{"shadow","dark","ambient"}'),
    ('3AM Demons',                'a0000000-0000-0000-0000-000000000005', 'NIGHTSHIFT',      'After Hours',          'dark',        NULL,            85,  255, '/tracks/3am_demons.mp3',            '/artwork/3am_demons.jpg',         3600, 280, false, true,  '{"3am","demons","dark"}'),
    ('Void Walker',               'a0000000-0000-0000-0000-000000000005', 'NIGHTSHIFT',      NULL,                   'dark',        'industrial',    95,  238, '/tracks/void_walker.mp3',           '/artwork/void_walker.jpg',        2700, 210, false, false, '{"void","dark","industrial"}'),
    ('Eternal Midnight',          'a0000000-0000-0000-0000-000000000005', 'NIGHTSHIFT',      'After Hours',          'dark',        NULL,            88,  270, '/tracks/eternal_midnight.mp3',      '/artwork/eternal_midnight.jpg',   2100, 165, false, false, '{"eternal","midnight","dark"}'),
    ('Sewer Levels',              'a0000000-0000-0000-0000-000000000002', 'MEMPHIS DEMON',   'Underworld Chronicles','underground', 'raw',           92,  225, '/tracks/sewer_levels.mp3',          '/artwork/sewer_levels.jpg',       1800, 140, false, false, '{"sewer","underground","raw"}'),
    ('Concrete Jungle Phonk',    'a0000000-0000-0000-0000-000000000005', 'NIGHTSHIFT',      NULL,                   'underground', NULL,            98,  210, '/tracks/concrete_jungle.mp3',       '/artwork/concrete_jungle.jpg',    2300, 185, true,  false, '{"concrete","jungle","underground"}'),
    ('Lo-Fi Mafia',              'a0000000-0000-0000-0000-000000000002', 'MEMPHIS DEMON',   NULL,                   'underground', 'lo-fi',         80,  195, '/tracks/lofi_mafia.mp3',            '/artwork/lofi_mafia.jpg',         1500, 115, false, false, '{"lofi","mafia","underground"}'),
    ('Basement Tapes',            'a0000000-0000-0000-0000-000000000004', 'COWBELL CARTEL',  NULL,                   'underground', 'tape',          88,  232, '/tracks/basement_tapes.mp3',        '/artwork/basement_tapes.jpg',     1350, 98,  false, false, '{"basement","tape","underground"}');

-- 6d. Curated Playlists
INSERT INTO public.playlists (name, description, cover_url, creator_id, is_public, is_curated, category) VALUES
    ('Gym Phonk 💪',       'Heavy bass and aggressive phonk for your PR lifts. Maximum intensity.',                                '/covers/gym_phonk.jpg',        'a0000000-0000-0000-0000-000000000001', true, true, 'gym'),
    ('Gaming Phonk 🎮',    'Non-stop phonk for gaming sessions. Stay locked in.',                                                  '/covers/gaming_phonk.jpg',     'a0000000-0000-0000-0000-000000000001', true, true, 'gaming'),
    ('Night Drive 🌃',     'Late night cruising vibes. Dark phonk for empty highways.',                                            '/covers/night_drive.jpg',      'a0000000-0000-0000-0000-000000000001', true, true, 'night_drive'),
    ('Car Meet Bangers 🏎️','The hardest tracks for car meets and shows. Subwoofer tested.',                                        '/covers/car_meet.jpg',         'a0000000-0000-0000-0000-000000000001', true, true, 'car_meet'),
    ('Workout Phonk 🔥',   'Push through your limits with relentless phonk beats.',                                                '/covers/workout_phonk.jpg',    'a0000000-0000-0000-0000-000000000001', true, true, 'workout'),
    ('TikTok Trending 📱', 'The phonk tracks blowing up on TikTok right now. Updated weekly.',                                     '/covers/tiktok_trending.jpg',  'a0000000-0000-0000-0000-000000000001', true, true, 'tiktok_trending');

-- Add tracks to playlists (using subqueries to get IDs)
INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.id, row_number() OVER () - 1
  FROM public.playlists p
  CROSS JOIN (
      SELECT id FROM public.tracks WHERE title IN ('Baile do Submundo','Cowbell Massacre','Midnight Touge','Sideways Anthem','Triple Six Ritual')
  ) t
 WHERE p.name = 'Gym Phonk 💪';

INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.id, row_number() OVER () - 1
  FROM public.playlists p
  CROSS JOIN (
      SELECT id FROM public.tracks WHERE title IN ('Shadow Realm','3AM Demons','Eurobeat Underworld','Ring Ring Phonk','Casket Music')
  ) t
 WHERE p.name = 'Gaming Phonk 🎮';

INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.id, row_number() OVER () - 1
  FROM public.playlists p
  CROSS JOIN (
      SELECT id FROM public.tracks WHERE title IN ('Midnight Touge','Shadow Realm','3AM Demons','Eternal Midnight','Noite Sem Fim')
  ) t
 WHERE p.name = 'Night Drive 🌃';

INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.id, row_number() OVER () - 1
  FROM public.playlists p
  CROSS JOIN (
      SELECT id FROM public.tracks WHERE title IN ('Sideways Anthem','Smoke & Tires','Sideways City','Cowbell Inferno','Baile do Submundo')
  ) t
 WHERE p.name = 'Car Meet Bangers 🏎️';

INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.id, row_number() OVER () - 1
  FROM public.playlists p
  CROSS JOIN (
      SELECT id FROM public.tracks WHERE title IN ('Cowbell Massacre','Triple Six Ritual','Baile do Submundo','Bell Tower Bass','Favela Bass')
  ) t
 WHERE p.name = 'Workout Phonk 🔥';

INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.id, row_number() OVER () - 1
  FROM public.playlists p
  CROSS JOIN (
      SELECT id FROM public.tracks WHERE title IN ('Midnight Touge','Cowbell Massacre','Baile do Submundo','Shadow Realm','Eurobeat Underworld')
  ) t
 WHERE p.name = 'TikTok Trending 📱';

-- 6e. Wallpapers
INSERT INTO public.wallpapers (title, image_url, thumbnail_url, category, is_premium, download_count) VALUES
    ('Midnight R34 GTR',             '/wallpapers/midnight_r34.jpg',          '/wallpapers/thumbs/midnight_r34.jpg',          'jdm',            false, 2340),
    ('Neon Supra MK4',               '/wallpapers/neon_supra.jpg',            '/wallpapers/thumbs/neon_supra.jpg',            'supra',          false, 3120),
    ('Cyberpunk Skyline',            '/wallpapers/cyberpunk_skyline.jpg',     '/wallpapers/thumbs/cyberpunk_skyline.jpg',     'cyberpunk',      false, 1890),
    ('Tokyo Drift Vibes',            '/wallpapers/tokyo_drift.jpg',           '/wallpapers/thumbs/tokyo_drift.jpg',           'drift',          false, 2780),
    ('Dark Aesthetic Night',         '/wallpapers/dark_aesthetic.jpg',        '/wallpapers/thumbs/dark_aesthetic.jpg',        'dark_aesthetic',  false, 1560),
    ('R35 GTR Liberty Walk',         '/wallpapers/r35_liberty.jpg',           '/wallpapers/thumbs/r35_liberty.jpg',           'jdm',            false, 2100),
    ('Anime Drift Girl',             '/wallpapers/anime_drift.jpg',           '/wallpapers/thumbs/anime_drift.jpg',           'anime',          false, 4200),
    ('BNR32 Skyline Sunset',         '/wallpapers/bnr32_sunset.jpg',          '/wallpapers/thumbs/bnr32_sunset.jpg',          'skyline',        false, 1750),
    ('Supra A80 Rain',               '/wallpapers/supra_rain.jpg',            '/wallpapers/thumbs/supra_rain.jpg',            'supra',          true,  980),
    ('Cyberpunk City Bass',          '/wallpapers/cyber_city.jpg',            '/wallpapers/thumbs/cyber_city.jpg',            'cyberpunk',      true,  1200),
    ('JDM Parking Garage',           '/wallpapers/jdm_garage.jpg',            '/wallpapers/thumbs/jdm_garage.jpg',            'cars',           false, 1650),
    ('Anime Bass Girl Neon',         '/wallpapers/anime_neon.jpg',            '/wallpapers/thumbs/anime_neon.jpg',            'anime',          true,  3500),
    ('Drifting Through Smoke',       '/wallpapers/drift_smoke.jpg',           '/wallpapers/thumbs/drift_smoke.jpg',           'drift',          false, 2200),
    ('Dark Highway Aesthetic',       '/wallpapers/dark_highway.jpg',          '/wallpapers/thumbs/dark_highway.jpg',          'dark_aesthetic',  false, 1430),
    ('Hakosuka Skyline Legend',      '/wallpapers/hakosuka.jpg',              '/wallpapers/thumbs/hakosuka.jpg',              'skyline',        false, 1380);

-- 6f. Sample Comments
INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000002', 'This track hits different at 3AM on the highway 🔥' FROM public.tracks WHERE title = 'Midnight Touge';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000004', 'Insane bass line. My subs can barely handle this' FROM public.tracks WHERE title = 'Midnight Touge';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000003', 'Brazilian phonk never misses. Need more tracks like this 🇧🇷' FROM public.tracks WHERE title = 'Baile do Submundo';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000005', 'Added to my car meet playlist immediately' FROM public.tracks WHERE title = 'Baile do Submundo';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000001', 'Dark phonk masterpiece. The atmosphere is unreal' FROM public.tracks WHERE title = 'Shadow Realm';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000003', 'Memphis phonk at its finest. Three 6 would be proud' FROM public.tracks WHERE title = 'Triple Six Ritual';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000001', 'That cowbell pattern is stuck in my head 🔔' FROM public.tracks WHERE title = 'Cowbell Massacre';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000005', 'Perfect gym track. PRed my deadlift to this' FROM public.tracks WHERE title = 'Cowbell Massacre';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000004', 'The dark vibes on this one are immaculate' FROM public.tracks WHERE title = '3AM Demons';

INSERT INTO public.comments (track_id, user_id, content)
SELECT id, 'a0000000-0000-0000-0000-000000000002', 'Eurobeat meets phonk? Didn''t know I needed this' FROM public.tracks WHERE title = 'Eurobeat Underworld';

-- 6g. Sample Likes
INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM public.tracks WHERE title = 'Midnight Touge';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM public.tracks WHERE title = 'Midnight Touge';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000005', id FROM public.tracks WHERE title = 'Midnight Touge';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM public.tracks WHERE title = 'Baile do Submundo';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000005', id FROM public.tracks WHERE title = 'Baile do Submundo';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM public.tracks WHERE title = 'Shadow Realm';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM public.tracks WHERE title = 'Shadow Realm';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM public.tracks WHERE title = 'Triple Six Ritual';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM public.tracks WHERE title = 'Triple Six Ritual';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM public.tracks WHERE title = 'Cowbell Massacre';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000005', id FROM public.tracks WHERE title = 'Cowbell Massacre';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM public.tracks WHERE title = '3AM Demons';

INSERT INTO public.likes (user_id, track_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM public.tracks WHERE title = '3AM Demons';

-- 6h. Sample Follows
INSERT INTO public.follows (follower_id, following_id) VALUES
    ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'),
    ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'),
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003'),
    ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005'),
    ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005'),
    ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002');
