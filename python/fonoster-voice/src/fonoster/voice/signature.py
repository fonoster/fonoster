"""Connection signatures (voice-session, "Connection requests are signed")."""

from __future__ import annotations

import hashlib
import hmac
import time
from typing import Iterable, Mapping

SIGNATURE_HEADER = "x-fonoster-signature"
TIMESTAMP_HEADER = "x-fonoster-timestamp"
MAX_SKEW_SECONDS = 300


def sign(url: str, timestamp: int, secret: str) -> str:
    return hmac.new(secret.encode(), f"{timestamp}.{url}".encode(), hashlib.sha256).hexdigest()


def verify_signature(
    urls: Iterable[str], headers: Mapping[str, str], secret: str, now: int | None = None
) -> str | None:
    """Returns None when the signature is valid for one of the URLs, else "missing", "stale" or "mismatch"."""
    lowered = {k.lower(): v for k, v in headers.items()}
    signature = lowered.get(SIGNATURE_HEADER)
    try:
        timestamp = int(lowered.get(TIMESTAMP_HEADER, ""))
    except ValueError:
        return "missing"
    if not signature:
        return "missing"
    now = int(time.time()) if now is None else now
    if abs(now - timestamp) > MAX_SKEW_SECONDS:
        return "stale"
    for url in urls:
        if hmac.compare_digest(sign(url, timestamp, secret), signature):
            return None
    return "mismatch"
