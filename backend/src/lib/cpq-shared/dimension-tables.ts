// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

import type { TubeSizesTable, EndConnectionsTable, MaterialsTable, BomTemplatesTable, AssembliesTable } from "./types"

// Version of shared/cpq/dimensions/*.json: part of the CAD Package cache key.
export const CPQ_TABLES_HASH = "46e4168bb91a"

// shared/cpq/dimensions/tube-sizes.json
export const TUBE_SIZES_TABLE: TubeSizesTable = {
  "version": "2026-10-16-draft",
  "status": "draft: pending Houston sign-off (H2)",
  "units": "in",
  "sizes": [
    {
      "size_code": 50,
      "label": "1/2\"",
      "od_in": 0.5,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16); 1/2\" and 3/4\" are tee-only sizes (Phase 4 D3, H9), wall per sanitaryfittings.us 7MPS table (2026-10-16); 1/2\" and 3/4\" are tee-only sizes (Phase 4 D3, H9), wall per sanitaryfittings.us 7MPS table (2026-10-16)",
      "verified": false
    },
    {
      "size_code": 75,
      "label": "3/4\"",
      "od_in": 0.75,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16); 1/2\" and 3/4\" are tee-only sizes (Phase 4 D3, H9), wall per sanitaryfittings.us 7MPS table (2026-10-16); 1/2\" and 3/4\" are tee-only sizes (Phase 4 D3, H9), wall per sanitaryfittings.us 7MPS table (2026-10-16)",
      "verified": false
    },
    {
      "size_code": 100,
      "label": "1\"",
      "od_in": 1,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 150,
      "label": "1-1/2\"",
      "od_in": 1.5,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 200,
      "label": "2\"",
      "od_in": 2,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 250,
      "label": "2-1/2\"",
      "od_in": 2.5,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 300,
      "label": "3\"",
      "od_in": 3,
      "wall_in": 0.065,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 400,
      "label": "4\"",
      "od_in": 4,
      "wall_in": 0.083,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 600,
      "label": "6\"",
      "od_in": 6,
      "wall_in": 0.109,
      "source": "ASME BPE-2022 hygienic tube OD/wall (Part DT, tubing table; table no. to confirm, H2); cross-checked vs ASTM A270 sanitary tube and 14WMP catalog IDs (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 800,
      "label": "8\"",
      "od_in": 8,
      "wall_in": 0.109,
      "source": "draft estimate (H25): BPE tube table stops at 6\"; wall back-calculated from 14WMP catalog ID (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 1000,
      "label": "10\"",
      "od_in": 10,
      "wall_in": 0.109,
      "source": "draft estimate (H25): BPE tube table stops at 6\"; wall back-calculated from 14WMP catalog ID (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    },
    {
      "size_code": 1200,
      "label": "12\"",
      "od_in": 12,
      "wall_in": 0.12,
      "source": "draft estimate (H25): BPE tube table stops at 6\"; wall back-calculated from 14WMP catalog ID (duvasanitary.com / sanitaryfittings.us, 2026-10-16)",
      "verified": false
    }
  ]
}

// shared/cpq/dimensions/end-connections.json
export const END_CONNECTIONS_TABLE: EndConnectionsTable = {
  "version": "2026-10-18-cardinal-draft",
  "status": "draft: Sanitube rows pending Houston sign-off (H2); Cardinal rows pending Todd",
  "units": "in",
  "notes": [
    "profile = OUTER half-section [axial_from_face_in, radius_in], face (0) → weld line (length_in).",
    "Only bw rows are verified. Every other row is a draft for Houston to check (H2, H28).",
    "Rows bw, tc, mil, fil, pbs, tbs, mnpt are Sanitube's, unchanged apart from mass_lb (scripts/check-sanitube-tables.mjs compares them).",
    "Cardinal rows (fl150, fl300, fnpt, grv, bwp, cap) are written by shared/cpq/tools/gen-end-connections.mjs. Flange bolt holes are not modelled.",
    "mass_lb = T316L density 0.290 lb/in³ × (revolved outer profile − bore), an estimate (verified false). Weights add the two end masses to the tube.",
    "bore_in: null = tube ID; 0 = closed (cap); otherwise the bore at the face (fnpt thread envelope, grv/bwp pipe ID)."
  ],
  "types": [
    {
      "code": "bw",
      "label": "PLAIN WELD END",
      "short": "BW",
      "pn_token": "bw",
      "sort": 1,
      "aliases": [
        "PLAIN END"
      ]
    },
    {
      "code": "tc",
      "label": "TC FERRULE",
      "short": "TC",
      "pn_token": "clmp",
      "sort": 2
    },
    {
      "code": "mil",
      "label": "MALE I-LINE FERRULE",
      "short": "I-LINE M",
      "pn_token": "mil",
      "sort": 3
    },
    {
      "code": "fil",
      "label": "FEMALE I-LINE FERRULE",
      "short": "I-LINE F",
      "pn_token": "fil",
      "sort": 4
    },
    {
      "code": "pbs",
      "label": "PLAIN BEVEL SEAT FERRULE WITH NUT",
      "short": "BEVEL SEAT",
      "pn_token": "pbs",
      "sort": 5
    },
    {
      "code": "tbs",
      "label": "THREADED BEVEL SEAT FERRULE WITH NUT",
      "short": "BEVEL SEAT THD",
      "pn_token": "tbs",
      "sort": 6
    },
    {
      "code": "mnpt",
      "label": "MALE NPT THREAD",
      "short": "MNPT",
      "pn_token": "mnpt",
      "sort": 7
    },
    {
      "code": "fl150",
      "label": "150# RF FLANGE",
      "short": "150# FLG",
      "pn_token": "fl150",
      "sort": 8
    },
    {
      "code": "fl300",
      "label": "300# RF FLANGE",
      "short": "300# FLG",
      "pn_token": "fl300",
      "sort": 9
    },
    {
      "code": "fnpt",
      "label": "FEMALE NPT THREAD",
      "short": "FNPT",
      "pn_token": "fnpt",
      "sort": 10
    },
    {
      "code": "grv",
      "label": "IPS GROOVED END",
      "short": "GROOVED",
      "pn_token": "grv",
      "sort": 11
    },
    {
      "code": "bwp",
      "label": "BUTT-WELD PIPE END (SCH 10S)",
      "short": "BW PIPE",
      "pn_token": "bwp",
      "sort": 12
    },
    {
      "code": "cap",
      "label": "WELDED END CAP",
      "short": "CAP",
      "pn_token": "cap",
      "sort": 13
    }
  ],
  "rows": [
    {
      "code": "bw",
      "size_code": 50,
      "length_in": 0,
      "max_od_in": 0.5,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 50,
      "length_in": 0.5,
      "max_od_in": 0.984,
      "profile": [
        [
          0,
          0.492
        ],
        [
          0.1,
          0.492
        ],
        [
          0.188,
          0.25
        ],
        [
          0.5,
          0.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.036,
      "source": "draft (Phase 4 D3): 1/2\"-3/4\" clamp ferrule, flange OD 0.984\" per sanitaryfittings.us 7MPS / 14WMP tables (2026-10-16); length 0.5\" and profile drafted like the 1\" row (20° clamp-back taper, 0.10\" flange land)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 75,
      "length_in": 0,
      "max_od_in": 0.75,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 75,
      "length_in": 0.5,
      "max_od_in": 0.984,
      "profile": [
        [
          0,
          0.492
        ],
        [
          0.1,
          0.492
        ],
        [
          0.143,
          0.375
        ],
        [
          0.5,
          0.375
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.031,
      "source": "draft (Phase 4 D3): 1/2\"-3/4\" clamp ferrule, flange OD 0.984\" per sanitaryfittings.us 7MPS / 14WMP tables (2026-10-16); length 0.5\" and profile drafted like the 1\" row (20° clamp-back taper, 0.10\" flange land)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 100,
      "length_in": 0,
      "max_od_in": 1,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 100,
      "length_in": 0.5,
      "max_od_in": 1.984,
      "profile": [
        [
          0,
          0.992
        ],
        [
          0.1,
          0.992
        ],
        [
          0.279,
          0.5
        ],
        [
          0.5,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.148,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 100,
      "length_in": 1,
      "max_od_in": 1.5,
      "profile": [
        [
          0,
          0.75
        ],
        [
          0.35,
          0.75
        ],
        [
          0.441,
          0.5
        ],
        [
          1,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.167,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 100,
      "length_in": 0.875,
      "max_od_in": 1.625,
      "profile": [
        [
          0,
          0.8125
        ],
        [
          0.306,
          0.8125
        ],
        [
          0.42,
          0.5
        ],
        [
          0.875,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.182,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 100,
      "length_in": 1.25,
      "max_od_in": 1.875,
      "profile": [
        [
          0,
          0.9375
        ],
        [
          0.75,
          0.9375
        ],
        [
          0.909,
          0.5
        ],
        [
          1.25,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.54,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 100,
      "length_in": 1,
      "max_od_in": 1.875,
      "profile": [
        [
          0,
          0.9375
        ],
        [
          0.6,
          0.9375
        ],
        [
          0.759,
          0.5
        ],
        [
          1,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.44,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 100,
      "length_in": 0.933,
      "max_od_in": 1.315,
      "profile": [
        [
          0,
          0.6575
        ],
        [
          0.683,
          0.6575
        ],
        [
          0.808,
          0.5
        ],
        [
          0.933,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.175,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 150,
      "length_in": 0,
      "max_od_in": 1.5,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 150,
      "length_in": 0.5,
      "max_od_in": 1.984,
      "profile": [
        [
          0,
          0.992
        ],
        [
          0.1,
          0.992
        ],
        [
          0.188,
          0.75
        ],
        [
          0.5,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.097,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 150,
      "length_in": 1,
      "max_od_in": 2,
      "profile": [
        [
          0,
          1
        ],
        [
          0.35,
          1
        ],
        [
          0.441,
          0.75
        ],
        [
          1,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.242,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 150,
      "length_in": 0.875,
      "max_od_in": 2.125,
      "profile": [
        [
          0,
          1.0625
        ],
        [
          0.306,
          1.0625
        ],
        [
          0.42,
          0.75
        ],
        [
          0.875,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.26,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 150,
      "length_in": 1.25,
      "max_od_in": 2.375,
      "profile": [
        [
          0,
          1.1875
        ],
        [
          0.75,
          1.1875
        ],
        [
          0.909,
          0.75
        ],
        [
          1.25,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.742,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 150,
      "length_in": 1,
      "max_od_in": 2.375,
      "profile": [
        [
          0,
          1.1875
        ],
        [
          0.6,
          1.1875
        ],
        [
          0.759,
          0.75
        ],
        [
          1,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.605,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 150,
      "length_in": 0.974,
      "max_od_in": 1.9,
      "profile": [
        [
          0,
          0.95
        ],
        [
          0.724,
          0.95
        ],
        [
          0.849,
          0.75
        ],
        [
          0.974,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.326,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 200,
      "length_in": 0,
      "max_od_in": 2,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 200,
      "length_in": 0.5,
      "max_od_in": 2.516,
      "profile": [
        [
          0,
          1.258
        ],
        [
          0.1,
          1.258
        ],
        [
          0.194,
          1
        ],
        [
          0.5,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.134,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 200,
      "length_in": 1,
      "max_od_in": 2.5,
      "profile": [
        [
          0,
          1.25
        ],
        [
          0.35,
          1.25
        ],
        [
          0.441,
          1
        ],
        [
          1,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.316,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 200,
      "length_in": 0.875,
      "max_od_in": 2.625,
      "profile": [
        [
          0,
          1.3125
        ],
        [
          0.306,
          1.3125
        ],
        [
          0.42,
          1
        ],
        [
          0.875,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.338,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 200,
      "length_in": 1.25,
      "max_od_in": 2.875,
      "profile": [
        [
          0,
          1.4375
        ],
        [
          0.75,
          1.4375
        ],
        [
          0.909,
          1
        ],
        [
          1.25,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.945,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 200,
      "length_in": 1,
      "max_od_in": 2.875,
      "profile": [
        [
          0,
          1.4375
        ],
        [
          0.6,
          1.4375
        ],
        [
          0.759,
          1
        ],
        [
          1,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.77,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 200,
      "length_in": 1.007,
      "max_od_in": 2.375,
      "profile": [
        [
          0,
          1.1875
        ],
        [
          0.757,
          1.1875
        ],
        [
          0.882,
          1
        ],
        [
          1.007,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.421,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 250,
      "length_in": 0,
      "max_od_in": 2.5,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 250,
      "length_in": 0.5,
      "max_od_in": 3.047,
      "profile": [
        [
          0,
          1.5235
        ],
        [
          0.1,
          1.5235
        ],
        [
          0.2,
          1.25
        ],
        [
          0.5,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.175,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 250,
      "length_in": 1,
      "max_od_in": 3,
      "profile": [
        [
          0,
          1.5
        ],
        [
          0.35,
          1.5
        ],
        [
          0.441,
          1.25
        ],
        [
          1,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.391,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 250,
      "length_in": 0.875,
      "max_od_in": 3.125,
      "profile": [
        [
          0,
          1.5625
        ],
        [
          0.306,
          1.5625
        ],
        [
          0.42,
          1.25
        ],
        [
          0.875,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.415,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 250,
      "length_in": 1.25,
      "max_od_in": 3.375,
      "profile": [
        [
          0,
          1.6875
        ],
        [
          0.75,
          1.6875
        ],
        [
          0.909,
          1.25
        ],
        [
          1.25,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.147,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 250,
      "length_in": 1,
      "max_od_in": 3.375,
      "profile": [
        [
          0,
          1.6875
        ],
        [
          0.6,
          1.6875
        ],
        [
          0.759,
          1.25
        ],
        [
          1,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.935,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 250,
      "length_in": 1.388,
      "max_od_in": 2.875,
      "profile": [
        [
          0,
          1.4375
        ],
        [
          1.138,
          1.4375
        ],
        [
          1.263,
          1.25
        ],
        [
          1.388,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.751,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 300,
      "length_in": 0,
      "max_od_in": 3,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 300,
      "length_in": 0.5,
      "max_od_in": 3.579,
      "profile": [
        [
          0,
          1.7895
        ],
        [
          0.1,
          1.7895
        ],
        [
          0.205,
          1.5
        ],
        [
          0.5,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.218,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 300,
      "length_in": 1,
      "max_od_in": 3.5,
      "profile": [
        [
          0,
          1.75
        ],
        [
          0.35,
          1.75
        ],
        [
          0.441,
          1.5
        ],
        [
          1,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.466,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 300,
      "length_in": 0.875,
      "max_od_in": 3.625,
      "profile": [
        [
          0,
          1.8125
        ],
        [
          0.306,
          1.8125
        ],
        [
          0.42,
          1.5
        ],
        [
          0.875,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.493,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 300,
      "length_in": 1.25,
      "max_od_in": 3.875,
      "profile": [
        [
          0,
          1.9375
        ],
        [
          0.75,
          1.9375
        ],
        [
          0.909,
          1.5
        ],
        [
          1.25,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.349,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 300,
      "length_in": 1,
      "max_od_in": 3.875,
      "profile": [
        [
          0,
          1.9375
        ],
        [
          0.6,
          1.9375
        ],
        [
          0.759,
          1.5
        ],
        [
          1,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.1,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 300,
      "length_in": 1.45,
      "max_od_in": 3.5,
      "profile": [
        [
          0,
          1.75
        ],
        [
          1.2,
          1.75
        ],
        [
          1.325,
          1.5
        ],
        [
          1.45,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.185,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 400,
      "length_in": 0,
      "max_od_in": 4,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 400,
      "length_in": 0.625,
      "max_od_in": 4.682,
      "profile": [
        [
          0,
          2.341
        ],
        [
          0.1,
          2.341
        ],
        [
          0.224,
          2
        ],
        [
          0.625,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.401,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 400,
      "length_in": 1.125,
      "max_od_in": 4.6,
      "profile": [
        [
          0,
          2.3
        ],
        [
          0.394,
          2.3
        ],
        [
          0.503,
          2
        ],
        [
          1.125,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.859,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 400,
      "length_in": 1,
      "max_od_in": 4.75,
      "profile": [
        [
          0,
          2.375
        ],
        [
          0.35,
          2.375
        ],
        [
          0.486,
          2
        ],
        [
          1,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.918,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 400,
      "length_in": 1.375,
      "max_od_in": 5,
      "profile": [
        [
          0,
          2.5
        ],
        [
          0.825,
          2.5
        ],
        [
          1.007,
          2
        ],
        [
          1.375,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 2.278,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 400,
      "length_in": 1.125,
      "max_od_in": 5,
      "profile": [
        [
          0,
          2.5
        ],
        [
          0.675,
          2.5
        ],
        [
          0.857,
          2
        ],
        [
          1.125,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.897,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 400,
      "length_in": 1.55,
      "max_od_in": 4.5,
      "profile": [
        [
          0,
          2.25
        ],
        [
          1.3,
          2.25
        ],
        [
          1.425,
          2
        ],
        [
          1.55,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.777,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 600,
      "length_in": 0,
      "max_od_in": 6,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 600,
      "length_in": 0.875,
      "max_od_in": 6.562,
      "profile": [
        [
          0,
          3.281
        ],
        [
          0.1,
          3.281
        ],
        [
          0.202,
          3
        ],
        [
          0.875,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 0.753,
      "source": "ASME BPE-2022 hygienic clamp ferrule (Part DT, 14WMP short weld pattern; figure/table no. to confirm, H2); flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 600,
      "length_in": 1.25,
      "max_od_in": 6.75,
      "profile": [
        [
          0,
          3.375
        ],
        [
          0.438,
          3.375
        ],
        [
          0.574,
          3
        ],
        [
          1.25,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.83,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 600,
      "length_in": 1.125,
      "max_od_in": 6.875,
      "profile": [
        [
          0,
          3.4375
        ],
        [
          0.394,
          3.4375
        ],
        [
          0.553,
          3
        ],
        [
          1.125,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.868,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 600,
      "length_in": 1.5,
      "max_od_in": 7.25,
      "profile": [
        [
          0,
          3.625
        ],
        [
          0.9,
          3.625
        ],
        [
          1.127,
          3
        ],
        [
          1.5,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 4.687,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 600,
      "length_in": 1.25,
      "max_od_in": 7.25,
      "profile": [
        [
          0,
          3.625
        ],
        [
          0.75,
          3.625
        ],
        [
          0.977,
          3
        ],
        [
          1.25,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 3.975,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 600,
      "length_in": 1.763,
      "max_od_in": 6.625,
      "profile": [
        [
          0,
          3.3125
        ],
        [
          1.513,
          3.3125
        ],
        [
          1.638,
          3
        ],
        [
          1.763,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 3.861,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 800,
      "length_in": 0,
      "max_od_in": 8,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 800,
      "length_in": 0.875,
      "max_od_in": 8.602,
      "profile": [
        [
          0,
          4.301
        ],
        [
          0.1,
          4.301
        ],
        [
          0.21,
          4
        ],
        [
          0.875,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.037,
      "source": "draft: BPE clamp ferrule table stops at 6\"; flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 800,
      "length_in": 1.25,
      "max_od_in": 8.75,
      "profile": [
        [
          0,
          4.375
        ],
        [
          0.438,
          4.375
        ],
        [
          0.574,
          4
        ],
        [
          1.25,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 2.424,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 800,
      "length_in": 1.125,
      "max_od_in": 8.875,
      "profile": [
        [
          0,
          4.4375
        ],
        [
          0.394,
          4.4375
        ],
        [
          0.553,
          4
        ],
        [
          1.125,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 2.469,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 800,
      "length_in": 1.5,
      "max_od_in": 9.25,
      "profile": [
        [
          0,
          4.625
        ],
        [
          0.9,
          4.625
        ],
        [
          1.127,
          4
        ],
        [
          1.5,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 6.139,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 800,
      "length_in": 1.25,
      "max_od_in": 9.25,
      "profile": [
        [
          0,
          4.625
        ],
        [
          0.75,
          4.625
        ],
        [
          0.977,
          4
        ],
        [
          1.25,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 5.207,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 800,
      "length_in": 1.963,
      "max_od_in": 8.625,
      "profile": [
        [
          0,
          4.3125
        ],
        [
          1.713,
          4.3125
        ],
        [
          1.838,
          4
        ],
        [
          1.963,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 5.738,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 1000,
      "length_in": 0,
      "max_od_in": 10,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 1000,
      "length_in": 0.875,
      "max_od_in": 10.57,
      "profile": [
        [
          0,
          5.285
        ],
        [
          0.1,
          5.285
        ],
        [
          0.204,
          5
        ],
        [
          0.875,
          5
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.264,
      "source": "draft: BPE clamp ferrule table stops at 6\"; flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 1000,
      "length_in": 1.25,
      "max_od_in": 10.75,
      "profile": [
        [
          0,
          5.375
        ],
        [
          0.438,
          5.375
        ],
        [
          0.574,
          5
        ],
        [
          1.25,
          5
        ]
      ],
      "bore_in": null,
      "mass_lb": 3.018,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 1000,
      "length_in": 1.125,
      "max_od_in": 10.875,
      "profile": [
        [
          0,
          5.4375
        ],
        [
          0.394,
          5.4375
        ],
        [
          0.553,
          5
        ],
        [
          1.125,
          5
        ]
      ],
      "bore_in": null,
      "mass_lb": 3.07,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 1000,
      "length_in": 1.5,
      "max_od_in": 11.25,
      "profile": [
        [
          0,
          5.625
        ],
        [
          0.9,
          5.625
        ],
        [
          1.127,
          5
        ],
        [
          1.5,
          5
        ]
      ],
      "bore_in": null,
      "mass_lb": 7.592,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 1000,
      "length_in": 1.25,
      "max_od_in": 11.25,
      "profile": [
        [
          0,
          5.625
        ],
        [
          0.75,
          5.625
        ],
        [
          0.977,
          5
        ],
        [
          1.25,
          5
        ]
      ],
      "bore_in": null,
      "mass_lb": 6.439,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 1000,
      "length_in": 2.175,
      "max_od_in": 10.75,
      "profile": [
        [
          0,
          5.375
        ],
        [
          1.925,
          5.375
        ],
        [
          2.05,
          5
        ],
        [
          2.175,
          5
        ]
      ],
      "bore_in": null,
      "mass_lb": 9.179,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "bw",
      "size_code": 1200,
      "length_in": 0,
      "max_od_in": 12,
      "profile": [],
      "bore_in": null,
      "mass_lb": 0,
      "source": "n/a (plain weld end: square-cut tube)",
      "verified": true
    },
    {
      "code": "tc",
      "size_code": 1200,
      "length_in": 0.875,
      "max_od_in": 12.57,
      "profile": [
        [
          0,
          6.285
        ],
        [
          0.1,
          6.285
        ],
        [
          0.204,
          6
        ],
        [
          0.875,
          6
        ]
      ],
      "bore_in": null,
      "mass_lb": 1.62,
      "source": "draft: BPE clamp ferrule table stops at 6\"; flange OD + length from 14WMP catalog (duvasanitary.com, sanitaryfittings.us, 2026-10-16); 20° clamp-back taper and 0.10\" flange land are draft",
      "verified": false
    },
    {
      "code": "mil",
      "size_code": 1200,
      "length_in": 1.25,
      "max_od_in": 12.75,
      "profile": [
        [
          0,
          6.375
        ],
        [
          0.438,
          6.375
        ],
        [
          0.574,
          6
        ],
        [
          1.25,
          6
        ]
      ],
      "bore_in": null,
      "mass_lb": 3.76,
      "source": "draft estimate: 3-A I-Line male ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.50–0.75\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "fil",
      "size_code": 1200,
      "length_in": 1.125,
      "max_od_in": 12.875,
      "profile": [
        [
          0,
          6.4375
        ],
        [
          0.394,
          6.4375
        ],
        [
          0.553,
          6
        ],
        [
          1.125,
          6
        ]
      ],
      "bore_in": null,
      "mass_lb": 3.804,
      "source": "draft estimate: 3-A I-Line female ferrule envelope (no ASME BPE table); flange OD ≈ tube OD + 0.625–0.875\", length 0.875–1.125\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "pbs",
      "size_code": 1200,
      "length_in": 1.5,
      "max_od_in": 13.25,
      "profile": [
        [
          0,
          6.625
        ],
        [
          0.9,
          6.625
        ],
        [
          1.127,
          6
        ],
        [
          1.5,
          6
        ]
      ],
      "bore_in": null,
      "mass_lb": 9.221,
      "source": "draft estimate: 3-A bevel seat ferrule + hex nut envelope (no ASME BPE table); nut OD ≈ tube OD + 0.875–1.25\", length 1.25–1.5\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "tbs",
      "size_code": 1200,
      "length_in": 1.25,
      "max_od_in": 13.25,
      "profile": [
        [
          0,
          6.625
        ],
        [
          0.75,
          6.625
        ],
        [
          0.977,
          6
        ],
        [
          1.25,
          6
        ]
      ],
      "bore_in": null,
      "mass_lb": 7.818,
      "source": "draft estimate: 3-A threaded bevel seat ferrule envelope (no ASME BPE table); thread/nut OD ≈ tube OD + 0.875–1.25\", length 1.0–1.25\"; needs Houston/supplier dims (H2)",
      "verified": false
    },
    {
      "code": "mnpt",
      "size_code": 1200,
      "length_in": 2.375,
      "max_od_in": 12.75,
      "profile": [
        [
          0,
          6.375
        ],
        [
          2.125,
          6.375
        ],
        [
          2.25,
          6
        ],
        [
          2.375,
          6
        ]
      ],
      "bore_in": null,
      "mass_lb": 12.331,
      "source": "ASME B1.20.1 NPT, same nominal size as tube (provisional, H28): pipe OD D and effective thread length L2, + 0.25\" weld transition (draft)",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 100,
      "length_in": 2.19,
      "max_od_in": 4.25,
      "profile": [
        [
          0,
          1
        ],
        [
          0.06,
          1
        ],
        [
          0.06,
          2.125
        ],
        [
          0.56,
          2.125
        ],
        [
          0.56,
          0.97
        ],
        [
          2.19,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 2.564,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 1 (tube nominal = NPS): flange OD 4.25\", thickness 0.56\" incl. 0.06\" raised face (RF Ø2\"), hub Ø1.94\" tapering to the tube OD over the 2.19\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 100,
      "length_in": 2.44,
      "max_od_in": 4.88,
      "profile": [
        [
          0,
          1
        ],
        [
          0.06,
          1
        ],
        [
          0.06,
          2.44
        ],
        [
          0.69,
          2.44
        ],
        [
          0.69,
          1.06
        ],
        [
          2.44,
          0.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 4.063,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 1 (tube nominal = NPS): flange OD 4.88\", thickness 0.69\" incl. 0.06\" raised face (RF Ø2\"), hub Ø2.12\" tapering to the tube OD over the 2.44\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 100,
      "length_in": 1.183,
      "max_od_in": 1.815,
      "profile": [
        [
          0,
          0.9075
        ],
        [
          0.933,
          0.9075
        ],
        [
          1.058,
          0.5
        ],
        [
          1.183,
          0.5
        ]
      ],
      "bore_in": 1.315,
      "mass_lb": 0.376,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 1.315\" (bore_in = thread envelope) and effective thread length L2 0.683\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 100,
      "length_in": 2.656,
      "max_od_in": 1.315,
      "profile": [
        [
          0,
          0.6575
        ],
        [
          0.625,
          0.6575
        ],
        [
          0.625,
          0.595
        ],
        [
          0.906,
          0.595
        ],
        [
          0.906,
          0.6575
        ],
        [
          1.906,
          0.6575
        ],
        [
          2.406,
          0.5
        ],
        [
          2.656,
          0.5
        ]
      ],
      "bore_in": 1.097,
      "mass_lb": 0.265,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 1: pipe OD 1.315\" Sch 10S (ASME B36.19M, wall 0.109\"), gasket seat A 0.625\", groove width B 0.281\", groove Ø1.19\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 100,
      "length_in": 3,
      "max_od_in": 1.315,
      "profile": [
        [
          0,
          0.6575
        ],
        [
          2,
          0.6575
        ],
        [
          2.5,
          0.5
        ],
        [
          3,
          0.5
        ]
      ],
      "bore_in": 1.097,
      "mass_lb": 0.31,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 1 Sch 10S pipe (ASME B36.19M: OD 1.315\", wall 0.109\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 100,
      "length_in": 0.625,
      "max_od_in": 1,
      "profile": [
        [
          0,
          0
        ],
        [
          0.0417,
          0.2764
        ],
        [
          0.0833,
          0.3727
        ],
        [
          0.125,
          0.433
        ],
        [
          0.1667,
          0.4714
        ],
        [
          0.2083,
          0.493
        ],
        [
          0.25,
          0.5
        ],
        [
          0.625,
          0.5
        ]
      ],
      "bore_in": 0,
      "mass_lb": 0.037,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 0.25\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 150,
      "length_in": 2.44,
      "max_od_in": 5,
      "profile": [
        [
          0,
          1.44
        ],
        [
          0.06,
          1.44
        ],
        [
          0.06,
          2.5
        ],
        [
          0.69,
          2.5
        ],
        [
          0.69,
          1.28
        ],
        [
          2.44,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 4.337,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 1-1/2 (tube nominal = NPS): flange OD 5\", thickness 0.69\" incl. 0.06\" raised face (RF Ø2.88\"), hub Ø2.56\" tapering to the tube OD over the 2.44\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 150,
      "length_in": 2.69,
      "max_od_in": 6.12,
      "profile": [
        [
          0,
          1.44
        ],
        [
          0.06,
          1.44
        ],
        [
          0.06,
          3.06
        ],
        [
          0.81,
          3.06
        ],
        [
          0.81,
          1.375
        ],
        [
          2.69,
          0.75
        ]
      ],
      "bore_in": null,
      "mass_lb": 7.351,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 1-1/2 (tube nominal = NPS): flange OD 6.12\", thickness 0.81\" incl. 0.06\" raised face (RF Ø2.88\"), hub Ø2.75\" tapering to the tube OD over the 2.69\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 150,
      "length_in": 1.224,
      "max_od_in": 2.4,
      "profile": [
        [
          0,
          1.2
        ],
        [
          0.974,
          1.2
        ],
        [
          1.099,
          0.75
        ],
        [
          1.224,
          0.75
        ]
      ],
      "bore_in": 1.9,
      "mass_lb": 0.544,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 1.9\" (bore_in = thread envelope) and effective thread length L2 0.724\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 150,
      "length_in": 2.656,
      "max_od_in": 1.9,
      "profile": [
        [
          0,
          0.95
        ],
        [
          0.625,
          0.95
        ],
        [
          0.625,
          0.8875
        ],
        [
          0.906,
          0.8875
        ],
        [
          0.906,
          0.95
        ],
        [
          1.906,
          0.95
        ],
        [
          2.406,
          0.75
        ],
        [
          2.656,
          0.75
        ]
      ],
      "bore_in": 1.682,
      "mass_lb": 0.395,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 1-1/2: pipe OD 1.9\" Sch 10S (ASME B36.19M, wall 0.109\"), gasket seat A 0.625\", groove width B 0.281\", groove Ø1.775\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 150,
      "length_in": 3,
      "max_od_in": 1.9,
      "profile": [
        [
          0,
          0.95
        ],
        [
          2,
          0.95
        ],
        [
          2.5,
          0.75
        ],
        [
          3,
          0.75
        ]
      ],
      "bore_in": 1.682,
      "mass_lb": 0.463,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 1-1/2 Sch 10S pipe (ASME B36.19M: OD 1.9\", wall 0.109\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 150,
      "length_in": 0.75,
      "max_od_in": 1.5,
      "profile": [
        [
          0,
          0
        ],
        [
          0.0625,
          0.4146
        ],
        [
          0.125,
          0.559
        ],
        [
          0.1875,
          0.6495
        ],
        [
          0.25,
          0.7071
        ],
        [
          0.3125,
          0.7395
        ],
        [
          0.375,
          0.75
        ],
        [
          0.75,
          0.75
        ]
      ],
      "bore_in": 0,
      "mass_lb": 0.071,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 0.375\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 200,
      "length_in": 2.5,
      "max_od_in": 6,
      "profile": [
        [
          0,
          1.81
        ],
        [
          0.06,
          1.81
        ],
        [
          0.06,
          3
        ],
        [
          0.75,
          3
        ],
        [
          0.75,
          1.53
        ],
        [
          2.5,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 6.434,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 2 (tube nominal = NPS): flange OD 6\", thickness 0.75\" incl. 0.06\" raised face (RF Ø3.62\"), hub Ø3.06\" tapering to the tube OD over the 2.5\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 200,
      "length_in": 2.75,
      "max_od_in": 6.5,
      "profile": [
        [
          0,
          1.81
        ],
        [
          0.06,
          1.81
        ],
        [
          0.06,
          3.25
        ],
        [
          0.88,
          3.25
        ],
        [
          0.88,
          1.655
        ],
        [
          2.75,
          1
        ]
      ],
      "bore_in": null,
      "mass_lb": 8.943,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 2 (tube nominal = NPS): flange OD 6.5\", thickness 0.88\" incl. 0.06\" raised face (RF Ø3.62\"), hub Ø3.31\" tapering to the tube OD over the 2.75\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 200,
      "length_in": 1.257,
      "max_od_in": 2.875,
      "profile": [
        [
          0,
          1.4375
        ],
        [
          1.007,
          1.4375
        ],
        [
          1.132,
          1
        ],
        [
          1.257,
          1
        ]
      ],
      "bore_in": 2.375,
      "mass_lb": 0.688,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 2.375\" (bore_in = thread envelope) and effective thread length L2 0.757\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 200,
      "length_in": 2.719,
      "max_od_in": 2.375,
      "profile": [
        [
          0,
          1.1875
        ],
        [
          0.625,
          1.1875
        ],
        [
          0.625,
          1.125
        ],
        [
          0.969,
          1.125
        ],
        [
          0.969,
          1.1875
        ],
        [
          1.969,
          1.1875
        ],
        [
          2.469,
          1
        ],
        [
          2.719,
          1
        ]
      ],
      "bore_in": 2.157,
      "mass_lb": 0.51,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 2: pipe OD 2.375\" Sch 10S (ASME B36.19M, wall 0.109\"), gasket seat A 0.625\", groove width B 0.344\", groove Ø2.25\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 200,
      "length_in": 3,
      "max_od_in": 2.375,
      "profile": [
        [
          0,
          1.1875
        ],
        [
          2,
          1.1875
        ],
        [
          2.5,
          1
        ],
        [
          3,
          1
        ]
      ],
      "bore_in": 2.157,
      "mass_lb": 0.591,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 2 Sch 10S pipe (ASME B36.19M: OD 2.375\", wall 0.109\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 200,
      "length_in": 0.875,
      "max_od_in": 2,
      "profile": [
        [
          0,
          0
        ],
        [
          0.0833,
          0.5528
        ],
        [
          0.1667,
          0.7454
        ],
        [
          0.25,
          0.866
        ],
        [
          0.3333,
          0.9428
        ],
        [
          0.4167,
          0.986
        ],
        [
          0.5,
          1
        ],
        [
          0.875,
          1
        ]
      ],
      "bore_in": 0,
      "mass_lb": 0.114,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 0.5\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 250,
      "length_in": 2.75,
      "max_od_in": 7,
      "profile": [
        [
          0,
          2.06
        ],
        [
          0.06,
          2.06
        ],
        [
          0.06,
          3.5
        ],
        [
          0.88,
          3.5
        ],
        [
          0.88,
          1.78
        ],
        [
          2.75,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 9.816,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 2-1/2 (tube nominal = NPS): flange OD 7\", thickness 0.88\" incl. 0.06\" raised face (RF Ø4.12\"), hub Ø3.56\" tapering to the tube OD over the 2.75\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 250,
      "length_in": 3,
      "max_od_in": 7.5,
      "profile": [
        [
          0,
          2.06
        ],
        [
          0.06,
          2.06
        ],
        [
          0.06,
          3.75
        ],
        [
          1,
          3.75
        ],
        [
          1,
          1.97
        ],
        [
          3,
          1.25
        ]
      ],
      "bore_in": null,
      "mass_lb": 13.239,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 2-1/2 (tube nominal = NPS): flange OD 7.5\", thickness 1\" incl. 0.06\" raised face (RF Ø4.12\"), hub Ø3.94\" tapering to the tube OD over the 3\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 250,
      "length_in": 1.638,
      "max_od_in": 3.375,
      "profile": [
        [
          0,
          1.6875
        ],
        [
          1.388,
          1.6875
        ],
        [
          1.513,
          1.25
        ],
        [
          1.638,
          1.25
        ]
      ],
      "bore_in": 2.875,
      "mass_lb": 1.094,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 2.875\" (bore_in = thread envelope) and effective thread length L2 1.138\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 250,
      "length_in": 2.719,
      "max_od_in": 2.875,
      "profile": [
        [
          0,
          1.4375
        ],
        [
          0.625,
          1.4375
        ],
        [
          0.625,
          1.36
        ],
        [
          0.969,
          1.36
        ],
        [
          0.969,
          1.4375
        ],
        [
          1.969,
          1.4375
        ],
        [
          2.469,
          1.25
        ],
        [
          2.719,
          1.25
        ]
      ],
      "bore_in": 2.635,
      "mass_lb": 0.671,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 2-1/2: pipe OD 2.875\" Sch 10S (ASME B36.19M, wall 0.12\"), gasket seat A 0.625\", groove width B 0.344\", groove Ø2.72\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 250,
      "length_in": 3,
      "max_od_in": 2.875,
      "profile": [
        [
          0,
          1.4375
        ],
        [
          2,
          1.4375
        ],
        [
          2.5,
          1.25
        ],
        [
          3,
          1.25
        ]
      ],
      "bore_in": 2.635,
      "mass_lb": 0.785,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 2-1/2 Sch 10S pipe (ASME B36.19M: OD 2.875\", wall 0.12\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 250,
      "length_in": 1,
      "max_od_in": 2.5,
      "profile": [
        [
          0,
          0
        ],
        [
          0.1042,
          0.691
        ],
        [
          0.2083,
          0.9317
        ],
        [
          0.3125,
          1.0825
        ],
        [
          0.4167,
          1.1785
        ],
        [
          0.5208,
          1.2325
        ],
        [
          0.625,
          1.25
        ],
        [
          1,
          1.25
        ]
      ],
      "bore_in": 0,
      "mass_lb": 0.167,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 0.625\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 300,
      "length_in": 2.75,
      "max_od_in": 7.5,
      "profile": [
        [
          0,
          2.5
        ],
        [
          0.06,
          2.5
        ],
        [
          0.06,
          3.75
        ],
        [
          0.94,
          3.75
        ],
        [
          0.94,
          2.125
        ],
        [
          2.75,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 11.928,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 3 (tube nominal = NPS): flange OD 7.5\", thickness 0.94\" incl. 0.06\" raised face (RF Ø5\"), hub Ø4.25\" tapering to the tube OD over the 2.75\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 300,
      "length_in": 3.12,
      "max_od_in": 8.25,
      "profile": [
        [
          0,
          2.5
        ],
        [
          0.06,
          2.5
        ],
        [
          0.06,
          4.125
        ],
        [
          1.12,
          4.125
        ],
        [
          1.12,
          2.31
        ],
        [
          3.12,
          1.5
        ]
      ],
      "bore_in": null,
      "mass_lb": 17.633,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 3 (tube nominal = NPS): flange OD 8.25\", thickness 1.12\" incl. 0.06\" raised face (RF Ø5\"), hub Ø4.62\" tapering to the tube OD over the 3.12\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 300,
      "length_in": 1.7,
      "max_od_in": 4,
      "profile": [
        [
          0,
          2
        ],
        [
          1.45,
          2
        ],
        [
          1.575,
          1.5
        ],
        [
          1.7,
          1.5
        ]
      ],
      "bore_in": 3.5,
      "mass_lb": 1.377,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 3.5\" (bore_in = thread envelope) and effective thread length L2 1.2\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 300,
      "length_in": 2.719,
      "max_od_in": 3.5,
      "profile": [
        [
          0,
          1.75
        ],
        [
          0.625,
          1.75
        ],
        [
          0.625,
          1.672
        ],
        [
          0.969,
          1.672
        ],
        [
          0.969,
          1.75
        ],
        [
          1.969,
          1.75
        ],
        [
          2.469,
          1.5
        ],
        [
          2.719,
          1.5
        ]
      ],
      "bore_in": 3.26,
      "mass_lb": 0.821,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 3: pipe OD 3.5\" Sch 10S (ASME B36.19M, wall 0.12\"), gasket seat A 0.625\", groove width B 0.344\", groove Ø3.344\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 300,
      "length_in": 3,
      "max_od_in": 3.5,
      "profile": [
        [
          0,
          1.75
        ],
        [
          2,
          1.75
        ],
        [
          2.5,
          1.5
        ],
        [
          3,
          1.5
        ]
      ],
      "bore_in": 3.26,
      "mass_lb": 0.96,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 3 Sch 10S pipe (ASME B36.19M: OD 3.5\", wall 0.12\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 300,
      "length_in": 1.125,
      "max_od_in": 3,
      "profile": [
        [
          0,
          0
        ],
        [
          0.125,
          0.8292
        ],
        [
          0.25,
          1.118
        ],
        [
          0.375,
          1.299
        ],
        [
          0.5,
          1.4142
        ],
        [
          0.625,
          1.479
        ],
        [
          0.75,
          1.5
        ],
        [
          1.125,
          1.5
        ]
      ],
      "bore_in": 0,
      "mass_lb": 0.23,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 0.75\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 400,
      "length_in": 3,
      "max_od_in": 9,
      "profile": [
        [
          0,
          3.095
        ],
        [
          0.06,
          3.095
        ],
        [
          0.06,
          4.5
        ],
        [
          0.94,
          4.5
        ],
        [
          0.94,
          2.655
        ],
        [
          3,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 16.949,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 4 (tube nominal = NPS): flange OD 9\", thickness 0.94\" incl. 0.06\" raised face (RF Ø6.19\"), hub Ø5.31\" tapering to the tube OD over the 3\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 400,
      "length_in": 3.38,
      "max_od_in": 10,
      "profile": [
        [
          0,
          3.095
        ],
        [
          0.06,
          3.095
        ],
        [
          0.06,
          5
        ],
        [
          1.25,
          5
        ],
        [
          1.25,
          2.875
        ],
        [
          3.38,
          2
        ]
      ],
      "bore_in": null,
      "mass_lb": 27.965,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 4 (tube nominal = NPS): flange OD 10\", thickness 1.25\" incl. 0.06\" raised face (RF Ø6.19\"), hub Ø5.75\" tapering to the tube OD over the 3.38\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 400,
      "length_in": 1.8,
      "max_od_in": 5,
      "profile": [
        [
          0,
          2.5
        ],
        [
          1.55,
          2.5
        ],
        [
          1.675,
          2
        ],
        [
          1.8,
          2
        ]
      ],
      "bore_in": 4.5,
      "mass_lb": 1.874,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 4.5\" (bore_in = thread envelope) and effective thread length L2 1.3\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 400,
      "length_in": 2.719,
      "max_od_in": 4.5,
      "profile": [
        [
          0,
          2.25
        ],
        [
          0.625,
          2.25
        ],
        [
          0.625,
          2.167
        ],
        [
          0.969,
          2.167
        ],
        [
          0.969,
          2.25
        ],
        [
          1.969,
          2.25
        ],
        [
          2.469,
          2
        ],
        [
          2.719,
          2
        ]
      ],
      "bore_in": 4.26,
      "mass_lb": 1.094,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 4: pipe OD 4.5\" Sch 10S (ASME B36.19M, wall 0.12\"), gasket seat A 0.625\", groove width B 0.344\", groove Ø4.334\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 400,
      "length_in": 3,
      "max_od_in": 4.5,
      "profile": [
        [
          0,
          2.25
        ],
        [
          2,
          2.25
        ],
        [
          2.5,
          2
        ],
        [
          3,
          2
        ]
      ],
      "bore_in": 4.26,
      "mass_lb": 1.298,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 4 Sch 10S pipe (ASME B36.19M: OD 4.5\", wall 0.12\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 400,
      "length_in": 1.375,
      "max_od_in": 4,
      "profile": [
        [
          0,
          0
        ],
        [
          0.1667,
          1.1055
        ],
        [
          0.3333,
          1.4907
        ],
        [
          0.5,
          1.7321
        ],
        [
          0.6667,
          1.8856
        ],
        [
          0.8333,
          1.972
        ],
        [
          1,
          2
        ],
        [
          1.375,
          2
        ]
      ],
      "bore_in": 0,
      "mass_lb": 0.485,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 1\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 600,
      "length_in": 3.5,
      "max_od_in": 11,
      "profile": [
        [
          0,
          4.25
        ],
        [
          0.06,
          4.25
        ],
        [
          0.06,
          5.5
        ],
        [
          1,
          5.5
        ],
        [
          1,
          3.78
        ],
        [
          3.5,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 26.533,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 6 (tube nominal = NPS): flange OD 11\", thickness 1\" incl. 0.06\" raised face (RF Ø8.5\"), hub Ø7.56\" tapering to the tube OD over the 3.5\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 600,
      "length_in": 3.88,
      "max_od_in": 12.5,
      "profile": [
        [
          0,
          4.25
        ],
        [
          0.06,
          4.25
        ],
        [
          0.06,
          6.25
        ],
        [
          1.44,
          6.25
        ],
        [
          1.44,
          4.06
        ],
        [
          3.88,
          3
        ]
      ],
      "bore_in": null,
      "mass_lb": 48.463,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 6 (tube nominal = NPS): flange OD 12.5\", thickness 1.44\" incl. 0.06\" raised face (RF Ø8.5\"), hub Ø8.12\" tapering to the tube OD over the 3.88\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 600,
      "length_in": 2.013,
      "max_od_in": 7.125,
      "profile": [
        [
          0,
          3.5625
        ],
        [
          1.763,
          3.5625
        ],
        [
          1.888,
          3
        ],
        [
          2.013,
          3
        ]
      ],
      "bore_in": 6.625,
      "mass_lb": 3.111,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 6.625\" (bore_in = thread envelope) and effective thread length L2 1.513\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 600,
      "length_in": 2.719,
      "max_od_in": 6.625,
      "profile": [
        [
          0,
          3.3125
        ],
        [
          0.625,
          3.3125
        ],
        [
          0.625,
          3.2275
        ],
        [
          0.969,
          3.2275
        ],
        [
          0.969,
          3.3125
        ],
        [
          1.969,
          3.3125
        ],
        [
          2.469,
          3
        ],
        [
          2.719,
          3
        ]
      ],
      "bore_in": 6.357,
      "mass_lb": 1.876,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 6: pipe OD 6.625\" Sch 10S (ASME B36.19M, wall 0.134\"), gasket seat A 0.625\", groove width B 0.344\", groove Ø6.455\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 600,
      "length_in": 3,
      "max_od_in": 6.625,
      "profile": [
        [
          0,
          3.3125
        ],
        [
          2,
          3.3125
        ],
        [
          2.5,
          3
        ],
        [
          3,
          3
        ]
      ],
      "bore_in": 6.357,
      "mass_lb": 2.221,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 6 Sch 10S pipe (ASME B36.19M: OD 6.625\", wall 0.134\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 600,
      "length_in": 1.875,
      "max_od_in": 6,
      "profile": [
        [
          0,
          0
        ],
        [
          0.25,
          1.6583
        ],
        [
          0.5,
          2.2361
        ],
        [
          0.75,
          2.5981
        ],
        [
          1,
          2.8284
        ],
        [
          1.25,
          2.958
        ],
        [
          1.5,
          3
        ],
        [
          1.875,
          3
        ]
      ],
      "bore_in": 0,
      "mass_lb": 1.332,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 1.5\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    },
    {
      "code": "fl150",
      "size_code": 800,
      "length_in": 4,
      "max_od_in": 13.5,
      "profile": [
        [
          0,
          5.31
        ],
        [
          0.06,
          5.31
        ],
        [
          0.06,
          6.75
        ],
        [
          1.12,
          6.75
        ],
        [
          1.12,
          4.845
        ],
        [
          4,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 41.844,
      "source": "draft: ASME B16.5-2020 Class 150 raised-face weld-neck flange, NPS 8 (tube nominal = NPS): flange OD 13.5\", thickness 1.12\" incl. 0.06\" raised face (RF Ø10.62\"), hub Ø9.69\" tapering to the tube OD over the 4\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fl300",
      "size_code": 800,
      "length_in": 4.38,
      "max_od_in": 15,
      "profile": [
        [
          0,
          5.31
        ],
        [
          0.06,
          5.31
        ],
        [
          0.06,
          7.5
        ],
        [
          1.62,
          7.5
        ],
        [
          1.62,
          5.125
        ],
        [
          4.38,
          4
        ]
      ],
      "bore_in": null,
      "mass_lb": 73.681,
      "source": "draft: ASME B16.5-2020 Class 300 raised-face weld-neck flange, NPS 8 (tube nominal = NPS): flange OD 15\", thickness 1.62\" incl. 0.06\" raised face (RF Ø10.62\"), hub Ø10.25\" tapering to the tube OD over the 4.38\" weld-neck length. Approximates a tube-OD slip-on / weld-neck adapter. Bolt holes are not modelled (mass slightly high). Transcribed, to verify.",
      "verified": false
    },
    {
      "code": "fnpt",
      "size_code": 800,
      "length_in": 2.213,
      "max_od_in": 9.125,
      "profile": [
        [
          0,
          4.5625
        ],
        [
          1.963,
          4.5625
        ],
        [
          2.088,
          4
        ],
        [
          2.213,
          4
        ]
      ],
      "bore_in": 8.625,
      "mass_lb": 4.432,
      "source": "draft: female NPT half-coupling envelope, same nominal size as tube: ASME B1.20.1 pipe OD D 8.625\" (bore_in = thread envelope) and effective thread length L2 1.713\" + 0.25\" body; body OD ≈ D + 0.5\"; 0.125\" taper + 0.125\" weld land to the tube OD. Draft.",
      "verified": false
    },
    {
      "code": "grv",
      "size_code": 800,
      "length_in": 2.969,
      "max_od_in": 8.625,
      "profile": [
        [
          0,
          4.3125
        ],
        [
          0.75,
          4.3125
        ],
        [
          0.75,
          4.2205
        ],
        [
          1.219,
          4.2205
        ],
        [
          1.219,
          4.3125
        ],
        [
          2.219,
          4.3125
        ],
        [
          2.719,
          4
        ],
        [
          2.969,
          4
        ]
      ],
      "bore_in": 8.329,
      "mass_lb": 2.877,
      "source": "draft: IPS roll-grooved end per AWWA C606 / Victaulic roll-groove spec, NPS 8: pipe OD 8.625\" Sch 10S (ASME B36.19M, wall 0.148\"), gasket seat A 0.75\", groove width B 0.469\", groove Ø8.441\" (groove approximated as a square revolved notch); 1\" of pipe past the groove, 0.5\" cone to the tube OD, 0.25\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "bwp",
      "size_code": 800,
      "length_in": 3,
      "max_od_in": 8.625,
      "profile": [
        [
          0,
          4.3125
        ],
        [
          2,
          4.3125
        ],
        [
          2.5,
          4
        ],
        [
          3,
          4
        ]
      ],
      "bore_in": 8.329,
      "mass_lb": 3.158,
      "source": "draft: butt-weld pipe adapter, plain square end of NPS 8 Sch 10S pipe (ASME B36.19M: OD 8.625\", wall 0.148\"), 2\" of pipe, 0.5\" cone to the tube OD, 0.5\" weld land. Draft.",
      "verified": false
    },
    {
      "code": "cap",
      "size_code": 800,
      "length_in": 2.375,
      "max_od_in": 8,
      "profile": [
        [
          0,
          0
        ],
        [
          0.3333,
          2.2111
        ],
        [
          0.6667,
          2.9814
        ],
        [
          1,
          3.4641
        ],
        [
          1.3333,
          3.7712
        ],
        [
          1.6667,
          3.9441
        ],
        [
          2,
          4
        ],
        [
          2.375,
          4
        ]
      ],
      "bore_in": 0,
      "mass_lb": 2.296,
      "source": "draft: butt-weld end cap (closed end; bore_in 0), 2:1 ellipsoidal head on the tube OD/wall (depth OD/4 = 2\") + 0.375\" straight skirt to the weld line; cf. ASME B16.9 / BPE sanitary end caps. Draft.",
      "verified": false
    }
  ]
}

// shared/cpq/dimensions/materials.json
export const MATERIALS_TABLE: MaterialsTable = {
  "version": "2026-10-16-draft",
  "status": "draft: pending Houston sign-off (H2)",
  "units": "in",
  "alloys": [
    {
      "value": "T304L",
      "digit": "4",
      "label": "T304L",
      "density_lb_per_in3": 0.289
    },
    {
      "value": "T316L",
      "digit": "6",
      "label": "T316L",
      "density_lb_per_in3": 0.29
    }
  ]
}

// shared/cpq/dimensions/bom-templates.json
export const BOM_TEMPLATES_TABLE: BomTemplatesTable = {
  "version": "2026-10-18-cardinal-draft",
  "status": "draft: SKU families checked against the live catalog 2026-10-18; rules pending Todd",
  "units": "in",
  "notes": [
    "A role's `patterns` build the candidate SKUs for one line, in order of preference. The resolver takes the first candidate that exists as a published variant (plan B1).",
    "Placeholders: {d} alloy digit (4 = 304L, 6 = 316L), {s} size token (nominal × 100, 3 digits: 050, 150, 1000), {sr} the ranged size token from size_ranges (13MHHM-100-150 covers 1\" and 1-1/2\"), {s2} a second size token (reducers).",
    "A pattern whose {sr} has no range at that size is skipped. An empty `patterns` list means no stocked SKU exists: the line can never resolve and the configuration is Quote (B1). Adding the SKU to the store and its pattern here turns the line Instant with no other code change.",
    "Valves, clamps and gaskets have no alloy variants: valves are 316 bodies, clamps T304, gaskets elastomer/PTFE.",
    "`material` is the fixed material of a SKU family that does not follow the configuration's alloy (clamps T304, strainers T316L). The BOM line names it and the Spec Block reads it from the line.",
    "kit_rules drive the CDU Hookup Kit BOM (spec 'BOM rules'): per CDU, per port."
  ],
  "size_ranges": {
    "100": "100-150",
    "150": "100-150",
    "050": "050-075",
    "075": "050-075"
  },
  "roles": [
    {
      "role": "ferrule",
      "label": "TC ferrule, long weld",
      "patterns": [
        "14AM7{d}-{s}",
        "14WMP{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: long-clamp-ferrule 14AM76-* (T316L, 13 sizes 050–1200) / 14AM74-* (T304, 11 sizes 100–1200); short-weld-clamp-ferrules 14WMP6-* / 14WMP4-* (13 sizes 050–1200)",
      "verified": false
    },
    {
      "role": "clamp",
      "label": "Heavy-duty single-pin clamp, wing nut",
      "patterns": [
        "13MHHM-{s}",
        "13MHHM-{sr}"
      ],
      "material": "T304",
      "source": "live catalog 2026-10-18: single-pin-heavy-duty-clamp-with-wing-nut 13MHHM-* (T304): 050-075, 100-150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200 (1\" and 1-1/2\" share 13MHHM-100-150)",
      "verified": false
    },
    {
      "role": "gasket_epdm",
      "label": "TC gasket, EPDM (peroxide-cured)",
      "patterns": [
        "GTCE-{s}"
      ],
      "source": "live catalog 2026-10-18: clamp-gasket GTCE-* (EPDM, 12 sizes 050–1200). Default per plan B12 until Todd confirms the glycol-loop gasket.",
      "verified": false
    },
    {
      "role": "gasket_sil",
      "label": "TC gasket, white silicone",
      "patterns": [
        "GTCSW-{s}"
      ],
      "source": "live catalog 2026-10-18: clamp-gasket GTCSW-* (white silicone, 12 sizes 050–1200)",
      "verified": false
    },
    {
      "role": "gasket_ptfe",
      "label": "TC gasket, PTFE",
      "patterns": [
        "GTCT-{s}"
      ],
      "source": "live catalog 2026-10-18: clamp-gasket GTCT-* (PTFE, 12 sizes 050–1200)",
      "verified": false
    },
    {
      "role": "valve_bfv",
      "label": "TC butterfly valve, 316, EPDM seat, pull handle",
      "patterns": [
        "TCBFN6-{s}"
      ],
      "source": "backend/src/scripts/import-clamp-butterfly-valves.ts (TCBFN6-###). NOT on the live catalog 2026-10-18: only the actuated TCBFESR/TCBFVSR and the weld-end BWBFN6 are published, so this line resolves Quote until TCBFN6 is published.",
      "verified": false
    },
    {
      "role": "valve_bv",
      "label": "TC 3-piece ball valve, 316, PTFE seats, locking handle",
      "patterns": [
        "TCBVS-{s}"
      ],
      "source": "live catalog 2026-10-18: clamp-3-pce-ball-valve TCBVS-* (050, 075, 100, 150, 200, 250, 300, 400)",
      "verified": false
    },
    {
      "role": "adapter_fl150",
      "label": "TC × 150# flange adapter",
      "patterns": [
        "FLGTC{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: clamp-x-150-ff-flange-adapters FLGTC6-* / FLGTC4-* (100–1200)",
      "verified": false
    },
    {
      "role": "adapter_npt",
      "label": "TC × NPT adapter",
      "patterns": [
        "22MP{d}-{s}",
        "21MP{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: female-npt-clamp-adapter 22MP6-* / 22MP4-* (same-size 050–400, plus reducing codes like 22MP6-150100). Female NPT first: it mates with threaded facility pipe. No 21MP (TC × male NPT) is on the site (male-npt-x-weld-end-adapter has no variants).",
      "verified": false
    },
    {
      "role": "adapter_mnpt",
      "label": "TC × male NPT adapter",
      "patterns": [
        "21MP{d}-{s}"
      ],
      "source": "family named in the plan (21MP6-*); none published on the live catalog 2026-10-18",
      "verified": false
    },
    {
      "role": "adapter_fnpt",
      "label": "TC × female NPT adapter",
      "patterns": [
        "22MP{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: female-npt-clamp-adapter 22MP6-* / 22MP4-*",
      "verified": false
    },
    {
      "role": "adapter_bwp",
      "label": "TC × Sch 10S butt-weld adapter",
      "patterns": [
        "19MPX{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: clamp-x-schedule-10s-weld-adapters 19MPX6-* (050–600) / 19MPX4-* (100–400)",
      "verified": false
    },
    {
      "role": "adapter_grv",
      "label": "TC × IPS grooved adapter",
      "patterns": [],
      "source": "no TC × grooved adapter on the live catalog 2026-10-18 (B1: resolves Quote)",
      "verified": false
    },
    {
      "role": "adapter_fl300",
      "label": "TC × 300# flange adapter",
      "patterns": [],
      "source": "no TC × 300# flange adapter on the live catalog 2026-10-18 (B1: resolves Quote)",
      "verified": false
    },
    {
      "role": "adapter_dn",
      "label": "DIN 11853-2 hygienic flange × TC adapter",
      "patterns": [],
      "source": "no hygienic (DIN 11853-2) flange adapter on the live catalog 2026-10-18 (B1: resolves Quote)",
      "verified": false
    },
    {
      "role": "strainer",
      "label": "Inline TC strainer",
      "patterns": [],
      "material": "T316L",
      "source": "no strainer on the live catalog 2026-10-18 (only y-ball check valves 45BY6); B1: resolves Quote",
      "verified": false
    },
    {
      "role": "hose",
      "label": "Stainless braided hose assembly, TC ends",
      "patterns": [],
      "source": "no braided hose assemblies on the live catalog 2026-10-18 (only rubber/tygon hose adapters 14MPHR/14MPHT); B1: resolves Quote",
      "verified": false
    },
    {
      "role": "cap_tc",
      "label": "TC solid end cap",
      "patterns": [
        "16AMP{d}-{s}",
        "16AMP{d}-{sr}"
      ],
      "source": "live catalog 2026-10-18: solid-clamp-end-cap 16AMP6-* (050-075, 100-150, 200–1200) / 16AMP4-* (200–1200)",
      "verified": false
    },
    {
      "role": "cap_weld",
      "label": "Butt-weld polished end cap",
      "patterns": [
        "16W{d}P-{s}"
      ],
      "source": "live catalog 2026-10-18: polished-end-cap 16W6P-* / 16W4P-* (100–800)",
      "verified": false
    },
    {
      "role": "reducer_tc",
      "label": "TC concentric reducer",
      "patterns": [
        "3114MP{d}-{s}{s2}"
      ],
      "source": "live catalog 2026-10-18: tri-clamp-concentric-reducer 3114MP6-* / 3114MP4-* (large size first, e.g. 3114MP6-200150)",
      "verified": false
    },
    {
      "role": "ferrule_mil",
      "label": "Male I-Line ferrule",
      "patterns": [
        "14WI{d}-{s}",
        "14WLI{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: short-male-i-line-ferrule 14WI6-*/14WI4-*, long-male-i-line-ferrule 14WLI6-*",
      "verified": false
    },
    {
      "role": "ferrule_fil",
      "label": "Female I-Line ferrule",
      "patterns": [
        "15WI{d}-{s}",
        "15WLI{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: female-short-weld-i-line-ferrules 15WI6-*/15WI4-*, long-female-i-line-ferrule 15WLI6-*",
      "verified": false
    },
    {
      "role": "ferrule_pbs",
      "label": "Plain bevel seat ferrule",
      "patterns": [
        "14A{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: long-plain-bevel-seat-ferrule 14A6-*/14A4-*",
      "verified": false
    },
    {
      "role": "ferrule_tbs",
      "label": "Threaded bevel seat ferrule",
      "patterns": [
        "15A{d}-{s}"
      ],
      "source": "live catalog 2026-10-18: long-threaded-bevel-seat-ferrule 15A6-*/15A4-*",
      "verified": false
    },
    {
      "role": "reducer_bw",
      "label": "Butt-weld concentric reducer",
      "patterns": [
        "31W{d}P-{s}{s2}"
      ],
      "source": "live catalog 2026-10-18: butt-weld-concentric-reducer 31W6P-*/31W4P-* (large size first, e.g. 31W6P-250100)",
      "verified": false
    },
    {
      "role": "end_fabricated",
      "label": "Fabricated end connection",
      "patterns": [],
      "source": "no tube-OD weld-on flange, NPT, grooved or pipe end is on the live catalog 2026-10-18 (150# pipe flanges P41/P61 are pipe-size; 38SL tube flanges are not B16.5): the shop makes or sources it",
      "verified": false
    },
    {
      "role": "doc",
      "label": "Documentation",
      "patterns": [],
      "source": "service line, priced on the quote",
      "verified": false
    },
    {
      "role": "tube",
      "label": "ASTM A270 sanitary tube",
      "patterns": [],
      "source": "fabricated line (cut from 20 ft sticks); AI270P tube is sold per stick, not per inch, so the cut length is never an Instant line",
      "verified": false
    }
  ],
  "kit_rules": {
    "ports_per_cdu": 2,
    "base_joints_per_port": 2,
    "joints_per_valve": 2,
    "joints_per_strainer": 2,
    "strainer_ports": 1,
    "spool_ferrules_per_port": 2,
    "far_tc_ferrules_per_port": 1,
    "spare_gasket_fraction": 0.1,
    "spare_clamps_per_kit": 1,
    "source": "cardinal-builder-spec.md 'BOM rules' table, literally: a valve or strainer adds 2 joints (2 clamps, 2 gaskets); base joints = CDU port ↔ run + run ↔ far end (or its adapter). Ferrules: 2 spool weld ends per hard-pipe run (hose ends come with the hose) + 1 for a tri-clamp facility end. Spares +10% gaskets rounded up, 1 clamp per kit.",
    "verified": false
  },
  "hose": {
    "stock_lengths_in": [
      24,
      36,
      48,
      72
    ],
    "source": "cardinal-builder-spec.md Page 4: Instant when the length is a stocked standard (24, 36, 48, 72 in)",
    "verified": false
  }
}

// shared/cpq/dimensions/assemblies.json
export const ASSEMBLIES_TABLE: AssembliesTable = {
  "version": "2026-10-18-cardinal-draft",
  "status": "draft: every value pending Todd; verified false",
  "units": "in",
  "notes": [
    "Dimensions and masses the builders use beyond the tube and End Connection tables: manifold layout rules, valve and strainer envelopes, hose data, reducer lengths, lead times and review limits.",
    "Masses in lb. Valve masses are the catalog variant weights (store convention: rounded up), so they run high."
  ],
  "stick_length_in": 240,
  "lead_time": {
    "stock": "Ships in 1–2 business days",
    "custom": "Custom production, 3–6 weeks",
    "quote_promise": "Firm quote within 1 business day, held 90 days",
    "source": "cardinal-builder-spec.md 'Pricing logic' and 'Shared components'",
    "verified": false
  },
  "components": {
    "clamp_mass_lb_base": 0.05,
    "clamp_mass_lb_per_in_od": 0.18,
    "gasket_mass_lb": 0.02,
    "source": "draft: heavy-duty single-pin clamp mass ≈ 0.05 + 0.18 × tube OD (lb), gasket ≈ 0.02 lb",
    "verified": false
  },
  "reducers": [
    {
      "size_code": 100,
      "length_in": 2,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 150,
      "length_in": 2.5,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 200,
      "length_in": 3,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 250,
      "length_in": 3.5,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 300,
      "length_in": 3.5,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 400,
      "length_in": 4,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 600,
      "length_in": 5.5,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    },
    {
      "size_code": 800,
      "length_in": 6,
      "source": "ASME B16.9 concentric reducer H, by the larger NPS (approx.)",
      "verified": false
    }
  ],
  "valves": [
    {
      "kind": "bv",
      "size_code": 50,
      "length_in": 2.75,
      "mass_lb": 2,
      "source": "TCBVS-050 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 75,
      "length_in": 3,
      "mass_lb": 3,
      "source": "TCBVS-075 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 100,
      "length_in": 3.5,
      "mass_lb": 3,
      "source": "TCBVS-100 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 150,
      "length_in": 4.25,
      "mass_lb": 6,
      "source": "TCBVS-150 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 200,
      "length_in": 4.75,
      "mass_lb": 10,
      "source": "TCBVS-200 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 250,
      "length_in": 6,
      "mass_lb": 20,
      "source": "TCBVS-250 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 300,
      "length_in": 7,
      "mass_lb": 32,
      "source": "TCBVS-300 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bv",
      "size_code": 400,
      "length_in": 8.5,
      "mass_lb": 45,
      "source": "TCBVS-400 catalog weight 2026-10-18; length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 100,
      "length_in": 3.25,
      "mass_lb": 3,
      "source": "BWBFN6-100 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 150,
      "length_in": 3.25,
      "mass_lb": 3,
      "source": "BWBFN6-150 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 200,
      "length_in": 3.25,
      "mass_lb": 4,
      "source": "BWBFN6-200 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 250,
      "length_in": 3.5,
      "mass_lb": 4,
      "source": "BWBFN6-250 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 300,
      "length_in": 3.5,
      "mass_lb": 5,
      "source": "BWBFN6-300 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 400,
      "length_in": 3.75,
      "mass_lb": 9,
      "source": "BWBFN6-400 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 600,
      "length_in": 4.5,
      "mass_lb": 18,
      "source": "BWBFN6-600 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    },
    {
      "kind": "bfv",
      "size_code": 800,
      "length_in": 5,
      "mass_lb": 23,
      "source": "BWBFN6-800 catalog weight 2026-10-18 (TCBFN6 not published); length draft",
      "verified": false
    }
  ],
  "strainer": {
    "body_od_factor": 1.6,
    "body_od_min_extra_in": 1,
    "short_length_factor": 4,
    "short_length_min_in": 8,
    "long_length_factor": 1.5,
    "screen_mass_lb_per_in2": 0.004,
    "mesh": [
      {
        "mesh": 20,
        "micron": 841
      },
      {
        "mesh": 40,
        "micron": 400
      },
      {
        "mesh": 100,
        "micron": 149
      }
    ],
    "dp_port_size_code": 50,
    "source": "draft envelope for a 316L inline TC basket strainer: body OD = max(1.6 × tube OD, tube OD + 1\"), short body face-to-face = max(8\", 4 × OD), long = 1.5 × short; mesh openings per ASTM E11 sieve sizes; DP ports = 2 × 1/2\" TC",
    "verified": false
  },
  "hoses": [
    {
      "size_code": 50,
      "lb_per_ft": 0.25,
      "rated_psi": 1000,
      "min_bend_radius_in": 4,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 75,
      "lb_per_ft": 0.4,
      "rated_psi": 800,
      "min_bend_radius_in": 5,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 100,
      "lb_per_ft": 0.6,
      "rated_psi": 600,
      "min_bend_radius_in": 6,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 150,
      "lb_per_ft": 0.9,
      "rated_psi": 450,
      "min_bend_radius_in": 8,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 200,
      "lb_per_ft": 1.3,
      "rated_psi": 350,
      "min_bend_radius_in": 10,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 250,
      "lb_per_ft": 1.8,
      "rated_psi": 300,
      "min_bend_radius_in": 12,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 300,
      "lb_per_ft": 2.4,
      "rated_psi": 250,
      "min_bend_radius_in": 14,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    },
    {
      "size_code": 400,
      "lb_per_ft": 3.6,
      "rated_psi": 200,
      "min_bend_radius_in": 18,
      "source": "draft: 316 annular corrugated hose, single 304 braid, 70 °F",
      "verified": false
    }
  ],
  "hose_covers": [
    {
      "cover": "braid",
      "label": "Stainless overbraid",
      "max_psi": null
    },
    {
      "cover": "silicone",
      "label": "Silicone cover",
      "max_psi": 150
    },
    {
      "cover": "ptfe",
      "label": "PTFE-lined, stainless overbraid",
      "max_psi": null
    }
  ],
  "tc_clamp_max_psi": [
    {
      "size_code": 50,
      "psi": 450
    },
    {
      "size_code": 75,
      "psi": 450
    },
    {
      "size_code": 100,
      "psi": 450
    },
    {
      "size_code": 150,
      "psi": 450
    },
    {
      "size_code": 200,
      "psi": 400
    },
    {
      "size_code": 250,
      "psi": 300
    },
    {
      "size_code": 300,
      "psi": 300
    },
    {
      "size_code": 400,
      "psi": 200
    }
  ],
  "manifold": {
    "rows": [
      {
        "header_code": 300,
        "end_allowance_in": 8,
        "drop_height_in": 6,
        "source": "draft: end allowance = header end → first drop centerline; drop height = header centerline → drop face",
        "verified": false
      },
      {
        "header_code": 400,
        "end_allowance_in": 8,
        "drop_height_in": 7,
        "source": "draft: end allowance = header end → first drop centerline; drop height = header centerline → drop face",
        "verified": false
      },
      {
        "header_code": 600,
        "end_allowance_in": 10,
        "drop_height_in": 9,
        "source": "draft: end allowance = header end → first drop centerline; drop height = header centerline → drop face",
        "verified": false
      },
      {
        "header_code": 800,
        "end_allowance_in": 12,
        "drop_height_in": 10,
        "source": "draft: end allowance = header end → first drop centerline; drop height = header centerline → drop face",
        "verified": false
      }
    ],
    "fill_size_code": 100,
    "drain_size_code": 50,
    "vent_size_code": 50,
    "instrument_size_code": 50,
    "instrument_ports": 2,
    "port_projection_in": 2.5,
    "min_pitch_clearance_in": 1.5,
    "hydro_test_psig": 150,
    "design_psig": 100,
    "source": "OCP TCS row manifold pre-commission guideline (rev Q): 304 minimum, inert-gas welding, ASTM A380 cleaning, 1\" sanitary fill points; port sizes from cardinal-builder-spec.md Page 2. Test/design pressure, allowances and heights are drafts for Todd.",
    "verified": false
  }
}
