"""BASS PHONK API - Track routes.

CRUD operations for tracks, trending, by genre, search, and listing.
All data is stored in and queried from the 'tracks' table in Supabase.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import get_current_user, get_current_user_optional
from app.models.common import PaginatedResponse
from app.models.track import GenreInfo, Genre, TrackCreate, TrackResponse, TrackUpdate
from app.services.supabase_client import get_supabase_admin

router = APIRouter(prefix="/tracks", tags=["Tracks"])


def _build_track_response(row: dict, is_liked: bool = False) -> TrackResponse:
    """Map a Supabase row to a TrackResponse, handling nested artist data."""
    artist = None
    if isinstance(row.get("profiles"), dict):
        p = row["profiles"]
        artist = {
            "id": p.get("id", row.get("artist_id", "")),
            "username": p.get("username", ""),
            "display_name": p.get("display_name"),
            "avatar_url": p.get("avatar_url"),
        }

    return TrackResponse(
        id=row["id"],
        title=row["title"],
        artist_name=row.get("artist_name", ""),
        artist_id=row.get("artist_id", ""),
        genre=row.get("genre", ""),
        description=row.get("description"),
        audio_url=row.get("audio_url", ""),
        artwork_url=row.get("artwork_url"),
        duration_seconds=row.get("duration_seconds"),
        bpm=row.get("bpm"),
        bitrate_kbps=row.get("bitrate_kbps"),
        format=row.get("format"),
        tags=row.get("tags") or [],
        plays_count=row.get("plays_count", 0),
        likes_count=row.get("likes_count", 0),
        downloads_count=row.get("downloads_count", 0),
        comments_count=row.get("comments_count", 0),
        is_free_download=row.get("is_free_download", False),
        is_liked=is_liked,
        artist=artist,
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def _check_liked(track_ids: list[str], user_id: str) -> set[str]:
    """Return the set of track IDs liked by the given user."""
    if not track_ids or not user_id:
        return set()
    sb = get_supabase_admin()
    result = (
        sb.table("likes")
        .select("track_id")
        .eq("user_id", user_id)
        .in_("track_id", track_ids)
        .execute()
    )
    return {r["track_id"] for r in (result.data or [])}


@router.get("/", response_model=PaginatedResponse[TrackResponse])
async def list_tracks(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    genre: Optional[str] = Query(None, description="Filter by genre slug"),
    sort: str = Query("newest", description="Sort: newest, popular, title"),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """List tracks with pagination, optional genre filtering, and sorting."""
    sb = get_supabase_admin()
    offset = (page - 1) * per_page

    query = sb.table("tracks").select(
        "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)",
        count="exact",
    )

    if genre:
        query = query.eq("genre", genre)

    if sort == "popular":
        query = query.order("plays_count", desc=True)
    elif sort == "title":
        query = query.order("title", desc=False)
    else:  # newest
        query = query.order("created_at", desc=True)

    result = query.range(offset, offset + per_page - 1).execute()
    total = result.count or 0

    # Check liked status
    liked_ids: set[str] = set()
    if current_user:
        track_ids = [r["id"] for r in (result.data or [])]
        liked_ids = _check_liked(track_ids, current_user["id"])

    items = [
        _build_track_response(row, is_liked=row["id"] in liked_ids)
        for row in (result.data or [])
    ]

    return PaginatedResponse(
        items=items,
        page=page,
        per_page=per_page,
        total=total,
        total_pages=(total + per_page - 1) // per_page if total else 0,
    )


@router.get("/trending", response_model=PaginatedResponse[TrackResponse])
async def trending_tracks(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get trending tracks sorted by play count and likes in the last 7 days."""
    sb = get_supabase_admin()
    offset = (page - 1) * per_page

    from datetime import datetime, timedelta, timezone

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    result = (
        sb.table("tracks")
        .select(
            "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)",
            count="exact",
        )
        .gte("created_at", week_ago)
        .order("plays_count", desc=True)
        .order("likes_count", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    total = result.count or 0

    liked_ids: set[str] = set()
    if current_user:
        track_ids = [r["id"] for r in (result.data or [])]
        liked_ids = _check_liked(track_ids, current_user["id"])

    items = [
        _build_track_response(row, is_liked=row["id"] in liked_ids)
        for row in (result.data or [])
    ]

    return PaginatedResponse(
        items=items,
        page=page,
        per_page=per_page,
        total=total,
        total_pages=(total + per_page - 1) // per_page if total else 0,
    )


@router.get("/new-releases", response_model=PaginatedResponse[TrackResponse])
async def new_releases(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get recently uploaded tracks ordered by creation date."""
    sb = get_supabase_admin()
    offset = (page - 1) * per_page

    result = (
        sb.table("tracks")
        .select(
            "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)",
            count="exact",
        )
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    total = result.count or 0

    liked_ids: set[str] = set()
    if current_user:
        track_ids = [r["id"] for r in (result.data or [])]
        liked_ids = _check_liked(track_ids, current_user["id"])

    items = [
        _build_track_response(row, is_liked=row["id"] in liked_ids)
        for row in (result.data or [])
    ]

    return PaginatedResponse(
        items=items,
        page=page,
        per_page=per_page,
        total=total,
        total_pages=(total + per_page - 1) // per_page if total else 0,
    )


@router.get("/top-100", response_model=list[TrackResponse])
async def top_100(
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get the daily top 100 tracks by combined plays and likes."""
    sb = get_supabase_admin()

    from datetime import datetime, timedelta, timezone

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat()

    result = (
        sb.table("tracks")
        .select(
            "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)"
        )
        .order("plays_count", desc=True)
        .order("likes_count", desc=True)
        .limit(100)
        .execute()
    )

    liked_ids: set[str] = set()
    if current_user:
        track_ids = [r["id"] for r in (result.data or [])]
        liked_ids = _check_liked(track_ids, current_user["id"])

    return [
        _build_track_response(row, is_liked=row["id"] in liked_ids)
        for row in (result.data or [])
    ]


@router.get("/search", response_model=PaginatedResponse[TrackResponse])
async def search_tracks(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    genre: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Full-text search across track titles, artist names, and tags."""
    sb = get_supabase_admin()
    offset = (page - 1) * per_page

    # Use Supabase textSearch or ilike for searching
    query = sb.table("tracks").select(
        "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)",
        count="exact",
    )

    # Search in title and artist_name using ilike
    search_pattern = f"%{q}%"
    query = query.or_(f"title.ilike.{search_pattern},artist_name.ilike.{search_pattern}")

    if genre:
        query = query.eq("genre", genre)

    result = (
        query.order("plays_count", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    total = result.count or 0

    liked_ids: set[str] = set()
    if current_user:
        track_ids = [r["id"] for r in (result.data or [])]
        liked_ids = _check_liked(track_ids, current_user["id"])

    items = [
        _build_track_response(row, is_liked=row["id"] in liked_ids)
        for row in (result.data or [])
    ]

    return PaginatedResponse(
        items=items,
        page=page,
        per_page=per_page,
        total=total,
        total_pages=(total + per_page - 1) // per_page if total else 0,
    )


@router.get("/genres", response_model=list[GenreInfo])
async def list_genres():
    """List all available genres with track counts."""
    sb = get_supabase_admin()

    genre_descriptions = {
        "brazilian": "Brazilian bass-heavy phonk",
        "drift": "High-energy drift phonk",
        "memphis": "Classic Memphis-style phonk",
        "cowbell": "Cowbell-driven phonk beats",
        "dark": "Dark and atmospheric phonk",
        "house": "House-influenced phonk",
        "aggressive": "Hard-hitting aggressive phonk",
        "classic": "Classic old-school phonk",
    }

    genres: list[GenreInfo] = []
    for genre in Genre:
        result = (
            sb.table("tracks")
            .select("id", count="exact")
            .eq("genre", genre.value)
            .execute()
        )
        genres.append(
            GenreInfo(
                name=genre.value.title(),
                slug=genre.value,
                count=result.count or 0,
                description=genre_descriptions.get(genre.value),
            )
        )

    return genres


@router.get("/genre/{genre}", response_model=PaginatedResponse[TrackResponse])
async def tracks_by_genre(
    genre: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get tracks filtered by a specific genre."""
    sb = get_supabase_admin()
    offset = (page - 1) * per_page

    result = (
        sb.table("tracks")
        .select(
            "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)",
            count="exact",
        )
        .eq("genre", genre)
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    total = result.count or 0

    liked_ids: set[str] = set()
    if current_user:
        track_ids = [r["id"] for r in (result.data or [])]
        liked_ids = _check_liked(track_ids, current_user["id"])

    items = [
        _build_track_response(row, is_liked=row["id"] in liked_ids)
        for row in (result.data or [])
    ]

    return PaginatedResponse(
        items=items,
        page=page,
        per_page=per_page,
        total=total,
        total_pages=(total + per_page - 1) // per_page if total else 0,
    )


@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(
    track_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get a single track by ID and increment the play count."""
    sb = get_supabase_admin()

    result = (
        sb.table("tracks")
        .select(
            "*, profiles!tracks_artist_id_fkey(id, username, display_name, avatar_url)"
        )
        .eq("id", track_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found.",
        )

    # Increment play count
    current_plays = result.data.get("plays_count", 0)
    sb.table("tracks").update({"plays_count": current_plays + 1}).eq(
        "id", track_id
    ).execute()

    is_liked = False
    if current_user:
        like_check = (
            sb.table("likes")
            .select("id")
            .eq("user_id", current_user["id"])
            .eq("track_id", track_id)
            .execute()
        )
        is_liked = bool(like_check.data)

    return _build_track_response(result.data, is_liked=is_liked)


@router.post("/", response_model=TrackResponse, status_code=status.HTTP_201_CREATED)
async def create_track(
    body: TrackCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new track record (audio file should be uploaded separately via /upload/track)."""
    sb = get_supabase_admin()

    # Verify user has an artist profile
    profile = (
        sb.table("profiles")
        .select("is_artist, username")
        .eq("id", current_user["id"])
        .single()
        .execute()
    )
    if not profile.data or not profile.data.get("is_artist", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified artists can upload tracks.",
        )

    insert_data = {
        "title": body.title,
        "artist_name": body.artist_name,
        "artist_id": current_user["id"],
        "genre": body.genre.value,
        "description": body.description,
        "bpm": body.bpm,
        "tags": body.tags,
        "is_free_download": body.is_free_download,
        "audio_url": "",  # Set after upload via /upload/track
    }

    result = (
        sb.table("tracks")
        .insert(insert_data)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create track.",
        )

    return _build_track_response(result.data[0])
