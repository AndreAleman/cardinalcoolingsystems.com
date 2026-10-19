// Renders the shared Engineering View sheet to the SVG that cad-service converts to the CAD Package
// PDF. Same component as the on-page drawing (BuilderSheet picks the builder's sheet); the logo is
// resolved by cad-service against its own assets folder (cpq_shared/assets/cardinal-logo.svg).

import { renderToStaticMarkup } from "react-dom/server"
import type { BuilderType, Options } from "../cpq-shared"
import { BuilderSheet } from "../cpq-shared/drawing"

export const CAD_LOGO_HREF = "cardinal-logo.svg"

export function renderDrawingSvg(
  builderType: BuilderType,
  options: Options,
  partNumber: string,
  drawnDate: string,
  description?: string,
): string {
  return renderToStaticMarkup(
    <BuilderSheet
      builderType={builderType}
      options={options}
      partNumber={partNumber}
      description={description}
      drawnDate={drawnDate}
      logoHref={CAD_LOGO_HREF}
      print
    />,
  )
}
