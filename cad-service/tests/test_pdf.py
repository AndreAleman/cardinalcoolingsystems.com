"""SVG -> PDF. The conversion tests need libcairo (marked `pdf`, skipped without it)."""

import io
import re
from pathlib import Path

import pytest

from app import pdf, tables

from .conftest import SHEET_GOLDENS

SHEETS = [pytest.param(path, pn, id=name) for name, (path, pn) in SHEET_GOLDENS.items()]


@pytest.mark.pdf
@pytest.mark.parametrize("svg_path, part_number", SHEETS)
def test_sheet_golden_to_one_page_ansi_b_pdf(svg_path: Path, part_number: str):
    from pypdf import PdfReader

    data = pdf.svg_to_pdf(svg_path.read_text("utf-8"))
    assert data.startswith(b"%PDF")
    reader = PdfReader(io.BytesIO(data))
    assert len(reader.pages) == 1
    box = reader.pages[0].mediabox
    assert float(box.width) == pytest.approx(1224, abs=0.5)  # 17 in
    assert float(box.height) == pytest.approx(792, abs=0.5)  # 11 in
    assert part_number in reader.pages[0].extract_text().replace("\n", "")


@pytest.mark.pdf
def test_external_image_is_not_fetched(tmp_path: Path):
    secret = tmp_path / "secret.svg"
    secret.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>SECRETXYZ</text></svg>')
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="2in" height="1in" viewBox="0 0 200 100">'
        f'<image href="{secret.as_uri()}" x="0" y="0" width="100" height="100"/></svg>'
    )
    from pypdf import PdfReader

    out = pdf.svg_to_pdf(svg)
    assert "SECRETXYZ" not in PdfReader(io.BytesIO(out)).pages[0].extract_text()


@pytest.mark.pdf
def test_entities_rejected():
    svg = (
        '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "boom">]>'
        '<svg xmlns="http://www.w3.org/2000/svg" width="1in" height="1in"><text>&x;</text></svg>'
    )
    with pytest.raises(Exception):
        pdf.svg_to_pdf(svg)


# --- fetcher rules (no cairo needed) ---------------------------------------------------------------

def test_fetcher_serves_assets_only(tmp_path: Path):
    logo = tables.ASSETS_DIR / tables.LOGO_FILE
    assert pdf.asset_url_fetcher(logo.resolve().as_uri(), "image/svg+xml") == logo.read_bytes()
    outside = tmp_path / "x.svg"
    outside.write_text("<svg/>")
    assert pdf.asset_url_fetcher(outside.as_uri(), "image/*") == pdf.EMPTY_SVG
    traversal = (tables.ASSETS_DIR / ".." / "MANIFEST.json").as_uri()
    assert pdf.asset_url_fetcher(traversal, "image/*") == pdf.EMPTY_SVG
    assert pdf.asset_url_fetcher("http://169.254.169.254/latest", "image/*") == pdf.EMPTY_SVG
    assert pdf.asset_url_fetcher("file:///etc/passwd", "image/*") == pdf.EMPTY_SVG


def test_unavailable_reason_is_explicit():
    if pdf.pdf_available():
        assert pdf.pdf_unavailable_reason() == "ok"
    else:
        assert "cairo" in pdf.pdf_unavailable_reason()
        with pytest.raises(pdf.PdfUnavailable):
            pdf.svg_to_pdf("<svg/>")


@pytest.mark.pdf
@pytest.mark.parametrize("svg_path, part_number", SHEETS)
def test_sheet_logo_renders_and_is_not_a_black_box(svg_path: Path, part_number: str):
    """CairoSVG ignores masks; the Cardinal logo must render as ink on white at its slot."""
    from cairosvg.surface import PNGSurface
    from PIL import Image

    svg = svg_path.read_text("utf-8")
    assert "<mask" not in svg and "mask=" not in svg
    m = re.search(r'<image[^>]*\bhref="([^"]+)"[^>]*\bx="([\d.]+)"[^>]*\by="([\d.]+)"[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"', svg)
    assert m, "no <image> (logo) in the sheet"
    assert m.group(1) == tables.LOGO_FILE
    x, y, w, h = (float(g) for g in m.groups()[1:])
    png = PNGSurface.convert(
        bytestring=svg.encode("utf-8"),
        url=tables.ASSETS_DIR.resolve().as_uri() + "/",
        unsafe=False,
        url_fetcher=pdf.asset_url_fetcher,
        output_width=1000,
        output_height=640,
        background_color="white",
    )
    logo = Image.open(io.BytesIO(png)).convert("L").crop((round(x), round(y), round(x + w), round(y + h)))
    px = list(logo.tobytes())
    assert sum(p < 60 for p in px) / len(px) < 0.25  # not a solid black box
    assert sum(p < 230 for p in px) / len(px) > 0.03  # but the logo is drawn
