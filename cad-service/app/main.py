"""FastAPI app: GET /health, POST /v1/packages/{transition,row-manifold,cdu-kit,strainer,hose}.

Contract: docs/specs/cardinal-builder-plan.md B8/B9 (ported from Sanitube's cad-service, same
envelope and response shape):
- transition, row-manifold: STEP + PDF. The backend sends the TS `expected` geometry; we recompute it
  from our own port and refuse with 422 geometry_mismatch on any leaf off by more than 1e-3.
- cdu-kit, strainer, hose: PDF only (the backend's SVG sheet, drawing + BOM). `step` and `solid` are
  null.

Stateless compute: no DB, no storage credentials; the backend stores the returned bytes.
Run: `CAD_SERVICE_TOKEN=... uvicorn app.main:app --host :: --port 8080 --workers 1`.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import logging
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, Callable

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import auth, pdf, tables
from .geometry import compare_expected, manifold_geometry, transition_geometry
from .schemas import (
    MAX_SVG_BYTES,
    CduKitPackageRequest,
    HosePackageRequest,
    RowManifoldPackageRequest,
    StrainerPackageRequest,
    TransitionPackageRequest,
)
from .version import GENERATOR_VERSION

log = logging.getLogger("cad_service")
if not log.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

# Whole request ceiling: the SVG (≤ 2 MB) plus generous room for the other fields.
MAX_REQUEST_BYTES = MAX_SVG_BYTES + 256 * 1024
# The plan golden transition: 2" TC x 150# flange, 12".
WARM_VECTOR = {"a": "tc", "b": "fl150", "od": 200, "odb": 200, "len": 12, "alloy": "t316l", "qty": 1}


def error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


class ServiceState:
    def __init__(self) -> None:
        self.warm = False
        self.warm_error: str | None = None
        self.cadquery_version: str | None = None
        self.lock = asyncio.Lock()


def default_warmup(state: ServiceState) -> None:
    """Import CadQuery (slow on a cold container) and build + export one transition to warm OCC."""
    t0 = time.perf_counter()
    import cadquery

    from .model import build_transition
    from .step_export import export_step

    export_step(build_transition(transition_geometry(WARM_VECTOR)).shape, "WARMUP")
    state.cadquery_version = getattr(cadquery, "__version__", "unknown")
    log.info("CadQuery %s warm in %.1f s", state.cadquery_version, time.perf_counter() - t0)


@dataclass(frozen=True)
class PackageKind:
    """One builder route: its request model and, for STEP kinds, the geometry port and the CadQuery
    builder name (an attribute of app.model, imported lazily: CadQuery loads in the warm-up)."""

    request_model: Any
    geometry: Callable[[dict[str, Any]], Any] | None = None
    builder: str | None = None

    @property
    def has_step(self) -> bool:
        return self.builder is not None


PACKAGE_KINDS: dict[str, PackageKind] = {
    "transition": PackageKind(TransitionPackageRequest, transition_geometry, "build_transition"),
    "row-manifold": PackageKind(RowManifoldPackageRequest, manifold_geometry, "build_manifold"),
    "cdu-kit": PackageKind(CduKitPackageRequest),
    "strainer": PackageKind(StrainerPackageRequest),
    "hose": PackageKind(HosePackageRequest),
}


def generate(req: Any, geometry: Any, builder: str | None) -> dict[str, Any]:
    timings: dict[str, int] = {}
    solid = None
    step_bytes: bytes | None = None
    if builder is not None:
        from . import model
        from .step_export import export_step

        t = time.perf_counter()
        solid = getattr(model, builder)(geometry)
        timings["model"] = round((time.perf_counter() - t) * 1000)

        t = time.perf_counter()
        step_bytes = export_step(solid.shape, req.part_number)
        timings["step"] = round((time.perf_counter() - t) * 1000)

    pdf_bytes: bytes | None = None
    if pdf.pdf_available():
        t = time.perf_counter()
        pdf_bytes = pdf.svg_to_pdf(req.drawing_svg)
        timings["pdf"] = round((time.perf_counter() - t) * 1000)
    return {"solid": solid, "step": step_bytes, "pdf": pdf_bytes, "timings": timings}


def file_out(filename: str, content_type: str, data: bytes) -> dict[str, Any]:
    return {
        "filename": filename,
        "content_type": content_type,
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "base64": base64.b64encode(data).decode("ascii"),
    }


def _validation_message(exc: ValidationError) -> str:
    parts = []
    for e in exc.errors():
        loc = ".".join(str(x) for x in e.get("loc", ()))
        msg = e.get("msg", "invalid")
        parts.append(f"{loc}: {msg}" if loc else msg)
    return "; ".join(parts)[:2000]


def create_app(warmup: Callable[[ServiceState], None] | None = None) -> FastAPI:
    warmup_fn = warmup or default_warmup

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        auth.assert_configured()
        if not pdf.pdf_available():
            if auth.dev_mode():
                log.warning("PDF disabled (CAD_SERVICE_DEV=1): %s", pdf.pdf_unavailable_reason())
            else:
                raise auth.ConfigError(f"PDF renderer unavailable: {pdf.pdf_unavailable_reason()}")
        state: ServiceState = app.state.cad

        async def run_warmup() -> None:
            try:
                await asyncio.to_thread(warmup_fn, state)
                state.warm = True
            except Exception as exc:  # stays cold → /health 503 → Railway never routes here
                state.warm_error = f"{type(exc).__name__}: {exc}"
                log.exception("warm-up failed")

        task = asyncio.create_task(run_warmup())
        try:
            yield
        finally:
            task.cancel()

    app = FastAPI(title="Cardinal CAD service", version=GENERATOR_VERSION, lifespan=lifespan,
                  docs_url=None, redoc_url=None, openapi_url=None)
    app.state.cad = ServiceState()

    @app.exception_handler(StarletteHTTPException)
    async def http_exc(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = {404: "not_found", 405: "method_not_allowed"}.get(exc.status_code, "http_error")
        return error(exc.status_code, code, str(exc.detail))

    @app.get("/health")
    async def health() -> JSONResponse:
        state: ServiceState = app.state.cad
        body = {
            "ok": state.warm,
            "generator_version": GENERATOR_VERSION,
            "tables_hash": tables.TABLES_HASH,
            "cadquery": state.cadquery_version,
            "warm": state.warm,
            "pdf": pdf.pdf_available(),
            "kinds": {k: ("step+pdf" if v.has_step else "pdf") for k, v in PACKAGE_KINDS.items()},
        }
        if state.warm_error:
            body["error"] = state.warm_error
        return JSONResponse(status_code=200 if state.warm else 503, content=body)

    async def handle_package(request: Request, kind: str) -> JSONResponse:
        spec = PACKAGE_KINDS[kind]
        if not auth.authorized(request.headers.get("authorization")):
            return error(401, "unauthorized", "Missing or invalid bearer token.")
        state: ServiceState = app.state.cad
        if not state.warm:
            return error(503, "warming_up", "The CAD service is still starting. Retry shortly.")

        declared = request.headers.get("content-length")
        if declared and declared.isdigit() and int(declared) > MAX_REQUEST_BYTES:
            return error(413, "svg_too_large", "Request body exceeds the 2 MB drawing limit.")
        raw = await request.body()
        if len(raw) > MAX_REQUEST_BYTES:
            return error(413, "svg_too_large", "Request body exceeds the 2 MB drawing limit.")
        try:
            payload = json.loads(raw)
        except (ValueError, UnicodeDecodeError):
            return error(400, "invalid_config", "Body is not valid JSON.")
        try:
            req = spec.request_model.model_validate(payload)
        except ValidationError as exc:
            return error(400, "invalid_config", _validation_message(exc))

        if len(req.drawing_svg.encode("utf-8")) > MAX_SVG_BYTES:
            return error(413, "svg_too_large", "drawing_svg exceeds 2 MB.")
        if req.tables_hash != tables.TABLES_HASH:
            return error(
                409, "tables_mismatch",
                f"Backend tables {req.tables_hash} != CAD service tables {tables.TABLES_HASH}. "
                "Deploy both from the same commit.",
            )

        geometry = None
        if spec.geometry is not None:
            geometry = spec.geometry(req.config.model_dump())
            problems = compare_expected(req.expected, geometry)
            if problems:
                log.warning("geometry_mismatch %s (%s): %s", req.part_number, kind, problems)
                return error(422, "geometry_mismatch", "Geometry differs from the CAD service: " + "; ".join(problems))

        try:
            async with state.lock:  # OpenCascade is not reliably thread-safe: one generation at a time
                out = await run_in_threadpool(generate, req, geometry, spec.builder)
        except Exception as exc:
            if type(exc).__name__ == "ParseError":  # malformed SVG XML
                return error(400, "invalid_config", f"drawing_svg is not valid SVG: {exc}")
            log.exception("generation failed for %s (%s)", req.part_number, kind)
            return error(500, "generation_failed", f"{type(exc).__name__}: {exc}"[:1000])

        solid = out["solid"]
        body = {
            "part_number": req.part_number,
            "generator_version": GENERATOR_VERSION,
            "tables_hash": tables.TABLES_HASH,
            "step": file_out(f"{req.part_number}.step", "model/step", out["step"]) if out["step"] is not None else None,
            "pdf": file_out(f"{req.part_number}.pdf", "application/pdf", out["pdf"]) if out["pdf"] is not None else None,
            "solid": None if solid is None else {
                "valid": solid.valid,
                "volume_in3": round(solid.volume_in3, 6),
                "bbox_in": [round(x, 6) for x in solid.bbox_in],
            },
            "timings_ms": out["timings"],
        }
        log.info("generated %s (%s) step=%s pdf=%s timings=%s", req.part_number, kind,
                 f"{len(out['step'])}B" if out["step"] is not None else "none",
                 f"{len(out['pdf'])}B" if out["pdf"] is not None else "skipped", out["timings"])
        return JSONResponse(status_code=200, content=body)

    def route(kind: str):
        async def endpoint(request: Request) -> JSONResponse:
            return await handle_package(request, kind)

        endpoint.__name__ = f"package_{kind.replace('-', '_')}"
        return endpoint

    for kind in PACKAGE_KINDS:
        app.add_api_route(f"/v1/packages/{kind}", route(kind), methods=["POST"])

    return app


app = create_app()
