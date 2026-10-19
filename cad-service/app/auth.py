"""Shared-secret bearer auth (plan §2.2, D10).

`Authorization: Bearer <CAD_SERVICE_TOKEN>`, compared with hmac.compare_digest. The service refuses
to start without CAD_SERVICE_TOKEN unless CAD_SERVICE_DEV=1 (then, with no token set, auth is off
and a warning is logged).
"""

from __future__ import annotations

import hmac
import logging
import os

log = logging.getLogger("cad_service")


class ConfigError(RuntimeError):
    pass


def dev_mode() -> bool:
    return os.environ.get("CAD_SERVICE_DEV") == "1"


def configured_token() -> str | None:
    tok = os.environ.get("CAD_SERVICE_TOKEN", "").strip()
    return tok or None


def assert_configured() -> None:
    if configured_token() is None:
        if dev_mode():
            log.warning("CAD_SERVICE_TOKEN is not set and CAD_SERVICE_DEV=1: auth is DISABLED")
        else:
            raise ConfigError("CAD_SERVICE_TOKEN is required (set CAD_SERVICE_DEV=1 to run without it locally)")


def authorized(header_value: str | None) -> bool:
    token = configured_token()
    if token is None:
        return dev_mode()
    if not header_value:
        return False
    scheme, _, presented = header_value.partition(" ")
    if scheme.lower() != "bearer" or not presented:
        return False
    return hmac.compare_digest(presented.strip().encode("utf-8"), token.encode("utf-8"))
