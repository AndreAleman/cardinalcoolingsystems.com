"""CadQuery models: the Transition Spool and the Row Manifold (plan B8). Kits, strainers and hoses
have no STEP (a kit is several stocked parts, not one solid).

Built in inches in the drawing's XY plane (see geometry.py), so the STEP and the Engineering View
agree on orientation. Every End Connection is its `profile` (outer half-section, face -> weld line)
closed against its inner profile and revolved about the face axis:
- bore null: the tube ID from face to weld line (Sanitube's rule);
- bore > 0 (fnpt thread envelope, grv / bwp pipe ID): the bore from the face, then a cone down to
  the tube ID where the outer profile cones down to the tube OD;
- bore 0 (cap): the 2:1 ellipsoidal head offset inward by the tube wall (a closed shell), as in
  shared/cpq/tools/gen-end-connections.mjs.

- Transition: tube annulus (weld A -> reducer or weld B), the concentric reducer (revolved frustum
  annulus), the two End Connections; fused once.
- Row Manifold: header and branch outer cylinders fused in one boolean, then every bore cut in one
  boolean (header bore + each branch bore from the header axis), then every End Connection and drop
  valve fused in one boolean. Three booleans whatever the drop count (48 drops included).
  Drop ball valves (dstyle bv) are an envelope: a hollow cylinder of the TC flange OD, the valve's
  table length, clamped on the drop face.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import cadquery as cq

from . import tables
from .geometry import EndGeom, ManifoldGeometry, TransitionGeometry


class ModelError(RuntimeError):
    pass


@dataclass
class BuiltSolid:
    shape: cq.Shape  # one Solid, inches
    valid: bool
    volume_in3: float
    bbox_in: tuple[float, float, float, float, float, float]


_OVERSHOOT = 0.01  # in; bore tools reach past the tube ends (End Connections are fused afterwards)


def inner_profile(end: EndGeom) -> list[tuple[float, float]]:
    """Inner (bore) half-section [axial_from_face, radius], face -> weld line."""
    _, wall, tube_id = tables.tube_dims(end.size_code)
    L = end.length
    if end.bore is None:
        return [(0.0, tube_id / 2), (L, tube_id / 2)]
    if end.bore == 0:
        # Closed cap: the generator's inner ellipse (R - wall, h - wall) starting `wall` in.
        od = tables.tube_dims(end.size_code)[0]
        R, h, n = od / 2, od / 4, 6
        rr, hh = R - wall, h - wall
        pts = []
        for i in range(n + 1):
            x = hh * i / n
            r = rr * math.sqrt(max(0.0, 1 - ((hh - x) / hh) ** 2))
            pts.append((wall + x, r))
        pts.append((L, rr))
        return pts
    # Open adapter: bore from the face to where the outer profile starts coning to the tube OD.
    prof = end.profile
    z1 = prof[-3][0] if len(prof) >= 3 else 0.0
    z2 = prof[-2][0] if len(prof) >= 2 else L
    b = end.bore / 2
    return [(0.0, b), (z1, b), (max(z2, z1), tube_id / 2), (L, tube_id / 2)]


def _dedupe(pts: list[tuple[float, float]]) -> list[tuple[float, float]]:
    clean: list[tuple[float, float]] = []
    for p in pts:
        if not clean or abs(p[0] - clean[-1][0]) > 1e-12 or abs(p[1] - clean[-1][1]) > 1e-12:
            clean.append(p)
    if len(clean) > 1 and abs(clean[0][0] - clean[-1][0]) < 1e-12 and abs(clean[0][1] - clean[-1][1]) < 1e-12:
        clean.pop()
    return clean


def end_connection(end: EndGeom, face: tuple[float, float], outward: tuple[float, float]) -> cq.Shape | None:
    """End Connection solid at `face`, its axis along `outward` (a unit direction in the XY plane)."""
    if end.length <= 0 or not end.profile:
        return None
    inward = (-outward[0], -outward[1])
    # Local sketch plane: x = radial (global Z), y = axial (inward from the face).
    plane = cq.Plane(origin=(face[0], face[1], 0), xDir=(0, 0, 1), normal=(-inward[1], inward[0], 0))
    outer = [(r, z) for (z, r) in end.profile]
    inner = [(r, z) for (z, r) in reversed(inner_profile(end))]
    pts = _dedupe(outer + inner)
    wp = cq.Workplane(plane).polyline(pts).close().revolve(360, (0, 0, 0), (0, 1, 0))
    return wp.val()


def _cylinder(
    radius: float,
    length: float,
    start: tuple[float, float],
    direction: tuple[float, float],
    seam: tuple[float, float, float],
) -> cq.Solid:
    """Cylinder along an XY direction with its seam line turned to `seam` (a radial direction).

    The header seam goes to +Z (no branch there), so no branch hole cuts the seam line.
    """
    from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder
    from OCP.gp import gp_Ax2, gp_Dir, gp_Pnt

    ax = gp_Ax2(gp_Pnt(start[0], start[1], 0), gp_Dir(direction[0], direction[1], 0), gp_Dir(*seam))
    return cq.Solid(BRepPrimAPI_MakeCylinder(ax, radius, length).Shape())


_AXIAL_SEAM = (0.0, 0.0, 1.0)
_BRANCH_SEAM = (1.0, 0.0, 0.0)


def _annulus_x(r_out: float, r_in: float, x0: float, x1: float) -> cq.Shape:
    outer = _cylinder(r_out, x1 - x0, (x0, 0.0), (1.0, 0.0), _AXIAL_SEAM)
    bore = _cylinder(r_in, x1 - x0 + 2 * _OVERSHOOT, (x0 - _OVERSHOOT, 0.0), (1.0, 0.0), _AXIAL_SEAM)
    return outer.cut(bore)


def _frustum_annulus_x(x0: float, x1: float, r0: float, r1: float, ri0: float, ri1: float) -> cq.Shape:
    """Concentric reducer wall: (x, r) quad revolved about the X axis."""
    pts = [(x0, ri0), (x0, r0), (x1, r1), (x1, ri1)]
    return cq.Workplane("XY").polyline(pts).close().revolve(360, (0, 0, 0), (1, 0, 0)).val()


def _safe_clean(shape: cq.Shape) -> cq.Shape:
    """`clean()` (UnifySameDomain) merges split faces; keep it only when the result is still one
    valid solid of the same volume (it cleans a copy: UnifySameDomain can break the input)."""
    try:
        cleaned = shape.copy().clean()
    except Exception:
        return shape
    if (
        len(cleaned.Solids()) == 1
        and cleaned.isValid()
        and math.isclose(cleaned.Volume(), shape.Volume(), rel_tol=1e-9, abs_tol=1e-12)
    ):
        return cleaned
    return shape


def _fuse_all(base: cq.Shape | None, tools: list[cq.Shape]) -> cq.Shape:
    tools = [t for t in tools if t is not None]
    if base is None:
        if not tools:
            raise ModelError("nothing to build")
        base, tools = tools[0], tools[1:]
    return base.fuse(*tools) if tools else base


def build_transition(g: TransitionGeometry) -> BuiltSolid:
    """Tube + optional reducer + the two End Connections, fused once."""
    try:
        pieces: list[cq.Shape] = []
        for s in g.segments:
            x0 = max(s.x0, g.weld_a)  # never inside End A (an overlap is a Standard Range review)
            if s.x1 - x0 <= 1e-9:
                continue
            if s.style == "tube":
                pieces.append(_annulus_x(s.r0, s.ri0, x0, s.x1))
            else:
                t = (x0 - s.x0) / (s.x1 - s.x0)
                r0 = s.r0 + (s.r1 - s.r0) * t
                ri0 = s.ri0 + (s.ri1 - s.ri0) * t
                pieces.append(_frustum_annulus_x(x0, s.x1, r0, s.r1, ri0, s.ri1))
        ends = [
            end_connection(g.end_a, g.face_a, g.dir_a),
            end_connection(g.end_b, g.face_b, g.dir_b),
        ]
        shape = _safe_clean(_fuse_all(None, pieces + ends))
    except ModelError:
        raise
    except Exception as exc:  # OCC raises StdFail_* etc.
        raise ModelError(f"model build failed: {exc}") from exc
    return _one_solid(shape)


def _valve_envelope(br) -> cq.Shape:
    """A clamped drop ball valve as a hollow cylinder: TC flange OD, table length, tube bore."""
    length = br.valve[0]
    start = (br.x, br.side * br.height)
    outer = _cylinder(br.end.max_od / 2, length, start, (0.0, float(br.side)), _BRANCH_SEAM)
    bore = _cylinder(
        br.id / 2, length + 2 * _OVERSHOOT, (br.x, br.side * (br.height - _OVERSHOOT)), (0.0, float(br.side)),
        _BRANCH_SEAM,
    )
    return outer.cut(bore)


def build_manifold(g: ManifoldGeometry) -> BuiltSolid:
    """Header + branch stubs (one fuse), every bore (one cut), ends and valves (one fuse)."""
    try:
        R, r_h = g.header_od / 2, g.header_id / 2
        xa = g.end_a.length
        xb = g.header_length - g.end_b.length
        if xb - xa <= 1e-9:
            raise ModelError("header End Connections leave no header tube")
        header = _cylinder(R, xb - xa, (xa, 0.0), (1.0, 0.0), _AXIAL_SEAM)
        stubs: list[cq.Shape] = []
        bores: list[cq.Shape] = [
            _cylinder(r_h, xb - xa + 2 * _OVERSHOOT, (xa - _OVERSHOOT, 0.0), (1.0, 0.0), _AXIAL_SEAM)
        ]
        for br in g.branches:
            weld = br.height - br.end.length  # header axis -> the branch end's weld line
            if weld <= R + 1e-6:
                raise ModelError(f"{br.role} at x={br.x:.3f}: End Connection reaches into the header")
            d = (0.0, float(br.side))
            stubs.append(_cylinder(br.od / 2, weld, (br.x, 0.0), d, _BRANCH_SEAM))
            # Bore from the header axis to the weld line (+ overshoot past it; the end is fused later).
            bores.append(_cylinder(br.id / 2, weld + _OVERSHOOT, (br.x, 0.0), d, _BRANCH_SEAM))

        shape: cq.Shape = header.fuse(*stubs) if stubs else header
        shape = shape.cut(*bores)

        tools: list[cq.Shape | None] = [
            end_connection(g.end_a, g.face_a, g.dir_a),
            end_connection(g.end_b, g.face_b, g.dir_b),
        ]
        for br in g.branches:
            tools.append(end_connection(br.end, br.face, br.dir))
            if br.valve:
                tools.append(_valve_envelope(br))
        shape = _fuse_all(shape, [t for t in tools if t is not None])
        if len(g.branches) <= 24:
            # UnifySameDomain on a 48-drop header costs more than it saves; skip it there.
            shape = _safe_clean(shape)
    except ModelError:
        raise
    except Exception as exc:
        raise ModelError(f"model build failed: {exc}") from exc
    return _one_solid(shape)


def _one_solid(shape: cq.Shape) -> BuiltSolid:
    solids = shape.Solids()
    if len(solids) != 1:
        raise ModelError(f"expected one solid, got {len(solids)}")
    solid = solids[0]
    valid = bool(solid.isValid())
    if not valid:
        raise ModelError("solid is not valid")
    bb = solid.BoundingBox()
    return BuiltSolid(
        shape=solid,
        valid=valid,
        volume_in3=float(solid.Volume()),
        bbox_in=(bb.xmin, bb.ymin, bb.zmin, bb.xmax, bb.ymax, bb.zmax),
    )
