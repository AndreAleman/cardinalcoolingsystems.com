// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Public API of the shared Engineering View drawing (Cardinal Builder).
// Kept out of ../index so the non-React core never pulls in JSX. React 18 (backend and storefront).

/** Bump on any visible drawing change (it is part of the CAD Package cache key) and rewrite the goldens. */
export const DRAWING_VERSION = 2

export { BuilderSheet, BUILDER_SHEETS, type BuilderSheetProps } from "./builder-sheet"
export {
  AxialPartView,
  HoseSheet,
  StrainerSheet,
  TransitionSheet,
  hoseAxialInput,
  strainerAxialInput,
  transitionAxialInput,
  type HoseSheetProps,
  type StrainerSheetProps,
  type TransitionSheetProps,
} from "./axial-sheets"
export { ManifoldSheet, type ManifoldSheetProps } from "./manifold-sheet"
export { KitSheet, type KitSheetProps } from "./kit-sheet"
export { SheetChrome, type SheetChromeProps, type SheetProps, type SheetTitleBlock } from "./sheet-chrome"
export { COMPANY, BRAND, INK, type PricingModeTag } from "./title-block"
export { SHEET, TITLE_BLOCK, STRIP_H, fitFontSize, wrapText, type EndOutline } from "./layout"
export { AXIAL_BREAK_RATIO, axialDisplay, layoutAxial, type AxialDisplay, type AxialLayout, type AxialPartInput } from "./axial-layout"
export { MANIFOLD_BREAK_DROPS, layoutManifold, manifoldDisplay, type ManifoldDisplay, type ManifoldLayout } from "./manifold-layout"
export type { Box, DimGraphic, DimText } from "./dimension-layout"
