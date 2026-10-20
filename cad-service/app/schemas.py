"""Request/response models for POST /v1/packages/{kind} (Cardinal Builder, plan B8).

`config` is the builder's canonical TS options object (shared/cpq/ts/option-keys.ts). The backend has
already validated it (BuilderDef.validate); these checks are defense in depth, with the hard limits
from option-keys.ts and the tables:
- transition: ends A/B, sizes od/odb, an End Connection row at each size, len 2-72 on the 1/8" grid;
- row-manifold: header 3/4/6/8", 2-48 drops, pitch 6-96, drop 1/1.5", style, ends, flags;
- cdu-kit, strainer, hose: PDF only (no geometry), keys and values checked the same way.

STEP kinds (transition, row-manifold) also carry `expected` (the TS `BuilderDef.expected(o)`), which
is compared leaf by leaf with our own geometry (422 geometry_mismatch).
"""

from __future__ import annotations

import math
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictFloat, StrictInt, field_validator, model_validator

from . import tables

MAX_SVG_BYTES = 2 * 1024 * 1024

Alloy = Literal["t316l", "t304l"]
Flag = Literal["0", "1"]


def _on_eighth_grid(v: float) -> bool:
    return abs(v * 8 - round(v * 8)) <= 1e-6


def _in_range(name: str, v: int, lo: int, hi: int) -> int:
    if not lo <= v <= hi:
        raise ValueError(f"{name} must be {lo} to {hi}")
    return v


# --- configs -------------------------------------------------------------------------------------

TRANSITION_SIZES = (100, 150, 200, 250, 300, 400, 600, 800)


class TransitionConfigIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    a: Literal["tc", "mil", "fil", "pbs", "tbs", "bw"]
    b: Literal["fl150", "fl300", "mnpt", "fnpt", "grv", "bwp"]
    od: StrictInt
    odb: StrictInt
    len: StrictInt | StrictFloat  # a JSON number; "12" is refused
    alloy: Alloy
    qty: StrictInt

    @field_validator("od", "odb")
    @classmethod
    def _size(cls, v: int) -> int:
        if v not in TRANSITION_SIZES or not tables.has_tube_size(v):
            raise ValueError("tube size is not available for transitions")
        return v

    @field_validator("len")
    @classmethod
    def _length(cls, v: float) -> float:
        v = float(v)
        if not math.isfinite(v):
            raise ValueError("len must be a number")
        if not _on_eighth_grid(v):
            raise ValueError('len must be in 1/8" increments')
        if not 2 - 1e-9 <= v <= 72 + 1e-9:
            raise ValueError("len must be 2 to 72 in")
        return round(v * 8) / 8

    @field_validator("qty")
    @classmethod
    def _qty(cls, v: int) -> int:
        return _in_range("qty", v, 1, 500)

    @model_validator(mode="after")
    def _cross(self) -> "TransitionConfigIn":
        if not tables.has_end_connection_row(self.a, self.od):
            raise ValueError(f"End Connection {self.a} is not available at size {self.od}")
        if not tables.has_end_connection_row(self.b, self.odb):
            raise ValueError(f"End Connection {self.b} is not available at size {self.odb}")
        return self


class RowManifoldConfigIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    header: Literal[300, 400, 600, 800]
    drops: StrictInt
    pitch: StrictInt
    drop: Literal[100, 150]
    dstyle: Literal["tc", "bv", "uqd"]
    ends: Literal["tc", "fl150", "grv", "cap"]
    pair: Flag
    alloy: Alloy
    finish: Literal["32", "20"]
    fill: Flag
    inst: Flag
    docs: list[Literal["hydro", "mtr", "pass", "weldmap"]]

    @field_validator("drops")
    @classmethod
    def _drops(cls, v: int) -> int:
        return _in_range("drops", v, 2, 48)

    @field_validator("pitch")
    @classmethod
    def _pitch(cls, v: int) -> int:
        return _in_range("pitch", v, 6, 96)


class CduKitConfigIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cdu: Literal["none", "boyd-10u", "vertiv-cdu-600"]
    port: Literal["tc100", "tc150", "tc200", "tc250", "tc300", "tc400", "dn50", "dn80"]
    side: Literal["tcs", "fws"]
    run: Literal["hard", "hose"]
    far: Literal["tc", "fl150", "npt", "grv"]
    len: StrictInt
    iso: Literal["none", "bfv", "bv"]
    strainer: Literal["none", "short", "long"]
    gasket: Literal["epdm", "sil", "ptfe"]
    spares: Flag
    units: StrictInt
    alloy: Alloy

    @field_validator("len")
    @classmethod
    def _len(cls, v: int) -> int:
        return _in_range("len", v, 12, 240)

    @field_validator("units")
    @classmethod
    def _units(cls, v: int) -> int:
        return _in_range("units", v, 1, 200)


class StrainerConfigIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    size: Literal[100, 150, 200, 250, 300, 400, 600]
    body: Literal["short", "long"]
    mesh: Literal["20", "40", "100"]
    iso: Flag
    dp: Flag
    qty: StrictInt

    @field_validator("qty")
    @classmethod
    def _qty(cls, v: int) -> int:
        return _in_range("qty", v, 1, 500)


class HoseConfigIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    size: Literal[50, 75, 100, 150, 200, 250, 300, 400]
    len: StrictInt
    ends: Literal["tc-tc", "tc-npt", "tc-fl150"]
    cover: Literal["braid", "silicone", "ptfe"]
    sleeve: Literal["none", "armor", "fire"]
    qty: StrictInt

    @field_validator("len")
    @classmethod
    def _len(cls, v: int) -> int:
        return _in_range("len", v, 12, 240)

    @field_validator("qty")
    @classmethod
    def _qty(cls, v: int) -> int:
        return _in_range("qty", v, 1, 500)


# --- envelopes -----------------------------------------------------------------------------------


class _Envelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    part_number: str = Field(pattern=r"^[A-Za-z0-9-]{1,80}$")
    tables_hash: str = Field(min_length=1, max_length=64)
    # Size is checked separately (413 svg_too_large), so no max_length here.
    drawing_svg: str = Field(min_length=1)
    description: str = Field(min_length=1, max_length=300)


def _missing_faces(v: dict[str, Any], names: tuple[str, ...]) -> list[str]:
    faces = v.get("faces")
    if not isinstance(faces, dict):
        return ["faces"]
    missing: list[str] = []
    for n in names:
        f = faces.get(n)
        if not isinstance(f, dict) or "point" not in f or "dir" not in f:
            missing.append(f"faces.{n}.point/dir")
    return missing


TRANSITION_EXPECTED = ("overallLength", "tubeStraight", "weldA", "weldB", "reducer", "bbox", "tubeVolumeIn3")
MANIFOLD_EXPECTED = ("headerLength", "headerTubeLength", "drops", "firstDropX", "lastDropX", "dropFaceY",
                     "branches", "bbox")


class TransitionPackageRequest(_Envelope):
    config: TransitionConfigIn
    # TS transitionExpected(o). Kept as a free-form dict: every leaf is compared.
    expected: dict[str, Any]

    @field_validator("expected")
    @classmethod
    def _expected_keys(cls, v: dict[str, Any]) -> dict[str, Any]:
        # An empty `expected` would make the parity check vacuous, so the keys are required.
        missing = [k for k in TRANSITION_EXPECTED if k not in v] + _missing_faces(v, ("a", "b"))
        if missing:
            raise ValueError("expected is missing " + ", ".join(sorted(set(missing))))
        return v


class RowManifoldPackageRequest(_Envelope):
    config: RowManifoldConfigIn
    # TS manifoldExpected(o).
    expected: dict[str, Any]

    @field_validator("expected")
    @classmethod
    def _expected_keys(cls, v: dict[str, Any]) -> dict[str, Any]:
        missing = [k for k in MANIFOLD_EXPECTED if k not in v] + _missing_faces(v, ("a", "b"))
        if missing:
            raise ValueError("expected is missing " + ", ".join(sorted(set(missing))))
        return v


class CduKitPackageRequest(_Envelope):
    config: CduKitConfigIn


class StrainerPackageRequest(_Envelope):
    config: StrainerConfigIn


class HosePackageRequest(_Envelope):
    config: HoseConfigIn


# --- response ------------------------------------------------------------------------------------


class FileOut(BaseModel):
    filename: str
    content_type: str
    bytes: int
    sha256: str
    base64: str


class SolidOut(BaseModel):
    valid: bool
    volume_in3: float
    bbox_in: list[float]


class PackageResponse(BaseModel):  # same shape for every kind
    part_number: str
    generator_version: str
    tables_hash: str
    step: FileOut | None  # null for PDF-only kinds (cdu-kit, strainer, hose)
    pdf: FileOut | None  # null only in CAD_SERVICE_DEV mode without libcairo
    solid: SolidOut | None  # null for PDF-only kinds
    timings_ms: dict[str, int]
