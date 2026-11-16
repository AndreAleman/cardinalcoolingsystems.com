"""SVG -> PDF (Sanitube plan D1, ported): CairoSVG converts the backend-rendered Engineering View; Python draws nothing.

- `unsafe=False`: no XML entities / external DTDs (defusedxml).
- `<image href>` is resolved only against cpq_shared/assets/ (the logo, `cardinal-logo.svg`) and
  `data:` URLs. Anything else (http, other files, path traversal) renders as
  an empty 1x1 image.
- CairoSVG needs the system cairo library (`libcairo2` in the Dockerfile). Without it,
  `pdf_available()` is False and the reason says why.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import unquote, urlparse

from . import tables

MAX_SVG_BYTES = 2 * 1024 * 1024
EMPTY_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'


class PdfUnavailable(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _probe() -> tuple[bool, str]:
    try:
        import cairosvg  # noqa: F401  (imports cairocffi, which dlopens libcairo)
    except OSError as exc:
        first = str(exc).splitlines()[0] if str(exc) else type(exc).__name__
        return False, f"system cairo library not found ({first}); install libcairo2 / `brew install cairo`"
    except ImportError as exc:
        return False, f"cairosvg not installed ({exc})"
    return True, "ok"


def pdf_available() -> bool:
    return _probe()[0]


def pdf_unavailable_reason() -> str:
    return _probe()[1]


def _assets_root() -> Path:
    return tables.ASSETS_DIR.resolve()


def asset_url_fetcher(url: str, resource_type: str) -> bytes:
    """Only data: URLs and files inside cpq_shared/assets/."""
    if url.startswith("data:"):
        from cairosvg.url import fetch

        return fetch(url, resource_type)
    parsed = urlparse(url)
    if parsed.scheme == "file":
        try:
            target = Path(unquote(parsed.path)).resolve()
        except (OSError, RuntimeError):
            return EMPTY_SVG
        root = _assets_root()
        if target.is_file() and (target == root or root in target.parents):
            return target.read_bytes()
    return EMPTY_SVG


def svg_to_pdf(svg: str | bytes) -> bytes:
    if not pdf_available():
        raise PdfUnavailable(pdf_unavailable_reason())
    from cairosvg.surface import PDFSurface

    data = svg.encode("utf-8") if isinstance(svg, str) else svg
    if len(data) > MAX_SVG_BYTES:
        raise ValueError("SVG larger than 2 MB")
    base = _assets_root().as_uri() + "/"
    # PDFSurface.convert (not svg2pdf) because only it forwards `url_fetcher` to the parser.
    return PDFSurface.convert(
        bytestring=data,
        url=base,
        unsafe=False,
        url_fetcher=asset_url_fetcher,
    )
