import json
import os

import pytest

# Must be set before app.main is imported by any test module.
os.environ.setdefault("CAD_SERVICE_TOKEN", "test-cad-token")

from app import pdf, tables  # noqa: E402

TRANSITION_GOLDEN = json.loads((tables.FIXTURES_DIR / "transition-golden.json").read_text("utf-8"))
MANIFOLD_GOLDEN = json.loads((tables.FIXTURES_DIR / "manifold-golden.json").read_text("utf-8"))
TRANSITION_VECTORS = TRANSITION_GOLDEN["vectors"]
MANIFOLD_VECTORS = MANIFOLD_GOLDEN["vectors"]
TOL = TRANSITION_GOLDEN["tolerance"]

# React 18 renders of the golden vectors (backend cpq-shared-drawing.unit.spec.ts), synced here.
SHEET_GOLDENS = {
    "transition": (tables.FIXTURES_DIR / "transition-sheet-golden.svg", "clmp-fl150-tspool-l12-6-200"),
    "transition-reducing": (tables.FIXTURES_DIR / "transition-reducing-sheet-golden.svg", "clmp-fl150-tspool-l12-6-200-150"),
    "row-manifold": (tables.FIXTURES_DIR / "manifold-sheet-golden.svg", "clmp-clmp-rman-n12-d100clmp-p24-6-400"),
    "row-manifold-valves": (tables.FIXTURES_DIR / "manifold-valves-sheet-golden.svg", "clmp-cap-rman-n4-d100bv-p18-6-400-ip"),
    "cdu-kit": (tables.FIXTURES_DIR / "kit-sheet-golden.svg", "kit-cdu-a5ad698f"),
    "strainer": (tables.FIXTURES_DIR / "strainer-sheet-golden.svg", "clmp-clmp-strn-short-m20-6-200"),
    "hose": (tables.FIXTURES_DIR / "hose-sheet-golden.svg", "clmp-clmp-hose-l36-br-6-150"),
}


def vector_id(v):
    return v["name"]


def pytest_collection_modifyitems(config, items):
    if not pdf.pdf_available():
        skip_pdf = pytest.mark.skip(reason=f"PDF tests need libcairo: {pdf.pdf_unavailable_reason()}")
        for item in items:
            if "pdf" in item.keywords:
                item.add_marker(skip_pdf)
    try:
        import cadquery  # noqa: F401
    except Exception as exc:  # pragma: no cover
        skip_cad = pytest.mark.skip(reason=f"CadQuery not importable: {exc}")
        for item in items:
            if "cad" in item.keywords:
                item.add_marker(skip_cad)


# Default options per builder (shared/cpq/ts/option-keys.ts), for the PDF-only kinds' API tests.
DEFAULT_CONFIGS = {
    "transition": {"a": "tc", "b": "fl150", "od": 200, "odb": 200, "len": 12, "alloy": "t316l", "qty": 1},
    "row-manifold": {
        "header": 400, "drops": 12, "pitch": 24, "drop": 100, "dstyle": "tc", "ends": "tc", "pair": "1",
        "alloy": "t316l", "finish": "32", "fill": "1", "inst": "0", "docs": ["hydro", "mtr"],
    },
    "cdu-kit": {
        "cdu": "none", "port": "tc150", "side": "tcs", "run": "hard", "far": "tc", "len": 36, "iso": "none",
        "strainer": "none", "gasket": "epdm", "spares": "0", "units": 1, "alloy": "t316l",
    },
    "strainer": {"size": 200, "body": "short", "mesh": "20", "iso": "0", "dp": "0", "qty": 1},
    "hose": {"size": 150, "len": 36, "ends": "tc-tc", "cover": "braid", "sleeve": "none", "qty": 1},
}
