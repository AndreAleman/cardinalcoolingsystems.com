"""Patch blog post titles in Sanity from retitles.json (#27). Merged/moved posts are left untouched;
unpublish those only after the 301s in next.config.js are deployed.
Run: python3 scripts/seo/apply-retitles-sanity.py [--dry-run]  (reads SANITY_API_WRITE_TOKEN from storefront/.env.local)"""
import json, os, sys, urllib.request, urllib.parse, pathlib
HERE = pathlib.Path(__file__).parent; ROOT = HERE.parent.parent
PID, DS = "kgdlucjs", "production"; API = f"https://{PID}.api.sanity.io/v2024-01-01/data"
ENV_FILES = [ROOT / "storefront/.env.local", ROOT.parent / "cardinalcoolingsystems.com/storefront/.env.local"]  # worktrees lack the gitignored .env.local
tok = os.environ.get("SANITY_API_WRITE_TOKEN") or next((l.split("=", 1)[1].strip().strip('"') for f in ENV_FILES if f.exists() for l in f.read_text().splitlines() if l.startswith("SANITY_API_WRITE_TOKEN=")), None) or sys.exit("missing SANITY_API_WRITE_TOKEN")
dry = "--dry-run" in sys.argv
q = urllib.parse.quote("*[_type=='post']{_id,title,'slug':slug.current}")
posts = json.load(urllib.request.urlopen(urllib.request.Request(f"{API}/query/{DS}?query={q}", headers={"Authorization": f"Bearer {tok}"}), timeout=60))["result"]
byslug = {}
for p in posts: byslug.setdefault(p["slug"], []).append(p)
patches = []
for r in json.load(open(HERE / "retitles.json")):
    if not r["path"].startswith("blog/") or not r["title"] or r["action"].startswith(("Merge", "Move")): continue
    for p in byslug.get(r["path"].split("/", 1)[1], []):
        if p["title"].strip() != r["title"]:
            print(f"  {p['_id']}: {p['title']!r} -> {r['title']!r}"); patches.append({"patch": {"id": p["_id"], "set": {"title": r["title"]}}})
print("patches:", len(patches))
if dry or not patches: sys.exit(0)
req = urllib.request.Request(f"{API}/mutate/{DS}?returnIds=true", data=json.dumps({"mutations": patches}).encode(), headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
print("mutated:", len(json.load(urllib.request.urlopen(req, timeout=60)).get("results", [])))
