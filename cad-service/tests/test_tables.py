import re
import shutil
from pathlib import Path

import pytest

from app import tables

REPO = tables.SERVICE_DIR.parent


def test_manifest_sha256_matches_every_file():
    manifest = tables.verify_manifest(tables.SHARED_DIR)
    assert manifest["files"], "MANIFEST lists no files"
    for rel in manifest["files"]:
        assert (tables.SHARED_DIR / rel).is_file(), rel
    # every dimension table is covered by the manifest
    for p in (tables.SHARED_DIR / "dimensions").glob("*.json"):
        assert f"dimensions/{p.name}" in manifest["files"]


def test_tables_hash_matches_manifest_and_recomputation():
    assert re.fullmatch(r"[0-9a-f]{12}", tables.TABLES_HASH)
    assert tables.compute_tables_hash(tables.SHARED_DIR / "dimensions") == tables.TABLES_HASH
    assert tables.MANIFEST["tables_hash"] == tables.TABLES_HASH


@pytest.mark.parametrize(
    "rel",
    ["backend/src/lib/cpq-shared/dimension-tables.ts", "storefront/src/lib/cpq/shared/dimension-tables.ts"],
)
def test_tables_hash_matches_ts_cpq_tables_hash(rel):
    ts = REPO / rel
    if not ts.is_file():
        pytest.skip(f"{rel} not present (cad-service built on its own)")
    m = re.search(r'CPQ_TABLES_HASH = "([0-9a-f]+)"', ts.read_text("utf-8"))
    assert m and m.group(1) == tables.TABLES_HASH


def test_tampered_copy_is_rejected(tmp_path: Path):
    copy = tmp_path / "cpq_shared"
    shutil.copytree(tables.SHARED_DIR, copy)
    p = copy / "dimensions" / "tube-sizes.json"
    p.write_bytes(p.read_bytes().replace(b'"wall_in": 0.065', b'"wall_in": 0.066', 1))
    with pytest.raises(tables.TablesError, match="sha256 mismatch"):
        tables.verify_manifest(copy)


def test_missing_file_is_rejected(tmp_path: Path):
    copy = tmp_path / "cpq_shared"
    shutil.copytree(tables.SHARED_DIR, copy)
    (copy / "assets" / tables.LOGO_FILE).unlink()
    with pytest.raises(tables.TablesError, match="missing"):
        tables.verify_manifest(copy)


def test_lookups():
    assert tables.tube_size(200)["od_in"] == 2
    assert tables.tube_dims(400) == pytest.approx((4, 0.083, 3.834))
    assert tables.end_connection_row("tc", 200)["length_in"] == 0.5
    assert tables.end_connection_row("fl150", 200)["max_od_in"] == 6
    assert tables.reducer_length(300) == 3.5
    assert tables.valve_row("bv", 100)["length_in"] == 3.5
    assert tables.valve_row("bv", 999) is None
    assert tables.manifold_row(400)["end_allowance_in"] == 8
    assert tables.alloy("t316l")["digit"] == "6"
    with pytest.raises(KeyError):
        tables.tube_size(999)
    with pytest.raises(KeyError):
        tables.end_connection_row("tc", 999)
    with pytest.raises(KeyError):
        tables.manifold_row(200)


def test_logo_asset_is_cardinal():
    logo = tables.ASSETS_DIR / tables.LOGO_FILE
    assert logo.is_file()
    assert "<mask" not in logo.read_text("utf-8")  # CairoSVG ignores masks (Sanitube Phase 3 black box)
