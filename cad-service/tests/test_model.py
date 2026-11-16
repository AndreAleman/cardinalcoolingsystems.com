"""CadQuery model + STEP export for the Transition Spool and the Row Manifold (marked `cad`)."""

import math
import os
import re
import tempfile
import time

import pytest

from app.geometry import manifold_geometry, transition_geometry

from .conftest import DEFAULT_CONFIGS, MANIFOLD_VECTORS, TRANSITION_VECTORS

pytestmark = pytest.mark.cad

MM = 25.4


@pytest.fixture(scope="session")
def cq():
    import cadquery

    return cadquery


def reimport(cq, data: bytes):
    fd, path = tempfile.mkstemp(suffix=".step")
    try:
        os.write(fd, data)
        os.close(fd)
        return cq.importers.importStep(path)
    finally:
        os.unlink(path)


EXTRA_TRANSITIONS = [
    ("reducing 3in TC x 2in grooved", dict(DEFAULT_CONFIGS["transition"], od=300, odb=200, b="grv")),
    ("2in TC x 1-1/2in FNPT", dict(DEFAULT_CONFIGS["transition"], b="fnpt", odb=150)),
    ("1in I-line F x MNPT", dict(DEFAULT_CONFIGS["transition"], a="fil", b="mnpt", od=100, odb=100, len=6)),
]
EXTRA_MANIFOLDS = [
    ("3in header, grooved ends, 1-1/2in drops, instrument ports",
     dict(DEFAULT_CONFIGS["row-manifold"], header=300, ends="grv", drop=150, inst="1")),
    ("8in header, 300 pitch extremes", dict(DEFAULT_CONFIGS["row-manifold"], header=800, drops=2, pitch=96)),
]
MANIFOLD_48 = dict(DEFAULT_CONFIGS["row-manifold"], drops=48)


def _transitions():
    return [(v["name"], v["input"]) for v in TRANSITION_VECTORS] + EXTRA_TRANSITIONS


def _manifolds():
    return [(v["name"], v["input"]) for v in MANIFOLD_VECTORS] + EXTRA_MANIFOLDS


@pytest.fixture(scope="session")
def built(cq):
    from app.model import build_manifold, build_transition
    from app.step_export import export_step

    out = {}
    for name, cfg in _transitions():
        b = build_transition(transition_geometry(cfg))
        out[("transition", name)] = (b, export_step(b.shape, "TEST-1"), transition_geometry(cfg))
    for name, cfg in _manifolds():
        b = build_manifold(manifold_geometry(cfg))
        out[("manifold", name)] = (b, export_step(b.shape, "TEST-1"), manifold_geometry(cfg))
    return out


ALL = [pytest.param("transition", n, id=f"transition: {n}") for n, _ in _transitions()] + [
    pytest.param("manifold", n, id=f"manifold: {n}") for n, _ in _manifolds()
]


@pytest.mark.parametrize("kind, name", ALL)
def test_one_valid_solid_and_step_reimports_in_mm(kind, name, built, cq):
    b, step, _ = built[(kind, name)]
    assert b.valid and len(b.shape.Solids()) == 1
    assert step.startswith(b"ISO-10303-21;") and b"SI_UNIT(.MILLI.,.METRE.)" in step
    solids = reimport(cq, step).solids().vals()
    assert len(solids) == 1 and solids[0].isValid()
    assert solids[0].Volume() == pytest.approx(b.volume_in3 * MM**3, rel=1e-6)
    bb = solids[0].BoundingBox()
    assert (bb.xmin, bb.ymin, bb.zmin, bb.xmax, bb.ymax, bb.zmax) == pytest.approx(
        tuple(x * MM for x in b.bbox_in), abs=1e-3
    )


@pytest.mark.parametrize("kind, name", ALL)
def test_solid_extents_match_the_ts_bbox(kind, name, built):
    """The drawing's bbox (TS `expected.bbox`: tube, ends and branch envelopes) is the solid's XY
    extents; Z is the largest End Connection (or valve) diameter."""
    b, _, g = built[(kind, name)]
    xmin, ymin, zmin, xmax, ymax, zmax = b.bbox_in
    want = g.bbox
    assert (xmin, ymin, xmax, ymax) == pytest.approx((want["minX"], want["minY"], want["maxX"], want["maxY"]), abs=1e-3)
    assert zmin == pytest.approx(-zmax, abs=1e-6)


@pytest.mark.parametrize("name, cfg", [(v["name"], v["input"]) for v in TRANSITION_VECTORS])
def test_transition_volume_exceeds_the_tube_and_faces_touch(name, cfg, built, cq):
    b, _, g = built[("transition", name)]
    assert b.volume_in3 > g.tube_volume_in3
    for end, face, out in ((g.end_a, g.face_a, g.dir_a), (g.end_b, g.face_b, g.dir_b)):
        if end.length <= 0:
            continue
        outer = end.profile[0][1]
        p = (face[0], 0.0, outer - 0.01)  # just inside the face's outer edge, off the drawing plane
        assert b.shape.distance(cq.Vertex.makeVertex(*p)) < 1e-6, (end.code, face)
        beyond = (p[0] + out[0] * 0.01, 0.0, p[2])
        assert b.shape.distance(cq.Vertex.makeVertex(*beyond)) == pytest.approx(0.01, abs=1e-6)


def test_transition_bore_is_open(built, cq):
    b, _, g = built[("transition", TRANSITION_VECTORS[1]["name"])]  # reducing
    for x in (0.25, g.overall_length / 2, g.overall_length - 0.25):
        assert not b.shape.isInside(cq.Vector(x, 0, 0)), x


def test_bw_transition_tube_wall_volume(built):
    """bw x bwp: End A has no length, so the tube starts at Face A."""
    name = next(v["name"] for v in TRANSITION_VECTORS if v["input"]["a"] == "bw")
    b, _, g = built[("transition", name)]
    assert g.weld_a == 0
    assert b.bbox_in[0] == pytest.approx(0, abs=1e-9)


@pytest.mark.parametrize("name, cfg", _manifolds())
def test_manifold_bores_open_and_drop_faces_present(name, cfg, built, cq):
    b, _, g = built[("manifold", name)]
    # header bore open between the weld lines; each branch bore open just below its face
    assert not b.shape.isInside(cq.Vector(g.header_length / 2 + 0.3, 0, 0))
    for br in g.branches:
        y = br.side * (br.height - 0.05) if not br.valve else br.side * (br.height + br.valve[0] - 0.05)
        assert not b.shape.isInside(cq.Vector(br.x, y, 0)), (br.role, br.x)
        # the header wall is solid next to a drop
    R = (g.header_od / 2 + g.header_id / 2) / 2
    assert b.shape.isInside(cq.Vector(g.header_length / 2 + 0.3, 0, R))


def test_manifold_cap_end_is_closed(built, cq):
    name = next(v["name"] for v in MANIFOLD_VECTORS if v["input"]["ends"] == "cap")
    b, _, g = built[("manifold", name)]
    assert g.end_b.code == "cap"
    # the axis point a hair inside Face B is solid (the head), the header bore behind it is open
    assert b.shape.isInside(cq.Vector(g.header_length - 0.02, 0, 0))
    assert not b.shape.isInside(cq.Vector(g.header_length - g.end_b.length - 0.5, 0, 0))


def test_manifold_48_drops_is_one_valid_solid_quickly(cq):
    from app.model import build_manifold
    from app.step_export import export_step

    t = time.perf_counter()
    g = manifold_geometry(MANIFOLD_48)
    b = build_manifold(g)
    step = export_step(b.shape, "TEST-48")
    elapsed = time.perf_counter() - t
    assert b.valid and len(g.drops) == 48
    assert elapsed < 60, f"48-drop manifold took {elapsed:.1f} s"
    solids = reimport(cq, step).solids().vals()
    assert len(solids) == 1 and solids[0].isValid()


def test_step_header_product_and_units(cq):
    from app.model import build_transition
    from app.step_export import ORGANIZATION, STEP_DESCRIPTION, export_step

    pn = "clmp-fl150-tspool-l12-6-200"
    step = export_step(build_transition(transition_geometry(DEFAULT_CONFIGS["transition"])).shape, pn).decode()
    assert ORGANIZATION == "Cardinal Cooling Systems"
    # OCCT wraps long STEP lines.
    assert re.search(r"FILE_DESCRIPTION\(\(\s*'" + re.escape(STEP_DESCRIPTION) + "'", step)
    assert f"FILE_NAME('{pn}.step'" in step
    assert "Cardinal Cooling Systems" in step
    assert "Sanitube" not in step
    assert "AUTOMOTIVE_DESIGN" in step  # AP214
    assert re.search(rf"PRODUCT\(\s*'{pn}'\s*,\s*'{pn}'", step)
    assert "SI_UNIT(.MILLI.,.METRE.)" in step


def test_inner_profiles_stay_inside_the_outer():
    """Every End Connection row the builders use: inner radius < outer radius along the profile."""
    from app import tables
    from app.geometry import end_geom
    from app.model import inner_profile

    def outer_at(prof, z):
        best = None
        for (z0, r0), (z1, r1) in zip(prof, prof[1:]):
            if z0 - 1e-9 <= z <= z1 + 1e-9:
                r = r0 if z1 == z0 else r0 + (r1 - r0) * (z - z0) / (z1 - z0)
                best = r if best is None else min(best, r)
        return best

    for row in tables.END_CONNECTIONS["rows"]:
        e = end_geom(row["code"], row["size_code"])
        if e.length <= 0:
            continue
        for z, r in inner_profile(e):
            o = outer_at(e.profile, z)
            assert o is not None and r < o - 1e-6, (row["code"], row["size_code"], z, r, o)
        assert math.isclose(inner_profile(e)[-1][0], e.length)
