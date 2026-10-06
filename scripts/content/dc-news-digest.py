#!/usr/bin/env python3
"""Daily data-center news digest for LinkedIn posts and blog op-eds.

Pulls the feeds below, keeps the last 3 days, scores each item for relevance to
liquid cooling / piping / AI power density, and writes a dated Markdown file to
~/Desktop/dc-news/. Run it each morning:

    python3 scripts/content/dc-news-digest.py            # last 3 days
    python3 scripts/content/dc-news-digest.py --days 7   # wider window

Feeds that fail are skipped and listed at the bottom of the digest.
"""
import argparse, datetime as dt, email.utils, html, pathlib, re, sys, urllib.request
import xml.etree.ElementTree as ET

FEEDS = {
    "Data Center Knowledge": "https://www.datacenterknowledge.com/rss.xml",
    "Data Center Dynamics": "https://www.datacenterdynamics.com/en/rss/news/",
    "Uptime Institute Journal": "https://journal.uptimeinstitute.com/feed/",
    "The Register (off-prem)": "https://www.theregister.com/off_prem/headlines.atom",
    "Electronics Cooling": "https://www.electronics-cooling.com/feed/",
    "ServeTheHome": "https://www.servethehome.com/feed/",
    "Vertiv news": "https://www.vertiv.com/en-us/about/news-and-insights/rss/",
}

# Weighted keywords: what a stainless-piping supplier can say something useful about.
KEYWORDS = {
    5: ["liquid cooling", "liquid-cooled", "direct-to-chip", "direct to chip", "cold plate", "cdu", "coolant distribution",
        "immersion cooling", "rear door heat exchanger", "manifold", "glycol", "coolant", "leak"],
    3: ["cooling", "thermal", "heat rejection", "chiller", "water usage", "wue", "dielectric", "piping", "stainless"],
    2: ["gb200", "gb300", "nvl72", "rack density", "kw per rack", "kw/rack", "mw", "gigawatt", "hyperscale", "ai data center",
        "ai factory", "blackwell", "rubin", "nvidia", "ocp", "open compute", "ashrae"],
    1: ["data center", "data centre", "colocation", "colo", "retrofit", "construction", "power"],
}

ATOM = "{http://www.w3.org/2005/Atom}"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (digest script)"})
    return urllib.request.urlopen(req, timeout=20).read()

def parse_date(s):
    if not s: return None
    try: return email.utils.parsedate_to_datetime(s)
    except Exception: pass
    try: return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception: return None

def items(xml_bytes):
    root = ET.fromstring(xml_bytes)
    out = []
    for it in root.iter("item"):  # RSS
        out.append({
            "title": (it.findtext("title") or "").strip(),
            "link": (it.findtext("link") or "").strip(),
            "date": parse_date(it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date")),
            "summary": re.sub(r"<[^>]+>", " ", html.unescape(it.findtext("description") or "")).strip(),
        })
    for e in root.iter(ATOM + "entry"):  # Atom
        link = e.find(ATOM + "link")
        out.append({
            "title": (e.findtext(ATOM + "title") or "").strip(),
            "link": (link.get("href") if link is not None else "").strip(),
            "date": parse_date(e.findtext(ATOM + "updated") or e.findtext(ATOM + "published")),
            "summary": re.sub(r"<[^>]+>", " ", html.unescape(e.findtext(ATOM + "summary") or e.findtext(ATOM + "content") or "")).strip(),
        })
    return out

def score(text):
    t = text.lower(); s = 0; hits = []
    for w, words in KEYWORDS.items():
        for k in words:
            if k in t: s += w; hits.append(k)
    return s, sorted(set(hits), key=lambda k: -len(k))[:5]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--days", type=int, default=3); ap.add_argument("--out", default=str(pathlib.Path.home() / "Desktop" / "dc-news"))
    a = ap.parse_args()
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=a.days)
    rows, failed = [], []
    for name, url in FEEDS.items():
        try:
            for it in items(fetch(url)):
                d = it["date"]
                if d is not None and d.tzinfo is None: d = d.replace(tzinfo=dt.timezone.utc)
                if d is not None and d < since: continue
                s, hits = score(it["title"] + " " + it["summary"])
                if s == 0: continue
                rows.append((s, name, it["title"], it["link"], d, hits, it["summary"][:240]))
        except Exception as e:
            failed.append(f"{name}: {type(e).__name__}: {e}")
    rows.sort(key=lambda r: -r[0])
    # Vendor feeds (Vertiv) are undated press releases that would otherwise crowd the top: cap each source.
    seen, capped = {}, []
    for r in rows:
        seen[r[1]] = seen.get(r[1], 0) + 1
        if seen[r[1]] <= 8: capped.append(r)
    rows = capped
    out_dir = pathlib.Path(a.out); out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{dt.date.today().isoformat()}.md"
    lines = [f"# Data center news digest — {dt.date.today().isoformat()} (last {a.days} days)", "",
             "Score = relevance to liquid cooling / piping / AI density. Pick one, write the Cardinal angle in two lines, post.", ""]
    for s, name, title, link, d, hits, summary in rows[:40]:
        when = d.strftime("%b %d") if d else "n/a"
        lines += [f"## [{s}] {title}", f"*{name} · {when} · {', '.join(hits)}*  ", f"<{link}>", "", summary, ""]
    if failed: lines += ["---", "Feeds that failed this run:"] + [f"- {f}" for f in failed]
    path.write_text("\n".join(lines))
    print(f"{len(rows)} relevant items from {len(FEEDS) - len(failed)}/{len(FEEDS)} feeds → {path}")
    for s, name, title, *_ in rows[:8]: print(f"  [{s}] {title[:90]}  ({name})")
    if failed: print("failed:", *failed, sep="\n  ")

if __name__ == "__main__":
    sys.exit(main())
