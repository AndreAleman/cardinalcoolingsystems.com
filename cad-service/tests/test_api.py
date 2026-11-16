"""HTTP contract via FastAPI's TestClient: /health and POST /v1/packages/{kind}."""

import base64
import re
import copy
import hashlib
import threading
import time

import pytest
from fastapi.testclient import TestClient

from app import auth, pdf, tables
from app.main import PACKAGE_KINDS, create_app

from .conftest import DEFAULT_CONFIGS, MANIFOLD_VECTORS, SHEET_GOLDENS, TRANSITION_VECTORS

TOKEN = "test-cad-token"
AUTH = {"Authorization": f"Bearer {TOKEN}"}

STEP_KINDS = ["transition", "row-manifold"]
PDF_ONLY_KINDS = ["cdu-kit", "strainer", "hose"]
SVG_FOR = {
    "transition": "transition",
    "row-manifold": "row-manifold",
    "cdu-kit": "cdu-kit",
    "strainer": "strainer",
    "hose": "hose",
}
PN = {k: SHEET_GOLDENS[SVG_FOR[k]][1] for k in SVG_FOR}


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("CAD_SERVICE_TOKEN", TOKEN)
    # Without libcairo the service only starts in dev mode (PDF disabled); with it, run as prod.
    if pdf.pdf_available():
        monkeypatch.delenv("CAD_SERVICE_DEV", raising=False)
    else:
        monkeypatch.setenv("CAD_SERVICE_DEV", "1")


def body_for(kind, vector=None):
    b = {
        "part_number": PN[kind],
        "config": copy.deepcopy(vector["input"] if vector else DEFAULT_CONFIGS[kind]),
        "tables_hash": tables.TABLES_HASH,
        "drawing_svg": SHEET_GOLDENS[SVG_FOR[kind]][0].read_text("utf-8"),
        "description": f"TEST {kind}",
    }
    if kind == "transition":
        b["expected"] = copy.deepcopy((vector or TRANSITION_VECTORS[0])["expected"])
    elif kind == "row-manifold":
        b["expected"] = copy.deepcopy((vector or MANIFOLD_VECTORS[0])["expected"])
    return b


def wait_warm(client, timeout=300):
    end = time.time() + timeout
    while time.time() < end:
        r = client.get("/health")
        if r.status_code == 200:
            return r
        assert r.json().get("error") is None, r.json()
        time.sleep(0.2)
    raise AssertionError("service never warmed up")


@pytest.fixture(scope="module")
def warm_client():
    mp = pytest.MonkeyPatch()
    mp.setenv("CAD_SERVICE_TOKEN", TOKEN)
    if not pdf.pdf_available():
        mp.setenv("CAD_SERVICE_DEV", "1")
    with TestClient(create_app()) as client:
        wait_warm(client)
        yield client
    mp.undo()


@pytest.fixture(scope="module")
def light_client():
    """Warm without CadQuery (validation, auth and PDF-only kinds)."""
    mp = pytest.MonkeyPatch()
    mp.setenv("CAD_SERVICE_TOKEN", TOKEN)
    if not pdf.pdf_available():
        mp.setenv("CAD_SERVICE_DEV", "1")

    def no_cad(state):
        state.cadquery_version = "test"

    with TestClient(create_app(warmup=no_cad)) as client:
        wait_warm(client, 10)
        yield client
    mp.undo()


def test_routes_cover_every_builder():
    assert set(PACKAGE_KINDS) == {"transition", "row-manifold", "cdu-kit", "strainer", "hose"}
    assert {k for k, v in PACKAGE_KINDS.items() if v.has_step} == set(STEP_KINDS)


# --- health / warm-up -----------------------------------------------------------------------------

def test_health_503_until_warm_then_200():
    gate = threading.Event()

    def slow_warmup(state):
        gate.wait(10)
        state.cadquery_version = "test"

    with TestClient(create_app(warmup=slow_warmup)) as client:
        r = client.get("/health")
        assert r.status_code == 503 and r.json()["warm"] is False and r.json()["ok"] is False
        for kind in PACKAGE_KINDS:
            r = client.post(f"/v1/packages/{kind}", json=body_for(kind), headers=AUTH)
            assert r.status_code == 503 and r.json()["error"]["code"] == "warming_up"
        gate.set()
        r = wait_warm(client, 10)
        body = r.json()
        assert body["ok"] is True and body["warm"] is True
        assert body["generator_version"] == "1"
        assert body["tables_hash"] == tables.TABLES_HASH
        assert body["cadquery"] == "test"
        assert body["kinds"] == {
            "transition": "step+pdf", "row-manifold": "step+pdf", "cdu-kit": "pdf", "strainer": "pdf", "hose": "pdf",
        }


def test_failed_warmup_stays_503():
    def boom(state):
        raise RuntimeError("no OCC")

    with TestClient(create_app(warmup=boom)) as client:
        for _ in range(50):
            r = client.get("/health")
            if r.json().get("error"):
                break
            time.sleep(0.05)
        assert r.status_code == 503 and "no OCC" in r.json()["error"]


def test_refuses_to_start_without_token(monkeypatch):
    monkeypatch.delenv("CAD_SERVICE_TOKEN", raising=False)
    monkeypatch.delenv("CAD_SERVICE_DEV", raising=False)
    with pytest.raises(auth.ConfigError):
        auth.assert_configured()
    monkeypatch.setenv("CAD_SERVICE_DEV", "1")
    auth.assert_configured()  # dev: allowed, auth disabled


def test_refuses_to_start_without_cairo_in_prod(monkeypatch):
    if pdf.pdf_available():
        pytest.skip("libcairo is installed")
    monkeypatch.delenv("CAD_SERVICE_DEV", raising=False)
    with pytest.raises(auth.ConfigError, match="PDF renderer unavailable"):
        with TestClient(create_app(warmup=lambda s: None)):
            pass


# --- auth -----------------------------------------------------------------------------------------

@pytest.mark.parametrize("kind", list(PACKAGE_KINDS))
@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer wrong"}, {"Authorization": TOKEN}, {"Authorization": f"Basic {TOKEN}"}],
    ids=["missing", "wrong", "no-scheme", "basic"],
)
def test_401(light_client, kind, headers):
    r = light_client.post(f"/v1/packages/{kind}", json=body_for(kind), headers=headers)
    assert r.status_code == 401
    assert r.json() == {"error": {"code": "unauthorized", "message": "Missing or invalid bearer token."}}


# --- validation -----------------------------------------------------------------------------------

@pytest.mark.parametrize(
    "mutate",
    [
        lambda b: b["config"].update(od=50),  # 1/2" is not a transition size
        lambda b: b["config"].update(odb=999),
        lambda b: b["config"].update(a="fl150"),  # End A is sanitary only
        lambda b: b["config"].update(b="tc"),
        lambda b: b["config"].update(len=1.875),
        lambda b: b["config"].update(len=72.125),
        lambda b: b["config"].update(len=12.1),
        lambda b: b["config"].update(len="12"),
        lambda b: b["config"].update(alloy="T316L"),
        lambda b: b["config"].update(qty=0),
        lambda b: b["config"].pop("odb"),
        lambda b: b["config"].update(extra=1),
        lambda b: b["config"].update(od=1000, odb=1000),  # 10" is a tube size, not a transition size
        lambda b: b.update(part_number="bad/../name"),
        lambda b: b.update(part_number=""),
        lambda b: b["expected"].pop("tubeStraight"),
        lambda b: b["expected"].pop("reducer"),
        lambda b: b["expected"]["faces"].pop("b"),
        lambda b: b.update(extra_field=1),
        lambda b: b.pop("drawing_svg"),
        lambda b: b.pop("expected"),
    ],
    ids=["od-50", "odb-999", "a-flange", "b-tc", "len-min", "len-max", "len-grid", "len-string", "alloy-case",
         "qty-0", "no-odb", "extra-key", "od-1000", "pn-chars", "pn-empty", "expected-straight",
         "expected-reducer", "expected-face", "extra-field", "no-svg", "no-expected"],
)
def test_400_transition(light_client, mutate):
    body = body_for("transition")
    mutate(body)
    r = light_client.post("/v1/packages/transition", json=body, headers=AUTH)
    assert r.status_code == 400, r.text
    assert r.json()["error"]["code"] == "invalid_config"


@pytest.mark.parametrize(
    "mutate",
    [
        lambda b: b["config"].update(header=200),
        lambda b: b["config"].update(drops=1),
        lambda b: b["config"].update(drops=49),
        lambda b: b["config"].update(pitch=5),
        lambda b: b["config"].update(pitch=97),
        lambda b: b["config"].update(drop=200),
        lambda b: b["config"].update(dstyle="qd"),
        lambda b: b["config"].update(ends="fl300"),
        lambda b: b["config"].update(fill=1),
        lambda b: b["config"].update(docs=["iso"]),
        lambda b: b["expected"].pop("branches"),
    ],
    ids=["header-2", "drops-1", "drops-49", "pitch-5", "pitch-97", "drop-2", "dstyle", "ends-fl300",
         "fill-int", "docs", "expected-branches"],
)
def test_400_manifold(light_client, mutate):
    body = body_for("row-manifold")
    mutate(body)
    r = light_client.post("/v1/packages/row-manifold", json=body, headers=AUTH)
    assert r.status_code == 400, r.text
    assert r.json()["error"]["code"] == "invalid_config"


@pytest.mark.parametrize(
    "kind, mutate",
    [
        ("cdu-kit", lambda b: b["config"].update(port="tc250")),
        ("cdu-kit", lambda b: b["config"].update(units=0)),
        ("cdu-kit", lambda b: b["config"].update(len=241)),
        ("strainer", lambda b: b["config"].update(size=800)),
        ("strainer", lambda b: b["config"].update(mesh="60")),
        ("hose", lambda b: b["config"].update(len=11)),
        ("hose", lambda b: b["config"].update(cover="rubber")),
        ("hose", lambda b: b.update(expected={})),  # PDF-only kinds take no `expected`
    ],
    ids=["kit-port", "kit-units", "kit-len", "strainer-size", "strainer-mesh", "hose-len", "hose-cover",
         "hose-expected"],
)
def test_400_pdf_only(light_client, kind, mutate):
    body = body_for(kind)
    mutate(body)
    r = light_client.post(f"/v1/packages/{kind}", json=body, headers=AUTH)
    assert r.status_code == 400, r.text
    assert r.json()["error"]["code"] == "invalid_config"


def test_bodies_are_not_interchangeable(light_client):
    assert light_client.post("/v1/packages/row-manifold", json=body_for("transition"), headers=AUTH).status_code == 400
    assert light_client.post("/v1/packages/transition", json=body_for("row-manifold"), headers=AUTH).status_code == 400
    assert light_client.post("/v1/packages/hose", json=body_for("strainer"), headers=AUTH).status_code == 400


def test_400_not_json(light_client):
    r = light_client.post("/v1/packages/transition", content=b"{nope",
                          headers={**AUTH, "content-type": "application/json"})
    assert r.status_code == 400 and r.json()["error"]["code"] == "invalid_config"


@pytest.mark.parametrize("kind", list(PACKAGE_KINDS))
def test_409_tables_mismatch(light_client, kind):
    body = body_for(kind)
    body["tables_hash"] = "000000000000"
    r = light_client.post(f"/v1/packages/{kind}", json=body, headers=AUTH)
    assert r.status_code == 409 and r.json()["error"]["code"] == "tables_mismatch"


def test_422_transition_geometry_mismatch(light_client):
    body = body_for("transition")
    body["expected"]["tubeStraight"] += 0.01
    r = light_client.post("/v1/packages/transition", json=body, headers=AUTH)
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "geometry_mismatch"
    assert "tubeStraight: expected 9.01, got 9.0" in err["message"]


def test_422_manifold_drift_and_unknown_key(light_client):
    body = body_for("row-manifold")
    body["expected"]["headerLength"] = 281
    body["expected"]["runLength"] = 7  # not a manifold key: refused, not ignored
    r = light_client.post("/v1/packages/row-manifold", json=body, headers=AUTH)
    assert r.status_code == 422
    msg = r.json()["error"]["message"]
    assert "headerLength: expected 281, got 280.0" in msg and "runLength" in msg


def test_422_reducer_missing_on_the_backend_side(light_client):
    """A reducing config whose `expected` says no reducer (stale backend) is refused."""
    v = next(x for x in TRANSITION_VECTORS if x["input"]["od"] != x["input"]["odb"])
    body = body_for("transition", v)
    body["expected"]["reducer"] = None
    r = light_client.post("/v1/packages/transition", json=body, headers=AUTH)
    assert r.status_code == 422 and "reducer: expected null, got a value" in r.json()["error"]["message"]


def test_413_svg_too_large(light_client):
    body = body_for("transition")
    body["drawing_svg"] = "<svg>" + "x" * (3 * 1024 * 1024) + "</svg>"
    r = light_client.post("/v1/packages/transition", json=body, headers=AUTH)
    assert r.status_code == 413 and r.json()["error"]["code"] == "svg_too_large"


def test_404_uses_error_shape(light_client):
    r = light_client.get("/nope")
    assert r.status_code == 404 and r.json()["error"]["code"] == "not_found"
    r = light_client.post("/v1/packages/sweep", json={}, headers=AUTH)
    assert r.status_code == 404


# --- generation -----------------------------------------------------------------------------------

def check_file(f, filename, content_type):
    raw = base64.b64decode(f["base64"])
    assert f["filename"] == filename and f["content_type"] == content_type
    assert f["bytes"] == len(raw)
    assert f["sha256"] == hashlib.sha256(raw).hexdigest()
    return raw


@pytest.mark.parametrize("kind", PDF_ONLY_KINDS)
def test_200_pdf_only_kinds(light_client, kind):
    """No CadQuery needed: the PDF-only kinds never build a solid."""
    r = light_client.post(f"/v1/packages/{kind}", json=body_for(kind), headers=AUTH)
    assert r.status_code == 200, r.text
    body = r.json()
    assert set(body) == {"part_number", "generator_version", "tables_hash", "step", "pdf", "solid", "timings_ms"}
    assert body["step"] is None and body["solid"] is None
    assert "model" not in body["timings_ms"] and "step" not in body["timings_ms"]
    if pdf.pdf_available():
        raw = check_file(body["pdf"], f"{PN[kind]}.pdf", "application/pdf")
        assert raw.startswith(b"%PDF") and "pdf" in body["timings_ms"]
    else:
        assert body["pdf"] is None


@pytest.mark.cad
@pytest.mark.parametrize("kind", STEP_KINDS)
def test_200_round_trip(warm_client, kind):
    pn = PN[kind]
    r = warm_client.post(f"/v1/packages/{kind}", json=body_for(kind), headers=AUTH)
    assert r.status_code == 200, r.text
    body = r.json()
    assert set(body) == {"part_number", "generator_version", "tables_hash", "step", "pdf", "solid", "timings_ms"}
    assert body["part_number"] == pn and body["generator_version"] == "1"
    assert body["tables_hash"] == tables.TABLES_HASH
    step = check_file(body["step"], f"{pn}.step", "model/step")
    assert step.startswith(b"ISO-10303-21;")
    # OCCT wraps long STEP lines, so allow whitespace between the PRODUCT arguments.
    assert re.search(rf"PRODUCT\(\s*'{pn}'\s*,\s*'{pn}'".encode(), step)
    assert b"SI_UNIT(.MILLI.,.METRE.)" in step
    assert body["solid"]["valid"] is True
    assert set(body["timings_ms"]) >= {"model", "step"}
    if kind == "transition":  # plan golden: 2" TC x 150# flange, 12": flange OD 6"
        assert body["solid"]["bbox_in"] == pytest.approx([0, -3, -3, 12, 3, 3], abs=1e-6)
    else:  # plan golden manifold: 280" header, drop faces at +7, fill/drain faces at -4.5
        assert body["solid"]["bbox_in"][:2] == pytest.approx([0, -4.5], abs=1e-6)
        assert body["solid"]["bbox_in"][3:5] == pytest.approx([280, 7], abs=1e-6)
    if pdf.pdf_available():
        raw = check_file(body["pdf"], f"{pn}.pdf", "application/pdf")
        assert raw.startswith(b"%PDF") and "pdf" in body["timings_ms"]
    else:
        assert body["pdf"] is None


@pytest.mark.cad
def test_200_every_golden_vector(warm_client):
    """Every transition and manifold fixture vector generates (the backend never sends out-of-range
    ones, but the service still builds them)."""
    for kind, vectors in (("transition", TRANSITION_VECTORS), ("row-manifold", MANIFOLD_VECTORS)):
        for v in vectors:
            body = body_for(kind, v)
            body["part_number"] = "TEST-1"
            r = warm_client.post(f"/v1/packages/{kind}", json=body, headers=AUTH)
            assert r.status_code == 200, (kind, v["name"], r.text)
            assert r.json()["solid"]["valid"] is True
