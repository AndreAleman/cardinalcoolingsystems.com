"""Generator version: bumped together with the backend cache-key constant."""

import re

import pytest

from app import tables
from app.version import GENERATOR_VERSION

BACKEND_CACHE_KEY = tables.SERVICE_DIR.parent / "backend" / "src" / "lib" / "cad" / "cache-key.ts"


def test_generator_version_is_1():
    assert GENERATOR_VERSION == "1"


def test_generator_version_equals_backend_constant():
    if not BACKEND_CACHE_KEY.is_file():
        pytest.skip("backend/src/lib/cad/cache-key.ts not present (cad-service built on its own)")
    m = re.search(r"CAD_GENERATOR_VERSION\s*=\s*['\"]([^'\"]+)['\"]", BACKEND_CACHE_KEY.read_text("utf-8"))
    assert m, "CAD_GENERATOR_VERSION not found in cache-key.ts"
    assert m.group(1) == GENERATOR_VERSION
