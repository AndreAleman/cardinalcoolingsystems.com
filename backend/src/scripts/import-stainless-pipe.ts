// Adds SaniTube's stainless schedule PIPE as one Quote-Only product:
//
//   "Stainless Steel Pipe A312 Welded" (handle stainless-steel-pipe-a312-welded)
//   Options: Finish (Mill finish / Polished OD) x Alloy (T304 / T316)
//            x Schedule (Sch 5S / 10S / 40S / 80S) x Size (NPS)
//
// Source: SaniTube's QuickBooks item list (inventory.csv, 2026). SKUs are the
// QuickBooks item names verbatim so the QuickBooks inventory sync matches them:
//   - Mill finish  = PIPE41 / PIPE44 / PIPE45 (304 Sch 10 / 40 / 5)
//                    PIPE61 / PIPE64 / PIPE65 (316 Sch 10 / 40 / 5)
//   - Polished OD  = A312P1 / A312P4 / A312P5 / A312P8 (Sch 10 / 40 / 5 / 80;
//                    -4xxx = 304, -6xxx = 316)
// The QuickBooks description is kept in each variant's metadata.qb_description.
// OD and wall are ASME B36.19 for the NPS + schedule (metadata od_in / wall_in).
// Left out on purpose (see the PR): seamless pipe (A312S*, SP*), duplicates and
// mislabeled items (PIPE44-005, PIPE44-250, PIPE64-800, A312P5-4800,
// A12P1-4800, 312P4-6400, A312P-6300, A312P4-200, A312P4-1200, A312P8-100,
// A312P1-61200, A312P1-1400/1800), and the A3121/A3124 mill-finish duplicates.
//
// QUOTE ONLY: every variant gets a $0 price (the store's "priced per order"
// placeholder, same as the polished tube) and the product carries
// metadata.requires_quote = true, so the storefront shows "Quote only" and the
// add-to-cart server action refuses it. No weights: pipe is quoted per foot.
//
// Placement (categories, collection, type, sales channels, shipping profile)
// is copied at run time from the polished tube product so pipe sits next to it.
//
// Idempotent: skipped if the handle exists or any SKU is already on another
// product; an existing inventory item with the same SKU is linked, not duplicated.
//
// Dry run (default):  npx medusa exec ./src/scripts/import-stainless-pipe.ts
// Write:              npx medusa exec ./src/scripts/import-stainless-pipe.ts apply
// Optional env:
//   PIPE_STATUS=draft        create as draft instead of published
//   PIPE_IMAGE_URL=https://… product image (SaniTube has no pipe photo yet)
//   MANAGE_INVENTORY=false   do not create/link inventory items

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

const HANDLE = "stainless-steel-pipe-a312-welded"
const TITLE = "Stainless Steel Pipe A312 Welded"
const TEMPLATE_HANDLES = ["id-od-pol-tube-a270-3a-import"]
const OPTION_TITLES = ["Finish", "Alloy", "Schedule", "Size (NPS)"] as const

const DESCRIPTION = "Stainless steel schedule pipe, ASTM A312 welded, in Type 304 and Type 316. NPS 1/4\" to 14\" in Schedule 5S, 10S, 40S and 80S, mill finish or OD polished, for liquid cooling loops, CDU and facility water piping, and process lines.\n\nPipe is sized by nominal pipe size and schedule (ASME B36.19), unlike sanitary tube, which is sized by its actual OD. Choose finish, alloy, schedule and size to see the part number.\n\nPipe is quoted per foot: request a quote with your sizes and footage and get pricing within 48 hours. Quotes are held for 90 days, there are no minimums, and stock ships from our Florida, Kansas City and Los Angeles warehouses. Look up mill test reports at https://sanitube.us/mtr-generator."

const META_DESCRIPTION = "ASTM A312 welded stainless pipe in 304 and 316, NPS 1/4\" to 14\", Sch 5S to 80S, mill or OD polished. Quote only: pricing within 48 hours, no minimums."

// [sku, finish, alloy, schedule, size (NPS), QuickBooks description, OD in, wall in]
type Row = [string, string, string, string, string, string, number, number]

// 110 variants
const ROWS: Row[] = [
  ["PIPE45-150", "Mill finish", "T304", "Sch 5S", "1-1/2\"", "1 1/2\" Sch 5 304 Welded Pipe", 1.9, 0.065],
  ["PIPE45-200", "Mill finish", "T304", "Sch 5S", "2\"", "2\" Sch 5 304L Welded Pipe", 2.375, 0.065],
  ["PIPE45-400", "Mill finish", "T304", "Sch 5S", "4\"", "4\" Sch-5S T304L Welded Pipe", 4.5, 0.083],
  ["PIPE41-005", "Mill finish", "T304", "Sch 10S", "1/2\"", "1/2\" Sch 10 304 Welded Pipe", 0.84, 0.083],
  ["PIPE41-075", "Mill finish", "T304", "Sch 10S", "3/4\"", "3/4\" Sch 10 304/L Welded Pipe", 1.05, 0.083],
  ["PIPE41-100", "Mill finish", "T304", "Sch 10S", "1\"", "1\" Sch 10 304/L Welded Pipe", 1.315, 0.109],
  ["PIPE41-125", "Mill finish", "T304", "Sch 10S", "1-1/4\"", "1 1/4\" Sch 10 304/L Welded Pipe", 1.66, 0.109],
  ["PIPE41-150", "Mill finish", "T304", "Sch 10S", "1-1/2\"", "1 1/2\" Sch 10 304/L Welded Pipe", 1.9, 0.109],
  ["PIPE41-200", "Mill finish", "T304", "Sch 10S", "2\"", "2\" Sch 10 304/L Welded Pipe A312", 2.375, 0.109],
  ["PIPE41-250", "Mill finish", "T304", "Sch 10S", "2-1/2\"", "2 1/2\" Sch 10 304/L Welded Pipe", 2.875, 0.12],
  ["PIPE41-300", "Mill finish", "T304", "Sch 10S", "3\"", "3\" Sch 10 304/L Welded Pipe", 3.5, 0.12],
  ["PIPE41-400", "Mill finish", "T304", "Sch 10S", "4\"", "4\" Sch 10 304/L Welded Pipe", 4.5, 0.12],
  ["PIPE41-600", "Mill finish", "T304", "Sch 10S", "6\"", "6\" Sch 10s 304/304L Welded Pipe", 6.625, 0.134],
  ["PIPE41-800", "Mill finish", "T304", "Sch 10S", "8\"", "8\" Sch 10 304/L Welded Pipe", 8.625, 0.148],
  ["PIPE41-1000", "Mill finish", "T304", "Sch 10S", "10\"", "10\" Sch 10 304/L Welded Pipe", 10.75, 0.165],
  ["PIPE41-1200", "Mill finish", "T304", "Sch 10S", "12\"", "12\" Sch 10 304/L Welded Pipe", 12.75, 0.18],
  ["PIPE41-1400", "Mill finish", "T304", "Sch 10S", "14\"", "14\" Sch 10 304/L Welded Pipe", 14.0, 0.188],
  ["PIPE44-050", "Mill finish", "T304", "Sch 40S", "1/2\"", "1/2\" Sch 40 304/L Welded Pipe", 0.84, 0.109],
  ["PIPE44-075", "Mill finish", "T304", "Sch 40S", "3/4\"", "3/4\" Sch 40 304/L Welded Pipe", 1.05, 0.113],
  ["PIPE44-100", "Mill finish", "T304", "Sch 40S", "1\"", "1\" Sch 40 304/L Welded Pipe", 1.315, 0.133],
  ["PIPE44-125", "Mill finish", "T304", "Sch 40S", "1-1/4\"", "1 1/4\" Sch 40 304 Welded Pipe", 1.66, 0.14],
  ["PIPE44-150", "Mill finish", "T304", "Sch 40S", "1-1/2\"", "1 1/2\" Sch 40 304 Welded Pipe", 1.9, 0.145],
  ["PIPE44-200", "Mill finish", "T304", "Sch 40S", "2\"", "2\" Sch 40 304/304L Welded Pipe", 2.375, 0.154],
  ["PIPE44-300", "Mill finish", "T304", "Sch 40S", "3\"", "3\"  Sch 40 304/304L Welded Pipe", 3.5, 0.216],
  ["PIPE65-400", "Mill finish", "T316", "Sch 5S", "4\"", "4\" Sch 5 316/L Welded Pipe", 4.5, 0.083],
  ["PIPE61-100", "Mill finish", "T316", "Sch 10S", "1\"", "1\" Sch 10s 316/L Welded Pipe", 1.315, 0.109],
  ["PIPE61-150", "Mill finish", "T316", "Sch 10S", "1-1/2\"", "1-1/2\" Sch 10s  TP316/316L Welded Pipe", 1.9, 0.109],
  ["PIPE61-200", "Mill finish", "T316", "Sch 10S", "2\"", "2\" Sch 10s  TP 316/316L Welded Pipe", 2.375, 0.109],
  ["PIPE61-300", "Mill finish", "T316", "Sch 10S", "3\"", "3\" Sch 10s  TP 316/316L Welded Pipe", 3.5, 0.12],
  ["PIPE61-400", "Mill finish", "T316", "Sch 10S", "4\"", "4\" Sch 10s  TP 316/316L Welded Pipe", 4.5, 0.12],
  ["PIPE61-600", "Mill finish", "T316", "Sch 10S", "6\"", "6\" Sch 10s 316/L Welded Pipe", 6.625, 0.134],
  ["PIPE61-800", "Mill finish", "T316", "Sch 10S", "8\"", "8\" Sch 10s  TP 316/316L Welded Pipe", 8.625, 0.148],
  ["PIPE61-1200", "Mill finish", "T316", "Sch 10S", "12\"", "12\" Sch 10s 316/L Welded Pipe", 12.75, 0.18],
  ["PIPE64-025", "Mill finish", "T316", "Sch 40S", "1/4\"", "1/4\" Sch 40s TP 316/316L Welded Pipe", 0.54, 0.088],
  ["PIPE64-050", "Mill finish", "T316", "Sch 40S", "1/2\"", "1/2\" Sch 40s TP 316/316L Welded Pipe", 0.84, 0.109],
  ["PIPE64-075", "Mill finish", "T316", "Sch 40S", "3/4\"", "3/4\" Sch 40s TP 316/316L Welded Pipe", 1.05, 0.113],
  ["PIPE64-100", "Mill finish", "T316", "Sch 40S", "1\"", "1\" Sch 40s TP 316/316L Welded Pipe", 1.315, 0.133],
  ["PIPE64-150", "Mill finish", "T316", "Sch 40S", "1-1/2\"", "1 1/2\" Sch 40s TP 316/316L Welded Pipe", 1.9, 0.145],
  ["PIPE64-200", "Mill finish", "T316", "Sch 40S", "2\"", "2\" Sch 40s TP 316/316L Welded Pipe", 2.375, 0.154],
  ["PIPE64-300", "Mill finish", "T316", "Sch 40S", "3\"", "3\" Sch 40s TP 316/316L Welded Pipe", 3.5, 0.216],
  ["PIPE64-400", "Mill finish", "T316", "Sch 40S", "4\"", "4\" Sch 40s TP 316/316L Welded Pipe", 4.5, 0.237],
  ["PIPE64-500", "Mill finish", "T316", "Sch 40S", "5\"", "5\" Sch 40s TP 316/316L Welded Pipe", 5.563, 0.258],
  ["PIPE64-1000", "Mill finish", "T316", "Sch 40S", "10\"", "10\"  Sch 40 316/316L Welded Pipe", 10.75, 0.365],
  ["PIPE64-1200", "Mill finish", "T316", "Sch 40S", "12\"", "12\"  Sch 40 316/316L Welded Pipe", 12.75, 0.375],
  ["A312P5-4200", "Polished OD", "T304", "Sch 5S", "2\"", "2\" Sch 5 304/L Welded Pipe Pol. OD Only", 2.375, 0.065],
  ["A312P5-4300", "Polished OD", "T304", "Sch 5S", "3\"", "3\" Sch 5 304/L Welded Pipe Pol. OD Only", 3.5, 0.083],
  ["A312P1-4050", "Polished OD", "T304", "Sch 10S", "1/2\"", "1/2\" Sch 10 304/L Welded Pipe Pol. OD Only", 0.84, 0.083],
  ["A312P1-4075", "Polished OD", "T304", "Sch 10S", "3/4\"", "3/4\" Sch 10 304/L Welded Pipe Pol. OD Only", 1.05, 0.083],
  ["A312P1-4100", "Polished OD", "T304", "Sch 10S", "1\"", "1\" Sch 10 304/L Welded Pipe Pol. OD Only", 1.315, 0.109],
  ["A312P1-4125", "Polished OD", "T304", "Sch 10S", "1-1/4\"", "1-1/4\"  Sch 10 304/L Welded Pipe Pol. OD Only", 1.66, 0.109],
  ["A312P1-4150", "Polished OD", "T304", "Sch 10S", "1-1/2\"", "1-1/2\" Sch 10 304/L Welded Pipe Pol. OD Only", 1.9, 0.109],
  ["A312P1-4200", "Polished OD", "T304", "Sch 10S", "2\"", "2\" Sch 10 304/L Welded Pipe Pol. OD Only", 2.375, 0.109],
  ["A312P1-4250", "Polished OD", "T304", "Sch 10S", "2-1/2\"", "2-1/2\" Sch 10 304/L Welded Pipe Pol. OD Only", 2.875, 0.12],
  ["A312P1-4300", "Polished OD", "T304", "Sch 10S", "3\"", "3\" Sch 10 304/L Welded Pipe Pol. OD Only", 3.5, 0.12],
  ["A312P1-4400", "Polished OD", "T304", "Sch 10S", "4\"", "4\" Sch 10 304/L Welded Pipe Pol. OD Only", 4.5, 0.12],
  ["A312P1-4500", "Polished OD", "T304", "Sch 10S", "5\"", "5\" Sch 10 304/L Welded Pipe Pol. OD Only", 5.563, 0.134],
  ["A312P1-4600", "Polished OD", "T304", "Sch 10S", "6\"", "6\" Sch 10 304/L Welded Pipe Pol. OD Only", 6.625, 0.134],
  ["A312P1-4800", "Polished OD", "T304", "Sch 10S", "8\"", "8\" Sch 10 304/L Welded Pipe Pol. OD Only", 8.625, 0.148],
  ["A312P1-41000", "Polished OD", "T304", "Sch 10S", "10\"", "10\" Sch 10 304/L Welded Pipe Pol. OD Only", 10.75, 0.165],
  ["A312P1-41200", "Polished OD", "T304", "Sch 10S", "12\"", "12\" Sch 10 304/L Welded Pipe Pol. OD Only", 12.75, 0.18],
  ["A312P4-40375", "Polished OD", "T304", "Sch 40S", "3/8\"", "3/8\"  Sch 40 304/L Welded Pipe Pol OD Only", 0.675, 0.091],
  ["A312P4-4050", "Polished OD", "T304", "Sch 40S", "1/2\"", "1/2\"  Sch 40 304/L Welded Pipe Pol. OD Only", 0.84, 0.109],
  ["A312P4-4075", "Polished OD", "T304", "Sch 40S", "3/4\"", "3/4\"  Sch 40 304/L Welded Pipe Pol. OD Only", 1.05, 0.113],
  ["A312P4-4100", "Polished OD", "T304", "Sch 40S", "1\"", "1\"  Sch 40 304/L Welded Pipe Pol. OD Only", 1.315, 0.133],
  ["A312P4-4125", "Polished OD", "T304", "Sch 40S", "1-1/4\"", "1-1/4\"  Sch 40 304/L Welded Pipe Pol OD Only", 1.66, 0.14],
  ["A312P4-4150", "Polished OD", "T304", "Sch 40S", "1-1/2\"", "1-1/2\"  Sch 40 304/L Welded Pipe Pol OD Only", 1.9, 0.145],
  ["A312P4-4200", "Polished OD", "T304", "Sch 40S", "2\"", "2\" Sch 40 304/L Welded Pipe Pol. OD Only", 2.375, 0.154],
  ["A312P4-4250", "Polished OD", "T304", "Sch 40S", "2-1/2\"", "2-1/2\" Sch 40 304/L Welded Pipe Pol. OD Only", 2.875, 0.203],
  ["A312P4-4300", "Polished OD", "T304", "Sch 40S", "3\"", "3\" Sch 40 304/L Welded Pipe Pol. OD Only", 3.5, 0.216],
  ["A312P4-4400", "Polished OD", "T304", "Sch 40S", "4\"", "4\" Sch 40 304/L Welded Pipe Pol. OD Only", 4.5, 0.237],
  ["A312P4-4500", "Polished OD", "T304", "Sch 40S", "5\"", "5\" Sch 40 304/L Welded Pipe Pol. OD Only", 5.563, 0.258],
  ["A312P4-4600", "Polished OD", "T304", "Sch 40S", "6\"", "6\" Sch 40 304/L Welded Pipe Pol. OD Only", 6.625, 0.28],
  ["A312P4-4800", "Polished OD", "T304", "Sch 40S", "8\"", "8\" Sch 40 304/L Welded Pipe Pol. OD Only", 8.625, 0.322],
  ["A312P4-41000", "Polished OD", "T304", "Sch 40S", "10\"", "10\" Sch 40 304/L Welded Pipe Pol. OD Only", 10.75, 0.365],
  ["A312P8-4050", "Polished OD", "T304", "Sch 80S", "1/2\"", "1/2\"  Sch 80 304/L Welded Pipe Pol. OD Only", 0.84, 0.147],
  ["A312P8-4150", "Polished OD", "T304", "Sch 80S", "1-1/2\"", "1-1/2\" Sch 80 304/L Welded Pipe Pol. OD Only", 1.9, 0.2],
  ["A312P8-4200", "Polished OD", "T304", "Sch 80S", "2\"", "2\" Sch 80 304/L Welded Pipe Pol. OD Only", 2.375, 0.218],
  ["A312P8-4300", "Polished OD", "T304", "Sch 80S", "3\"", "3\" Sch 80 304/L Welded Pipe Pol. OD Only", 3.5, 0.3],
  ["A312P8-4400", "Polished OD", "T304", "Sch 80S", "4\"", "4\" Sch 80 304/L Welded Pipe Pol. OD Only", 4.5, 0.337],
  ["A312P8-4600", "Polished OD", "T304", "Sch 80S", "6\"", "6\" Sch 80 304/L Welded Pipe Pol. OD Only", 6.625, 0.432],
  ["A312P5-6150", "Polished OD", "T316", "Sch 5S", "1-1/2\"", "1 1/2\" Sch 5 316/L Welded Pipe Pol. OD Only", 1.9, 0.065],
  ["A312P5-6200", "Polished OD", "T316", "Sch 5S", "2\"", "2\" Sch 5 316/L Welded Pipe Pol. OD Only", 2.375, 0.065],
  ["A312P5-6400", "Polished OD", "T316", "Sch 5S", "4\"", "4\" Sch 5 316/L Welded Pipe Pol. OD Only", 4.5, 0.083],
  ["A312P5-6600", "Polished OD", "T316", "Sch 5S", "6\"", "6\" Sch 5 316/L Welded Pipe Pol. OD Only", 6.625, 0.109],
  ["A312P5-6800", "Polished OD", "T316", "Sch 5S", "8\"", "8\" Sch 5 316/L Welded Pipe Pol. OD Only", 8.625, 0.109],
  ["A312P1-6050", "Polished OD", "T316", "Sch 10S", "1/2\"", "1/2\" Sch 10 316/L Welded Pipe Pol. Od Only", 0.84, 0.083],
  ["A312P1-6075", "Polished OD", "T316", "Sch 10S", "3/4\"", "3/4\" Sch 10 316/L Welded Pipe Pol. Od Only", 1.05, 0.083],
  ["A312P1-6100", "Polished OD", "T316", "Sch 10S", "1\"", "1\" Sch 10 316/L Welded Pipe Pol. Od Only", 1.315, 0.109],
  ["A312P1-6125", "Polished OD", "T316", "Sch 10S", "1-1/4\"", "1-1/4\"  Sch 10 316/L Welded Pipe Pol. Od Only", 1.66, 0.109],
  ["A312P1-6150", "Polished OD", "T316", "Sch 10S", "1-1/2\"", "1-1/2\"  Sch 10 316/L Welded Pipe Pol. Od Only", 1.9, 0.109],
  ["A312P1-6200", "Polished OD", "T316", "Sch 10S", "2\"", "2\" Sch 10 316/L Welded Pipe Pol. Od Only", 2.375, 0.109],
  ["A312P1-6300", "Polished OD", "T316", "Sch 10S", "3\"", "3\" Sch 10 316/L Welded Pipe Pol. Od Only", 3.5, 0.12],
  ["A312P1-6400", "Polished OD", "T316", "Sch 10S", "4\"", "4\"  Sch 10 316/L Welded Pipe Pol. OD Only", 4.5, 0.12],
  ["A312P1-6500", "Polished OD", "T316", "Sch 10S", "5\"", "5\"  Sch 10 316/L Welded Pipe Pol. OD Only", 5.563, 0.134],
  ["A312P1-6600", "Polished OD", "T316", "Sch 10S", "6\"", "6\" Sch 10 316/L Welded Pipe Pol. OD Only", 6.625, 0.134],
  ["A312P1-6800", "Polished OD", "T316", "Sch 10S", "8\"", "8\" Sch 10 316/L Welded Pipe Pol. OD Only", 8.625, 0.148],
  ["A312P4-6050", "Polished OD", "T316", "Sch 40S", "1/2\"", "1/2\"  Sch 40 316/L Welded Pipe Pol. OD Only", 0.84, 0.109],
  ["A312P4-6075", "Polished OD", "T316", "Sch 40S", "3/4\"", "3/4\"  Sch 40 316/L Welded Pipe Pol. OD Only", 1.05, 0.113],
  ["A312P4-6100", "Polished OD", "T316", "Sch 40S", "1\"", "1\" Sch 40 316/L Welded Pipe Pol. OD only", 1.315, 0.133],
  ["A312P4-6125", "Polished OD", "T316", "Sch 40S", "1-1/4\"", "1-1/4\"  Sch 40 316/L Welded Pipe Pol. OD Only", 1.66, 0.14],
  ["A312P4-6150", "Polished OD", "T316", "Sch 40S", "1-1/2\"", "1-1/2\"  Sch 40 316/L Welded Pipe Pol. OD Only", 1.9, 0.145],
  ["A312P4-6200", "Polished OD", "T316", "Sch 40S", "2\"", "2\"  Sch 40 316/L Welded Pipe Pol. OD Only", 2.375, 0.154],
  ["A312P4-6250", "Polished OD", "T316", "Sch 40S", "2-1/2\"", "2-1/2\" Sch 40 316/L Welded Pipe Pol. OD Only", 2.875, 0.203],
  ["A312P4-6300", "Polished OD", "T316", "Sch 40S", "3\"", "3\"  Sch 40 316/L Welded Pipe Pol. OD Only", 3.5, 0.216],
  ["A312P4-6400", "Polished OD", "T316", "Sch 40S", "4\"", "4\"  Sch 40 316/L Welded Pipe Pol. OD Only", 4.5, 0.237],
  ["A312P4-6600", "Polished OD", "T316", "Sch 40S", "6\"", "6\" Sch 40 316/L Welded Pipe Pol. OD Only", 6.625, 0.28],
  ["A312P4-6800", "Polished OD", "T316", "Sch 40S", "8\"", "8\"  Sch 40 316/L Welded Pipe Pol. OD Only", 8.625, 0.322],
  ["A312P8-6100", "Polished OD", "T316", "Sch 80S", "1\"", "1\" Sch 80 316/L A312 Pipe Pol. OD Only", 1.315, 0.179],
  ["A312P8-6150", "Polished OD", "T316", "Sch 80S", "1-1/2\"", "1-1/2\" Sch 80 316/L A312 Pipe Pol. OD Only", 1.9, 0.2],
  ["A312P8-6200", "Polished OD", "T316", "Sch 80S", "2\"", "2\" Sch 80 316/L A312 Welded Pipe Pol. OD Only", 2.375, 0.218],
]

export default async function importStainlessPipe({ container, args }: ExecArgs) {
  const apply = (args ?? []).includes("apply")
  const manageInventory = process.env.MANAGE_INVENTORY !== "false"
  const status = process.env.PIPE_STATUS === "draft" ? "draft" : "published"
  const image = process.env.PIPE_IMAGE_URL?.trim() || null
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  logger.info(
    `[pipe] mode=${apply ? "APPLY" : "DRY RUN"} status=${status} manage_inventory=${manageInventory} image=${image ?? "-"}`,
  )

  // Data sanity: unique SKUs and unique option combinations.
  const skus = ROWS.map((r) => r[0])
  if (new Set(skus).size !== skus.length) throw new Error("Duplicate SKU in ROWS — aborting")
  const combos = ROWS.map((r) => r.slice(1, 5).join("|"))
  if (new Set(combos).size !== combos.length) throw new Error("Duplicate option combination in ROWS — aborting")

  const [existing] = await productService.listProducts({ handle: HANDLE }, { take: 1 })
  if (existing) {
    logger.info(`[pipe] = ${HANDLE} already exists (${existing.id}), nothing to do`)
    return
  }

  const clashes = await productService.listProductVariants({ sku: skus }, { take: skus.length })
  if (clashes.length) {
    logger.warn(`[pipe] ! SKU(s) already on another product: ${clashes.map((v) => v.sku).join(", ")} — aborting`)
    return
  }

  // Placement template: the polished tube product.
  let template: any
  for (const handle of TEMPLATE_HANDLES) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "collection_id", "type_id", "categories.id", "categories.name",
        "sales_channels.id", "sales_channels.name", "shipping_profile.id", "shipping_profile.name"],
      filters: { handle },
    })
    if (data[0]) {
      template = data[0]
      break
    }
  }
  if (!template) throw new Error(`Template product (${TEMPLATE_HANDLES.join(", ")}) not found — aborting`)

  let shippingProfileId: string | undefined = template.shipping_profile?.id
  if (!shippingProfileId) {
    const [profile] = await fulfillmentService.listShippingProfiles({ type: "default" })
    shippingProfileId = profile?.id
  }
  if (!shippingProfileId) throw new Error("No shipping profile found — aborting")

  const categories = (template.categories ?? []).map((c: any) => ({ id: c.id }))
  const salesChannels = (template.sales_channels ?? []).map((s: any) => ({ id: s.id }))
  logger.info(
    `[pipe] template=${template.handle} categories=[${(template.categories ?? []).map((c: any) => c.name).join(", ")}] ` +
      `sales_channels=[${(template.sales_channels ?? []).map((s: any) => s.name).join(", ")}] ` +
      `shipping_profile=${shippingProfileId} collection=${template.collection_id ?? "-"}`,
  )
  if (!salesChannels.length) throw new Error("Template product has no sales channel — aborting")

  const existingItems = manageInventory
    ? await inventoryService.listInventoryItems({ sku: skus }, { take: skus.length })
    : []
  const itemBySku = new Map(existingItems.map((i) => [i.sku, i.id]))

  const variants = ROWS.map(([sku, finish, alloy, schedule, size, qbDescription, od, wall], rank) => {
    const options: Record<string, string> = {
      Finish: finish,
      Alloy: alloy,
      Schedule: schedule,
      "Size (NPS)": size,
    }
    return {
      title: `${finish}, ${alloy}, ${size} ${schedule}`,
      sku,
      options,
      prices: [{ currency_code: "usd", amount: 0 }],
      manage_inventory: manageInventory,
      allow_backorder: false,
      variant_rank: rank,
      metadata: {
        requires_quote: true,
        unit: "ft",
        qb_description: qbDescription,
        od_in: od,
        wall_in: wall,
      },
      ...(itemBySku.has(sku)
        ? { inventory_items: [{ inventory_item_id: itemBySku.get(sku)!, required_quantity: 1 }] }
        : {}),
    }
  })

  // Option values in a buyer-friendly order: sizes small to large, schedules thin to heavy.
  const nps = (s: string) => {
    const m = s.replace(/"/g, "").match(/^(?:(\d+)-)?(\d+)(?:\/(\d+))?$/)
    if (!m) return Number.POSITIVE_INFINITY
    return m[3] ? Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]) : Number(m[2])
  }
  const sortKey = (title: string, value: string) =>
    title === "Size (NPS)" ? nps(value) : title === "Schedule" ? parseInt(value.replace(/\D/g, ""), 10) : 0
  const optionValues = (title: string) =>
    [...new Set(variants.map((v) => v.options[title]))].sort(
      (a, b) => sortKey(title, a) - sortKey(title, b) || a.localeCompare(b),
    )

  const input = {
    title: TITLE,
    handle: HANDLE,
    subtitle: "ASTM A312 welded · 304 & 316 · Sch 5S to 80S",
    status,
    description: DESCRIPTION,
    ...(image ? { thumbnail: image, images: [{ url: image }] } : {}),
    metadata: {
      meta_title: "Stainless Steel Pipe A312 | 304 & 316 Sch 5S, 10S, 40S, 80S",
      meta_description: META_DESCRIPTION,
      requires_quote: true,
      source: "SaniTube QuickBooks pipe items",
    },
    discountable: true,
    collection_id: template.collection_id ?? undefined,
    type_id: template.type_id ?? undefined,
    categories,
    sales_channels: salesChannels,
    shipping_profile_id: shippingProfileId,
    options: OPTION_TITLES.map((title) => ({ title, values: optionValues(title) })),
    variants,
  }

  for (const v of variants) {
    logger.info(
      `[pipe]   ${v.sku.padEnd(13)} ${v.title.padEnd(36)} quote only` +
        (itemBySku.has(v.sku) ? "  (links existing inventory item)" : ""),
    )
  }

  if (!apply) {
    logger.info(`[pipe] would create ${HANDLE} [${status}] with ${variants.length} variants`)
    logger.info("[pipe] dry run only — re-run with the apply argument to write")
    return
  }

  const { result } = await createProductsWorkflow(container).run({ input: { products: [input as any] } })
  logger.info(`[pipe] + created ${HANDLE} (${result[0].id}) [${status}] with ${variants.length} variants`)
}
