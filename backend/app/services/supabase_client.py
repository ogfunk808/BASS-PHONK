"""BASS PHONK API - Supabase client singleton.

Provides both the public (anon-key) client for user-scoped operations
and the admin (service-role-key) client for elevated operations.
"""

from supabase import create_client, Client

from app.config import settings

_supabase_client: Client | None = None
_supabase_admin: Client | None = None


def get_supabase() -> Client:
    """Return the public Supabase client (anon key).

    This client respects Row Level Security policies and should be used
    for all user-facing operations.
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
    return _supabase_client


def get_supabase_admin() -> Client:
    """Return the admin Supabase client (service role key).

    This client BYPASSES Row Level Security and should only be used for
    server-side administrative operations such as creating profiles on
    signup, running analytics queries, or managing storage.
    """
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
    return _supabase_admin


def close_supabase() -> None:
    """Clean up Supabase client references on shutdown."""
    global _supabase_client, _supabase_admin
    _supabase_client = None
    _supabase_admin = None
