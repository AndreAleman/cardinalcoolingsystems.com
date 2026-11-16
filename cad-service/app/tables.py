"""Dimension tables from cpq_shared/ (synced by scripts/sync-cpq-shared.mjs; never edit the copies).

On import, every file listed in MANIFEST.json is checked against its sha256, and the tables hash is
recomputed from dimensions/*.json exactly like the TS `CPQ_TABLES_HASH`:
sha256 over the files sorted by name, each fed as `name\\0bytes\\0`, first 12 hex chars.

Set CPQ_SHARED_DIR to point at another folder (e.g. ../shared/cpq while developing).
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

SERVICE_DIR = Path(__file__).resolve().parent.parent
LOGO_FILE = "cardinal-logo.svg"


class TablesError(RuntimeError):
    pass


def shared_dir() -> Path:
    env = os.environ.get("CPQ_SHARED_DIR")
    return Path(env).resolve() if env else SERVICE_DIR / "cpq_shared"


def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def compute_tables_hash(dimensions_dir: Path) -> str:
    h = hashlib.sha256()
    for name in sorted(p.name for p in dimensions_dir.glob("*.json")):
        h.update(name.encode("utf-8") + b"\0")
        h.update((dimensions_dir / name).read_bytes())
        h.update(b"\0")
    return h.hexdigest()[:12]


def verify_manifest(root: Path) -> dict[str, Any]:
    """Raises TablesError if a listed file is missing or its sha256 differs. Returns the manifest."""
    manifest_path = root / "MANIFEST.json"
    if not manifest_path.is_file():
        raise TablesError(f"{manifest_path} not found (run node scripts/sync-cpq-shared.mjs)")
    manifest = json.loads(manifest_path.read_text("utf-8"))
    bad = []
    for rel, digest in manifest.get("files", {}).items():
        p = root / rel
        if not p.is_file():
            bad.append(f"{rel}: missing")
        elif _sha256(p.read_bytes()) != digest:
            bad.append(f"{rel}: sha256 mismatch")
    if bad:
        raise TablesError("cpq_shared does not match MANIFEST.json: " + "; ".join(bad))
    computed = compute_tables_hash(root / "dimensions")
    if computed != manifest.get("tables_hash"):
        raise TablesError(
            f"tables hash {computed} != MANIFEST tables_hash {manifest.get('tables_hash')}"
        )
    return manifest


def _load(name: str) -> dict[str, Any]:
    return json.loads((SHARED_DIR / "dimensions" / name).read_text("utf-8"))


SHARED_DIR = shared_dir()
MANIFEST = verify_manifest(SHARED_DIR)
TABLES_HASH: str = MANIFEST["tables_hash"]
ASSETS_DIR = SHARED_DIR / "assets"
FIXTURES_DIR = SHARED_DIR / "fixtures"

TUBE_SIZES = _load("tube-sizes.json")
END_CONNECTIONS = _load("end-connections.json")
MATERIALS = _load("materials.json")
ASSEMBLIES = _load("assemblies.json")

# Query alloy key ("t316l") -> table row (value "T316L").
ALLOYS: dict[str, dict[str, Any]] = {r["value"].lower(): r for r in MATERIALS["alloys"]}
END_TYPES: dict[str, dict[str, Any]] = {t["code"]: t for t in END_CONNECTIONS["types"]}
MANIFOLD: dict[str, Any] = ASSEMBLIES["manifold"]
_TUBE_ROWS: dict[int, dict[str, Any]] = {r["size_code"]: r for r in TUBE_SIZES["sizes"]}
_END_ROWS: dict[tuple[str, int], dict[str, Any]] = {
    (r["code"], r["size_code"]): r for r in END_CONNECTIONS["rows"]
}
_REDUCERS: dict[int, float] = {r["size_code"]: float(r["length_in"]) for r in ASSEMBLIES["reducers"]}
_VALVES: dict[tuple[str, int], dict[str, Any]] = {
    (v["kind"], v["size_code"]): v for v in ASSEMBLIES["valves"]
}
_MANIFOLD_ROWS: dict[int, dict[str, Any]] = {r["header_code"]: r for r in MANIFOLD["rows"]}


def tube_size(size_code: int) -> dict[str, Any]:
    row = _TUBE_ROWS.get(size_code)
    if row is None:
        raise KeyError(f"Unknown tube size code: {size_code}")
    return row


def has_tube_size(size_code: int) -> bool:
    return size_code in _TUBE_ROWS


def tube_dims(size_code: int) -> tuple[float, float, float]:
    """(od, wall, id) in inches."""
    t = tube_size(size_code)
    od, wall = float(t["od_in"]), float(t["wall_in"])
    return od, wall, od - 2 * wall


def end_connection_row(code: str, size_code: int) -> dict[str, Any]:
    row = _END_ROWS.get((code, size_code))
    if row is None:
        raise KeyError(f"No End Connection row for {code} x {size_code}")
    return row


def has_end_connection_row(code: str, size_code: int) -> bool:
    return (code, size_code) in _END_ROWS


def reducer_length(larger_size: int) -> float:
    v = _REDUCERS.get(larger_size)
    if v is None:
        raise KeyError(f"No reducer length for size {larger_size}")
    return v


def valve_row(kind: str, size_code: int) -> dict[str, Any] | None:
    return _VALVES.get((kind, size_code))


def manifold_row(header_code: int) -> dict[str, Any]:
    row = _MANIFOLD_ROWS.get(header_code)
    if row is None:
        raise KeyError(f"No manifold row for header {header_code}")
    return row


def alloy(key: str) -> dict[str, Any]:
    row = ALLOYS.get(key)
    if row is None:
        raise KeyError(f"Unknown alloy: {key}")
    return row
