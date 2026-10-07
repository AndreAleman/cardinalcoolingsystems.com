"""Set metadata.seo_title and metadata.h1 on production categories from retitles.json (#27).
Run: MEDUSA_ADMIN_EMAIL=... MEDUSA_ADMIN_PASSWORD=... python3 scripts/seo/apply-retitles-medusa.py [--dry-run]
Reads credentials from backend/.env when env vars are unset."""
import json, os, sys, urllib.request, pathlib
HERE = pathlib.Path(__file__).parent; ROOT = HERE.parent.parent
B = os.environ.get("MEDUSA_BACKEND_URL", "https://backend-production-04a8.up.railway.app")
ENV_FILES = [ROOT / "backend/.env", ROOT.parent / "cardinalcoolingsystems.com/backend/.env"]  # worktrees lack the gitignored .env
def env(k):
    if os.environ.get(k): return os.environ[k]
    for f in ENV_FILES:
        if not f.exists(): continue
        for line in f.read_text().splitlines():
            if line.startswith(k + "="): return line.split("=", 1)[1].strip().strip('"')
    sys.exit(f"missing {k}: set it in the environment or in {ENV_FILES[0]}")
dry = "--dry-run" in sys.argv
def call(path, body=None, tok=None):
    req = urllib.request.Request(B + path, data=json.dumps(body).encode() if body else None,
        headers={**({"Authorization": f"Bearer {tok}"} if tok else {}), "Content-Type": "application/json"}, method="POST" if body else "GET")
    return json.load(urllib.request.urlopen(req, timeout=60))
tok = call("/auth/user/emailpass", {"email": env("MEDUSA_ADMIN_EMAIL"), "password": env("MEDUSA_ADMIN_PASSWORD")})["token"]
cats = call("/admin/product-categories?limit=200&fields=id,name,handle,metadata", tok=tok)["product_categories"]
byh = {c["handle"]: c for c in cats}
rows = json.load(open(HERE / "retitles.json"))
plan, missing = [], []
for r in rows:
    if not r["path"].startswith("categories/") or r["action"].startswith(("Noindex", "Move")): continue
    h = r["path"].split("/", 1)[1]; c = byh.get(h)
    if not c: missing.append(h); continue
    md = dict(c.get("metadata") or {}); new = {}
    if r["title"] and md.get("seo_title") != r["title"]: new["seo_title"] = r["title"]
    if r["h1"] and md.get("h1") != r["h1"]: new["h1"] = r["h1"]
    if new: plan.append((c["id"], h, md, new))
print("unresolved handles:", missing or "none"); print("categories to update:", len(plan))
if missing: sys.exit(1)
for cid, h, md, new in plan:
    print(f"  {h}: {new}")
    if dry: continue
    got = call(f"/admin/product-categories/{cid}", {"metadata": {**md, **new}}, tok)["product_category"]["metadata"]
    assert all(got.get(k) == v for k, v in new.items()), (h, got)
print("done" if not dry else "dry run only")
