"""STEP export (Sanitube plan D4, ported): built in inches, scaled x25.4 to millimetres, AP214, one solid.

Product name = Part Number. FILE_DESCRIPTION = "Cardinal Cooling Systems reference model. Not a certified drawing."
The OCCT writer is configured through Interface_Static (process-global), so callers must hold the
generation lock (app.main) around export_step.
"""

from __future__ import annotations

import os
import tempfile

import cadquery as cq
from OCP.APIHeaderSection import APIHeaderSection_MakeHeader
from OCP.IFSelect import IFSelect_RetDone
from OCP.Interface import Interface_Static
from OCP.STEPControl import STEPControl_AsIs, STEPControl_Writer
from OCP.TCollection import TCollection_HAsciiString

MM_PER_IN = 25.4
STEP_DESCRIPTION = "Cardinal Cooling Systems reference model. Not a certified drawing."
ORGANIZATION = "Cardinal Cooling Systems"


def to_mm(shape: cq.Shape) -> cq.Shape:
    return shape.scale(MM_PER_IN)


def export_step(shape_in: cq.Shape, part_number: str) -> bytes:
    shape_mm = to_mm(shape_in)

    writer = STEPControl_Writer()
    # Set after constructing the writer (its controller init can reset statics).
    Interface_Static.SetCVal_s("write.step.schema", "AP214IS")
    Interface_Static.SetCVal_s("write.step.unit", "MM")
    status = writer.Transfer(shape_mm.wrapped, STEPControl_AsIs)
    if status != IFSelect_RetDone:
        raise RuntimeError(f"STEP transfer failed (status {status})")

    # OCCT names the product "<name> 1"; set PRODUCT(id, name) to exactly the Part Number.
    model = writer.Model()
    pn = TCollection_HAsciiString(part_number)
    named = 0
    for i in range(1, model.NbEntities() + 1):
        ent = model.Value(i)
        if ent.DynamicType().Name() == "StepBasic_Product":
            ent.SetId(pn)
            ent.SetName(pn)
            named += 1
    if named != 1:
        raise RuntimeError(f"expected one STEP PRODUCT entity, found {named}")

    header = APIHeaderSection_MakeHeader(writer.Model())
    header.SetName(TCollection_HAsciiString(f"{part_number}.step"))
    header.SetDescriptionValue(1, TCollection_HAsciiString(STEP_DESCRIPTION))
    header.SetAuthorValue(1, TCollection_HAsciiString(ORGANIZATION))
    header.SetOrganizationValue(1, TCollection_HAsciiString(ORGANIZATION))
    header.SetOriginatingSystem(TCollection_HAsciiString("Cardinal Cooling Systems cad-service (CadQuery/OpenCascade)"))

    fd, path = tempfile.mkstemp(suffix=".step")
    os.close(fd)
    try:
        if writer.Write(path) != IFSelect_RetDone:
            raise RuntimeError("STEP write failed")
        with open(path, "rb") as fh:
            return fh.read()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
