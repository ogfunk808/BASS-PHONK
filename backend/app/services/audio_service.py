"""BASS PHONK API - Audio file validation and metadata extraction.

Uses mutagen for reading audio metadata (duration, bitrate, sample rate)
from uploaded audio files.
"""

import io
from dataclasses import dataclass
from typing import Optional

from mutagen import File as MutagenFile
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.wave import WAVE


@dataclass
class AudioMetadata:
    """Extracted audio file metadata."""

    duration_seconds: float
    bitrate_kbps: Optional[int]
    sample_rate: Optional[int]
    channels: Optional[int]
    format: str


def extract_metadata(file_content: bytes, content_type: str) -> AudioMetadata:
    """Extract metadata from audio file bytes.

    Args:
        file_content: Raw audio file bytes.
        content_type: MIME type of the audio file.

    Returns:
        AudioMetadata with duration, bitrate, sample rate, channels, and format.
    """
    buffer = io.BytesIO(file_content)
    audio = MutagenFile(buffer)

    if audio is None:
        return AudioMetadata(
            duration_seconds=0.0,
            bitrate_kbps=None,
            sample_rate=None,
            channels=None,
            format=_mime_to_format(content_type),
        )

    duration = audio.info.length if audio.info else 0.0
    bitrate = None
    sample_rate = None
    channels = None

    if hasattr(audio.info, "bitrate"):
        bitrate = int(audio.info.bitrate / 1000) if audio.info.bitrate else None
    if hasattr(audio.info, "sample_rate"):
        sample_rate = audio.info.sample_rate
    if hasattr(audio.info, "channels"):
        channels = audio.info.channels

    return AudioMetadata(
        duration_seconds=round(duration, 2),
        bitrate_kbps=bitrate,
        sample_rate=sample_rate,
        channels=channels,
        format=_mime_to_format(content_type),
    )


def validate_audio_file(content_type: str, size: int, max_size: int) -> Optional[str]:
    """Validate audio file type and size.

    Args:
        content_type: MIME type of the file.
        size: Size of the file in bytes.
        max_size: Maximum allowed size in bytes.

    Returns:
        Error message string if validation fails, None if valid.
    """
    allowed = {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/flac", "audio/x-flac"}
    if content_type not in allowed:
        return f"Invalid audio format '{content_type}'. Allowed: MP3, WAV, FLAC."
    if size > max_size:
        max_mb = max_size / (1024 * 1024)
        return f"File size ({size / (1024 * 1024):.1f} MB) exceeds maximum of {max_mb:.0f} MB."
    return None


def _mime_to_format(content_type: str) -> str:
    """Convert MIME type to human-friendly format name."""
    mapping = {
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/flac": "flac",
        "audio/x-flac": "flac",
    }
    return mapping.get(content_type, "unknown")
