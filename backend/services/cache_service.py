from typing import Any, Optional
import json
import time


# Simple in-memory cache (Redis-like interface)
# Upgrade to Redis when scaling beyond single instance
_cache: dict = {}
_ttls: dict = {}


def get(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    if key in _cache:
        if key in _ttls and _ttls[key] < time.time():
            # Expired — remove
            del _cache[key]
            del _ttls[key]
            return None
        return _cache[key]
    return None


def set(key: str, value: Any, ttl: int = 3600):
    """Set value in cache with TTL in seconds (default: 1 hour)."""
    _cache[key] = value
    _ttls[key] = time.time() + ttl


def delete(key: str):
    """Remove a key from cache."""
    _cache.pop(key, None)
    _ttls.pop(key, None)


def clear():
    """Clear all cached data."""
    _cache.clear()
    _ttls.clear()


def get_json(key: str) -> Optional[dict]:
    """Get and parse JSON from cache."""
    val = get(key)
    if val is None:
        return None
    if isinstance(val, str):
        return json.loads(val)
    return val


def set_json(key: str, value: dict, ttl: int = 3600):
    """Serialize and store JSON in cache."""
    set(key, json.dumps(value), ttl)
