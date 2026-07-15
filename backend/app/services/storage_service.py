"""BASS PHONK API - Supabase Storage service.

Handles file uploads and URL generation for audio tracks, artwork,
avatars, and wallpapers stored in Supabase Storage buckets.
"""

import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.services.supabase_client import get_supabase_admin

# Bucket names
BUCKET_TRACKS = "tracks"
BUCKET_ARTWORK = "artwork"
BUCKET_AVATARS = "avatars"
BUCKET_WALLPAPERS = "wallpapers"

# Allowed MIME types
AUDIO_MIMES = {"audio/mpeg", "audio/wav", "audio/flac", "audio/x-wav", "audio/x-flac"}
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}

# Extension mapping
MIME_EXT = {
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/flac": ".flac",
    "audio/x-flac": ".flac",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


async def upload_file(
    file: UploadFile,
    bucket: str,
    allowed_mimes: set[str],
    max_size: int,
    subfolder: Optional[str] = None,
) -> dict:
    """Upload a file to a Supabase Storage bucket.

    Args:
        file: The uploaded file object.
        bucket: Target bucket name.
        allowed_mimes: Set of allowed MIME types.
        max_size: Maximum file size in bytes.
        subfolder: Optional subfolder within the bucket.

    Returns:
        dict with 'path' and 'public_url' keys.

    Raises:
        HTTPException: On invalid file type, size exceeded, or upload failure.
    """
    content_type = file.content_type or ""
    if content_type not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{content_type}'. Allowed: {', '.join(allowed_mimes)}",
        )

    content = await file.read()
    if len(content) > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {max_mb:.0f} MB.",
        )

    ext = MIME_EXT.get(content_type, "")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    path = f"{subfolder}/{unique_name}" if subfolder else unique_name

    sb = get_supabase_admin()
    try:
        sb.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": content_type},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {exc}",
        )

    public_url = sb.storage.from_(bucket).get_public_url(path)

    return {"path": path, "public_url": public_url}


async def delete_file(bucket: str, path: str) -> None:
    """Delete a file from a Supabase Storage bucket.

    Args:
        bucket: Bucket name.
        path: File path within the bucket.

    Raises:
        HTTPException: On deletion failure.
    """
    sb = get_supabase_admin()
    try:
        sb.storage.from_(bucket).remove([path])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {exc}",
        )


def get_public_url(bucket: str, path: str) -> str:
    """Get the public URL for a file in storage.

    Args:
        bucket: Bucket name.
        path: File path within the bucket.

    Returns:
        Public URL string.
    """
    sb = get_supabase_admin()
    return sb.storage.from_(bucket).get_public_url(path)
