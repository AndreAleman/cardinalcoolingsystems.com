"""Pure-Python ports of the parts of the TS builder geometry the model needs.

- Transition Spool (shared/cpq/ts/builder-transition.ts transitionGeometry): axis along +X, Face A
  at (0,0) facing -X, Face B at (L,0) facing +X. The tube at size od runs from End A's weld line;
  when od != odb a concentric reducer (length by the larger size) sits directly behind End B's weld
  line.
- Row Manifold (shared/cpq/ts/builder-row-manifold.ts manifoldGeometry): header along +X from Face A
  (0,0) to Face B (L,0); drops toward +Y at the pitch; fill/drain below, vent/instrument ports above
  in the end allowances.

Inches, XY plane, same conventions as the drawing. No CadQuery import here: the golden-fixture tests
and the runtime parity check run without it. Held to the TS numbers by tests/test_geometry_golden.py
(fixtures) and by `compare_expected` (runtime, every leaf within 1e-3).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Protocol

from . import tables

Vec2 = tuple[float, float]


@dataclass(frozen=True)
class EndGeom:
    code: str
    size_code: int
    length: float
    max_od: float
    profile: tuple[Vec2, ...]  # OUTER half-section (axial from face, radius), face -> weld line
    bore: float | None  # None = tube ID; 0 = closed (cap); else the bore diameter at the face
    mass_lb: float


def end_geom(code: str, size_code: int) -> EndGeom:
    row = tables.end_connection_row(code, size_code)
    return EndGeom(
        code=code,
        size_code=size_code,
        length=float(row["length_in"]),
        max_od=float(row["max_od_in"]),
        profile=tuple((float(p[0]), float(p[1])) for p in row["profile"]),
        bore=None if row["bore_in"] is None else float(row["bore_in"]),
        mass_lb=float(row.get("mass_lb", 0.0)),
    )


def end_envelope(face: Vec2, dir_: Vec2, e: EndGeom) -> list[Vec2]:
    """The four corners of an End Connection envelope (maxOd/2 either side, `length` back from the
    face). Same as TS endEnvelope."""
    m = e.max_od / 2
    n = (-dir_[1], dir_[0])
    back = (face[0] - dir_[0] * e.length, face[1] - dir_[1] * e.length)
    return [
        (face[0] + n[0] * m, face[1] + n[1] * m),
        (face[0] - n[0] * m, face[1] - n[1] * m),
        (back[0] + n[0] * m, back[1] + n[1] * m),
        (back[0] - n[0] * m, back[1] - n[1] * m),
    ]


def bbox_of(pts: list[Vec2]) -> dict[str, float]:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return {"minX": min(xs), "minY": min(ys), "maxX": max(xs), "maxY": max(ys)}


@dataclass(frozen=True)
class AxialSegment:
    x0: float
    x1: float
    r0: float
    r1: float
    ri0: float
    ri1: float
    style: str  # "tube" | "cone"


def segment_wall_volume(s: AxialSegment) -> float:
    """Outer frustum - inner frustum (TS segmentWallVolume)."""
    h = s.x1 - s.x0
    if h <= 0:
        return 0.0

    def fr(a: float, b: float) -> float:
        return math.pi / 3 * h * (a * a + a * b + b * b)

    return max(0.0, fr(s.r0, s.r1) - fr(s.ri0, s.ri1))


def _face(point: Vec2, dir_: Vec2) -> dict[str, list[float]]:
    return {"point": [point[0], point[1]], "dir": [dir_[0], dir_[1]]}


# --- Transition Spool ----------------------------------------------------------------------------


@dataclass(frozen=True)
class TransitionGeometry:
    od: float
    odb: float
    wall: float
    wall_b: float
    id: float
    idb: float
    overall_length: float
    end_a: EndGeom
    end_b: EndGeom
    weld_a: float
    weld_b: float
    reducer: tuple[float, float] | None  # (x0, x1)
    tube_straight: float
    segments: tuple[AxialSegment, ...]
    bbox: dict[str, float]
    tube_volume_in3: float

    face_a: Vec2 = (0.0, 0.0)
    dir_a: Vec2 = (-1.0, 0.0)
    dir_b: Vec2 = (1.0, 0.0)

    @property
    def face_b(self) -> Vec2:
        return (self.overall_length, 0.0)

    def summary(self) -> dict[str, Any]:
        """Exactly the TS `transitionExpected` keys."""
        return {
            "overallLength": self.overall_length,
            "tubeStraight": self.tube_straight,
            "weldA": [self.weld_a, 0.0],
            "weldB": [self.weld_b, 0.0],
            "reducer": None if self.reducer is None else {"x0": self.reducer[0], "x1": self.reducer[1]},
            "faces": {"a": _face(self.face_a, self.dir_a), "b": _face(self.face_b, self.dir_b)},
            "bbox": dict(self.bbox),
            "tubeVolumeIn3": self.tube_volume_in3,
        }


def transition_geometry(config: dict[str, Any]) -> TransitionGeometry:
    """`config` = the canonical TS TransitionOptions (a, b, od, odb, len, alloy, qty)."""
    od_code, odb_code = int(config["od"]), int(config["odb"])
    od, wall, id_ = tables.tube_dims(od_code)
    odb, wall_b, idb = tables.tube_dims(odb_code)
    L = float(config["len"])
    a = end_geom(config["a"], od_code)
    b = end_geom(config["b"], odb_code)
    weld_a = a.length
    weld_b = L - b.length
    reducing = od_code != odb_code
    H = tables.reducer_length(max(od_code, odb_code)) if reducing else 0.0
    reducer = (weld_b - H, weld_b) if reducing else None
    tube_end = reducer[0] if reducer else weld_b
    tube_straight = tube_end - weld_a

    segments: list[AxialSegment] = []
    if tube_straight > 1e-9:
        segments.append(AxialSegment(weld_a, tube_end, od / 2, od / 2, id_ / 2, id_ / 2, "tube"))
    if reducer and reducer[1] > max(reducer[0], weld_a) + 1e-9:
        segments.append(AxialSegment(reducer[0], reducer[1], od / 2, odb / 2, id_ / 2, idb / 2, "cone"))

    pts: list[Vec2] = [
        (0.0, od / 2),
        (0.0, -od / 2),
        (L, odb / 2),
        (L, -odb / 2),
        *end_envelope((0.0, 0.0), (-1.0, 0.0), a),
        *end_envelope((L, 0.0), (1.0, 0.0), b),
    ]
    for s in segments:
        pts += [(s.x0, s.r0), (s.x0, -s.r0), (s.x1, s.r1), (s.x1, -s.r1)]

    return TransitionGeometry(
        od=od,
        odb=odb,
        wall=wall,
        wall_b=wall_b,
        id=id_,
        idb=idb,
        overall_length=L,
        end_a=a,
        end_b=b,
        weld_a=weld_a,
        weld_b=weld_b,
        reducer=reducer,
        tube_straight=tube_straight,
        segments=tuple(segments),
        bbox=bbox_of(pts),
        tube_volume_in3=sum(segment_wall_volume(s) for s in segments),
    )


# --- Row Manifold --------------------------------------------------------------------------------

DROP_END = {"tc": "tc", "bv": "tc", "uqd": "bw"}


def manifold_end_codes(ends: str) -> tuple[str, str]:
    """`cap` = TC inlet at End A and a welded cap at End B (TS manifoldEndCodes)."""
    return ("tc", "cap") if ends == "cap" else (ends, ends)


def manifold_header_length(header: int, drops: int, pitch: float) -> float:
    return (drops - 1) * pitch + 2 * float(tables.manifold_row(header)["end_allowance_in"])


@dataclass(frozen=True)
class ManifoldBranch:
    role: str  # drop | fill | drain | vent | instrument
    x: float
    side: int  # +1 up, -1 down
    size_code: int
    od: float
    wall: float
    id: float
    height: float  # header centerline -> branch face
    stub_length: float  # header OD -> the end's weld line
    end: EndGeom
    valve: tuple[float, float] | None  # (length, mass_lb) of a clamped ball valve, else None

    @property
    def face(self) -> Vec2:
        return (self.x, self.side * self.height)

    @property
    def dir(self) -> Vec2:
        return (0.0, float(self.side))


@dataclass(frozen=True)
class ManifoldGeometry:
    header_code: int
    header_od: float
    header_wall: float
    header_id: float
    header_length: float
    end_allowance: float
    end_a: EndGeom
    end_b: EndGeom
    header_tube_length: float
    pitch: float
    drop_height: float
    branches: tuple[ManifoldBranch, ...]
    bbox: dict[str, float]

    face_a: Vec2 = (0.0, 0.0)
    dir_a: Vec2 = (-1.0, 0.0)
    dir_b: Vec2 = (1.0, 0.0)

    @property
    def face_b(self) -> Vec2:
        return (self.header_length, 0.0)

    @property
    def drops(self) -> list[ManifoldBranch]:
        return [b for b in self.branches if b.role == "drop"]

    def summary(self) -> dict[str, Any]:
        """Exactly the TS `manifoldExpected` keys."""
        drops = self.drops
        return {
            "headerLength": self.header_length,
            "headerTubeLength": self.header_tube_length,
            "faces": {"a": _face(self.face_a, self.dir_a), "b": _face(self.face_b, self.dir_b)},
            "drops": len(drops),
            "firstDropX": drops[0].x,
            "lastDropX": drops[-1].x,
            "dropFaceY": self.drop_height,
            "branches": [
                {"role": b.role, "x": b.x, "side": b.side, "size_code": b.size_code, "faceY": b.face[1]}
                for b in self.branches
            ],
            "bbox": dict(self.bbox),
        }


def _branch(role: str, x: float, side: int, size: int, code: str, height: float, header_od: float,
            valve: tuple[float, float] | None = None) -> ManifoldBranch:
    od, wall, id_ = tables.tube_dims(size)
    end = end_geom(code, size)
    return ManifoldBranch(
        role=role,
        x=x,
        side=side,
        size_code=size,
        od=od,
        wall=wall,
        id=id_,
        height=height,
        stub_length=height - header_od / 2 - end.length,
        end=end,
        valve=valve,
    )


def manifold_geometry(config: dict[str, Any]) -> ManifoldGeometry:
    """`config` = the canonical TS RowManifoldOptions (header, drops, pitch, drop, dstyle, ends, ...)."""
    m = tables.MANIFOLD
    header = int(config["header"])
    drops = int(config["drops"])
    pitch = float(config["pitch"])
    drop = int(config["drop"])
    dstyle = str(config["dstyle"])
    row = tables.manifold_row(header)
    h_od, h_wall, h_id = tables.tube_dims(header)
    code_a, code_b = manifold_end_codes(str(config["ends"]))
    a = end_geom(code_a, header)
    b = end_geom(code_b, header)
    allowance = float(row["end_allowance_in"])
    L = manifold_header_length(header, drops, pitch)
    port_h = h_od / 2 + float(m["port_projection_in"])
    drop_height = float(row["drop_height_in"])

    branches: list[ManifoldBranch] = []
    v = tables.valve_row("bv", drop) if dstyle == "bv" else None
    valve = (float(v["length_in"]), float(v["mass_lb"])) if v else None
    for i in range(drops):
        branches.append(
            _branch("drop", allowance + i * pitch, 1, drop, DROP_END[dstyle], drop_height, h_od, valve)
        )
    drop_od = tables.tube_dims(drop)[0]
    drop_r = max(drop_od, end_geom(DROP_END[dstyle], drop).max_od) / 2
    span_a = (a.length, allowance - drop_r)
    span_b = (L - allowance + drop_r, L - b.length)
    mid_a = (span_a[0] + span_a[1]) / 2
    mid_b = (span_b[0] + span_b[1]) / 2
    if str(config["fill"]) == "1":
        branches.append(_branch("fill", mid_a, -1, int(m["fill_size_code"]), "tc", port_h, h_od))
        branches.append(_branch("drain", mid_b, -1, int(m["drain_size_code"]), "tc", port_h, h_od))
        branches.append(_branch("vent", mid_b, 1, int(m["vent_size_code"]), "tc", port_h, h_od))
    if str(config["inst"]) == "1":
        n = int(m["instrument_ports"])
        for k in range(n):
            x = span_a[0] + ((k + 1) * (span_a[1] - span_a[0])) / (n + 1)
            branches.append(_branch("instrument", x, 1, int(m["instrument_size_code"]), "tc", port_h, h_od))

    pts: list[Vec2] = [
        (0.0, h_od / 2),
        (0.0, -h_od / 2),
        (L, h_od / 2),
        (L, -h_od / 2),
        *end_envelope((0.0, 0.0), (-1.0, 0.0), a),
        *end_envelope((L, 0.0), (1.0, 0.0), b),
    ]
    for br in branches:
        pts += end_envelope(br.face, br.dir, br.end)
        if br.valve:
            pts.append((br.x, br.side * (br.height + br.valve[0])))

    return ManifoldGeometry(
        header_code=header,
        header_od=h_od,
        header_wall=h_wall,
        header_id=h_id,
        header_length=L,
        end_allowance=allowance,
        end_a=a,
        end_b=b,
        header_tube_length=L - a.length - b.length,
        pitch=pitch,
        drop_height=drop_height,
        branches=tuple(branches),
        bbox=bbox_of(pts),
    )


# --- Runtime drift guard -------------------------------------------------------------------------

PARITY_TOLERANCE = 1e-3


def _flatten(prefix: str, value: Any, out: dict[str, Any]) -> None:
    if isinstance(value, dict):
        for k, v in value.items():
            _flatten(f"{prefix}.{k}" if prefix else k, v, out)
    elif isinstance(value, (list, tuple)):
        # The length is a leaf too, so a missing or extra branch is a mismatch either way.
        out[f"{prefix}.length"] = len(value)
        for i, v in enumerate(value):
            _flatten(f"{prefix}[{i}]", v, out)
    else:
        out[prefix] = value


class _HasSummary(Protocol):
    def summary(self) -> dict[str, Any]: ...


def compare_expected(
    expected: dict[str, Any], geometry: _HasSummary, tol: float = PARITY_TOLERANCE
) -> list[str]:
    """Compares every leaf the backend sent against our own numbers.

    Returns human-readable mismatch lines ("tubeStraight: expected 9.01, got 9.0"); an empty list
    means parity. Keys we don't compute are reported too (better to refuse than to guess). Strings
    (a branch `role`) must be equal; numbers within `tol`.
    """
    ours: dict[str, Any] = {}
    theirs: dict[str, Any] = {}
    _flatten("", geometry.summary(), ours)
    _flatten("", expected, theirs)
    problems: list[str] = []
    for key, want in theirs.items():
        if key not in ours:
            # A null (e.g. no reducer) flattens to the parent key; a value flattens to children.
            if want is None and any(k.startswith(key + ".") or k.startswith(key + "[") for k in ours):
                problems.append(f"{key}: expected null, got a value")
            else:
                problems.append(f"{key}: expected {want}, not computed by the CAD service")
            continue
        got = ours[key]
        if want is None or got is None:
            if want is not got:
                shown = round(float(got), 6) if isinstance(got, (int, float)) else got
                problems.append(f"{key}: expected {want}, got {shown}")
            continue
        if isinstance(want, str) or isinstance(got, str):
            if want != got:
                problems.append(f"{key}: expected {want!r}, got {got!r}")
            continue
        if isinstance(want, bool) or not isinstance(want, (int, float)):
            problems.append(f"{key}: expected a number, got {want!r}")
            continue
        if not math.isfinite(want) or abs(float(want) - float(got)) > tol:
            shown = got if isinstance(got, int) else round(float(got), 6)
            problems.append(f"{key}: expected {want}, got {shown}")
    # A value we compute where the backend sent null at a parent (e.g. reducer null vs ours set) is
    # covered above; a parent we have as null while they sent children is covered by "not computed".
    return problems
