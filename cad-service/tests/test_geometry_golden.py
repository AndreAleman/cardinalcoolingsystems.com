"""Golden-fixture parity for the pure-Python geometry port (no CadQuery).

The fixtures' `expected` blocks are the TS `BuilderDef.expected(o)` values the backend sends; the
Python port must reproduce every leaf (and nothing else) within the fixture tolerance.
"""

import copy

import pytest

from app.geometry import (
    compare_expected,
    end_envelope,
    end_geom,
    manifold_end_codes,
    manifold_geometry,
    manifold_header_length,
    segment_wall_volume,
    transition_geometry,
)

from .conftest import MANIFOLD_GOLDEN, MANIFOLD_VECTORS, TOL, TRANSITION_GOLDEN, TRANSITION_VECTORS, vector_id

KINDS = [pytest.param(transition_geometry, v, id=f"transition: {v['name']}") for v in TRANSITION_VECTORS] + [
    pytest.param(manifold_geometry, v, id=f"manifold: {v['name']}") for v in MANIFOLD_VECTORS
]


def test_fixtures_have_coverage():
    assert TRANSITION_GOLDEN["tolerance"] == TOL and MANIFOLD_GOLDEN["tolerance"] == TOL
    assert len(TRANSITION_VECTORS) >= 5 and len(MANIFOLD_VECTORS) >= 3
    # a reducing transition and every manifold drop style are covered
    assert any(v["input"]["od"] != v["input"]["odb"] for v in TRANSITION_VECTORS)
    assert {v["input"]["dstyle"] for v in MANIFOLD_VECTORS} == {"tc", "bv", "uqd"}


@pytest.mark.parametrize("fn, v", KINDS)
def test_summary_is_exactly_the_expected_payload(fn, v):
    """summary() emits exactly the TS `expected` keys, and every leaf matches (both ways)."""
    g = fn(v["input"])
    want = v["expected"]
    assert set(g.summary()) == set(want)
    assert compare_expected(want, g, tol=TOL) == []


@pytest.mark.parametrize("v", TRANSITION_VECTORS, ids=vector_id)
def test_transition_weld_lines_and_reducer(v):
    g = transition_geometry(v["input"])
    e = v["expected"]
    assert g.weld_a == pytest.approx(e["weldA"][0], abs=TOL)
    assert g.weld_b == pytest.approx(e["weldB"][0], abs=TOL)
    if e["reducer"] is None:
        assert g.reducer is None
    else:
        assert g.reducer == pytest.approx((e["reducer"]["x0"], e["reducer"]["x1"]), abs=TOL)
    assert sum(segment_wall_volume(s) for s in g.segments) == pytest.approx(e["tubeVolumeIn3"], abs=TOL)


def test_transition_reducer_sits_behind_end_b():
    g = transition_geometry({"a": "tc", "b": "grv", "od": 300, "odb": 200, "len": 12, "alloy": "t316l", "qty": 1})
    assert g.reducer is not None
    assert g.reducer[1] == pytest.approx(g.weld_b)
    assert g.reducer[1] - g.reducer[0] == pytest.approx(3.5)  # by the larger size (3")
    cone = [s for s in g.segments if s.style == "cone"][0]
    assert (cone.r0, cone.r1) == pytest.approx((1.5, 1.0))


@pytest.mark.parametrize("v", MANIFOLD_VECTORS, ids=vector_id)
def test_manifold_layout(v):
    o = v["input"]
    g = manifold_geometry(o)
    assert g.header_length == pytest.approx(manifold_header_length(o["header"], o["drops"], o["pitch"]))
    drops = g.drops
    assert len(drops) == o["drops"]
    gaps = {round(b.x - a.x, 9) for a, b in zip(drops, drops[1:])}
    assert gaps == {o["pitch"]}
    a, b = manifold_end_codes(o["ends"])
    assert (g.end_a.code, g.end_b.code) == (a, b)
    # every port sits between the end's weld line and the nearest drop envelope
    for br in g.branches:
        if br.role != "drop":
            assert g.end_a.length < br.x < g.header_length - g.end_b.length


def test_manifold_48_drops():
    o = dict(MANIFOLD_VECTORS[0]["input"], drops=48)
    g = manifold_geometry(o)
    assert len(g.drops) == 48
    assert g.header_length == pytest.approx(47 * 24 + 16)


def test_end_envelope_matches_ts():
    e = end_geom("tc", 200)
    pts = end_envelope((0.0, 0.0), (-1.0, 0.0), e)
    assert sorted(pts) == sorted([(0, -1.258), (0, 1.258), (0.5, -1.258), (0.5, 1.258)])


def test_parity_detects_drift():
    v = TRANSITION_VECTORS[0]
    g = transition_geometry(v["input"])
    exp = copy.deepcopy(v["expected"])
    exp["tubeStraight"] += 0.01
    exp["faces"]["b"]["point"][0] += 0.5
    problems = compare_expected(exp, g)
    assert len(problems) == 2
    assert any(p.startswith("tubeStraight: expected 9.01, got 9.0") for p in problems)
    assert any(p.startswith("faces.b.point[0]") for p in problems)


def test_parity_null_vs_value_strings_lists_and_unknown_keys():
    g = transition_geometry(TRANSITION_VECTORS[1]["input"])  # reducing: reducer set
    assert compare_expected({"reducer": None}, g) == ["reducer: expected null, got a value"]
    plain = transition_geometry(TRANSITION_VECTORS[0]["input"])
    assert compare_expected({"reducer": {"x0": 1, "x1": 2}}, plain) == [
        "reducer.x0: expected 1, not computed by the CAD service",
        "reducer.x1: expected 2, not computed by the CAD service",
    ]
    assert compare_expected({"bogus": 1}, plain) == ["bogus: expected 1, not computed by the CAD service"]
    assert compare_expected({"tubeStraight": "9"}, plain) == ["tubeStraight: expected '9', got 9.0"]
    m = manifold_geometry(MANIFOLD_VECTORS[0]["input"])
    exp = copy.deepcopy(MANIFOLD_VECTORS[0]["expected"])
    exp["branches"][0]["role"] = "vent"
    assert compare_expected(exp, m) == ["branches[0].role: expected 'vent', got 'drop'"]
    exp = copy.deepcopy(MANIFOLD_VECTORS[0]["expected"])
    exp["branches"].pop()
    problems = compare_expected(exp, m)
    assert problems == [f"branches.length: expected {len(m.branches) - 1}, got {len(m.branches)}"]
