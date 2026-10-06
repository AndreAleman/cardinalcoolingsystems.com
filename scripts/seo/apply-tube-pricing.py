"""Price the A270 tube product from Sanitube's October 2026 list (#39).

    python3 scripts/seo/apply-tube-pricing.py --dry-run            # show every change, write nothing
    python3 scripts/seo/apply-tube-pricing.py                      # apply, per-foot unit
    python3 scripts/seo/apply-tube-pricing.py --unit stick         # price and weigh per 20 ft stick
    python3 scripts/seo/apply-tube-pricing.py --margin 0.25        # different margin on selling price

Price = cost / (1 - margin). Weight (lb) = 10.93 * (OD - wall) * wall per foot, an estimate for the
120 lb freight rule. Reads admin credentials from backend/.env (or the main checkout's) like the other
scripts here. Idempotent: re-running updates the same variants to the same values.
"""
import argparse, json, os, pathlib, sys, urllib.request

HERE = pathlib.Path(__file__).parent; ROOT = HERE.parent.parent
B = os.environ.get("MEDUSA_BACKEND_URL", "https://backend-production-04a8.up.railway.app")
HANDLE = "id-od-pol-tube-a270-3a-import"
STICK_FT = 20
PRICED_AT = "2026-10"

# Sanitube list, Oct 2026: numeric SKU suffix -> (alloy option, size option, wall option, case ft, cost per ft)
LIST = {
    "4100": ("T304L", '1"', '0.065"', 300, 3.86), "4150": ("T304L", '1-1/2"', '0.065"', 300, 4.66),
    "4200": ("T304L", '2"', '0.065"', 300, 6.15), "4250": ("T304L", '2-1/2"', '0.065"', 300, 6.86),
    "4300": ("T304L", '3"', '0.065"', 200, 8.37), "4400": ("T304L", '4"', '0.083"', 100, 13.43),
    "4500": ("T304L", '5"', '0.083"', 80, 31.66), "4601": ("T304L", '6"', '0.109"', 40, 27.24),
    "4801": ("T304L", '8"', '0.109"', 20, 47.72),
    "6050": ("T316L", '1/2"', '0.065"', 300, 5.88), "6075": ("T316L", '3/4"', '0.065"', 300, 7.27),
    "6100": ("T316L", '1"', '0.065"', 300, 4.61), "6150": ("T316L", '1-1/2"', '0.065"', 300, 6.27),
    "6200": ("T316L", '2"', '0.065"', 300, 10.21), "6250": ("T316L", '2-1/2"', '0.065"', 300, 12.57),
    "6300": ("T316L", '3"', '0.065"', 200, 15.73), "6400": ("T316L", '4"', '0.083"', 100, 23.61),
    "6601": ("T316L", '6"', '0.109"', 40, 51.30), "6801": ("T316L", '8"', '0.109"', 20, 73.19),
    "61000": ("T316L", '10"', '0.109"', 20, 210.10), "61200": ("T316L", '12"', '0.109"', 20, 235.50),
}
SIZE_IN = {'1/2"': 0.5, '3/4"': 0.75, '1"': 1.0, '1-1/2"': 1.5, '2"': 2.0, '2-1/2"': 2.5, '3"': 3.0, '4"': 4.0, '5"': 5.0, '6"': 6.0, '8"': 8.0, '10"': 10.0, '12"': 12.0}

def env(k):
    if os.environ.get(k): return os.environ[k]
    for f in (ROOT / "backend/.env", ROOT.parent / "cardinalcoolingsystems.com/backend/.env"):
        if f.exists():
            for line in f.read_text().splitlines():
                if line.startswith(k + "="): return line.split("=", 1)[1].strip().strip('"')
    sys.exit(f"missing {k}")

def call(path, body=None, tok=None):
    req = urllib.request.Request(B + path, data=json.dumps(body).encode() if body is not None else None,
        headers={**({"Authorization": f"Bearer {tok}"} if tok else {}), "Content-Type": "application/json"}, method="POST" if body is not None else "GET")
    return json.load(urllib.request.urlopen(req, timeout=90))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--margin", type=float, default=0.30); ap.add_argument("--unit", choices=["ft", "stick"], default="ft")
    a = ap.parse_args(); mult = STICK_FT if a.unit == "stick" else 1
    tok = call("/auth/user/emailpass", {"email": env("MEDUSA_ADMIN_EMAIL"), "password": env("MEDUSA_ADMIN_PASSWORD")})["token"]
    p = call(f"/admin/products?handle={HANDLE}&fields=id,title,description,metadata,*variants,variants.id,variants.sku,variants.metadata,*variants.prices,*variants.options", tok=tok)["products"][0]
    by_suffix = {(v["sku"] or "").split("-")[-1]: v for v in p["variants"]}
    update, create = [], []
    print(f"{'SKU':14} {'variant':24} {'cost/ft':>8} {'price/'+a.unit:>11} {'lb/'+a.unit:>8}  action")
    for suf, (alloy, size, wall, case_ft, cost) in LIST.items():
        price = round(cost / (1 - a.margin) * mult, 2)
        wall_in = float(wall.strip('"')); od = SIZE_IN[size]
        weight = round(10.93 * (od - wall_in) * wall_in * mult, 2)
        meta = {"unit": a.unit, "cost_per_ft": cost, "case_qty_ft": case_ft, "sanitube_sku": f"A270P-{suf}", "priced_at": PRICED_AT, "margin": a.margin}
        v = by_suffix.get(suf)
        label = f"{alloy}, {size}, {wall}"
        if v:
            cur_wall = next((o["value"] for o in v.get("options", []) if o.get("value", "").endswith('"') and "." in o.get("value", "")), None)
            usd = next((pr for pr in v.get("prices", []) if pr["currency_code"] == "usd"), None)
            row = {"id": v["id"], "prices": [({"id": usd["id"]} if usd else {}) | {"currency_code": "usd", "amount": price}], "weight": weight,
                   "manage_inventory": False, "metadata": {**(v.get("metadata") or {}), **meta}}
            note = "update"
            if cur_wall and cur_wall != wall:
                row["options"] = {"Alloy": alloy, "Size (Tube OD)": size, "Wall": wall}; note += f" (wall {cur_wall}→{wall})"
            update.append(row)
        else:
            create.append({"title": label, "sku": f"AI270P-{suf}", "options": {"Alloy": alloy, "Size (Tube OD)": size, "Wall": wall},
                           "prices": [{"currency_code": "usd", "amount": price}], "weight": weight, "manage_inventory": False, "metadata": meta})
            note = "CREATE"
        print(f"{'AI270P-'+suf:14} {label:24} {cost:8.2f} {price:11.2f} {weight:8.2f}  {note}")
    unit_text = "by the foot" if a.unit == "ft" else "per 20 ft length"
    desc_note = f" Sold {unit_text}; supplied in 20 ft lengths. Ships freight from Kansas City, MO or Paramount, CA."
    desc = (p.get("description") or "").split(" Sold by the foot")[0].split(" Sold per 20 ft")[0] + desc_note
    print(f"\n{len(update)} variants to update, {len(create)} to create; margin {a.margin:.0%} on price; unit = {a.unit}")
    if a.dry_run: print("dry run only"); return
    r = call(f"/admin/products/{p['id']}/variants/batch", {"update": update, "create": create}, tok)
    print("batch:", {k: len(v) for k, v in r.items() if isinstance(v, list)})
    call(f"/admin/products/{p['id']}", {"description": desc, "metadata": {**(p.get("metadata") or {}), "unit": a.unit, "priced_at": PRICED_AT}}, tok)
    print("product description + metadata updated")

if __name__ == "__main__":
    main()
