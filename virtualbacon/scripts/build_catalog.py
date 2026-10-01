import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.jsonl"
CHANNEL = "https://www.youtube.com/@VirtualBacon"

def fetch_tab(tab):
    url = f"{CHANNEL}/{tab}"
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--no-warnings",
        url,
    ]
    raw = subprocess.check_output(cmd, text=True)
    data = json.loads(raw)
    rows = []
    for i, item in enumerate(data.get("entries") or []):
        if not item or not item.get("id"):
            continue
        rows.append({
            "id": item["id"],
            "title": item.get("title") or "",
            "duration": item.get("duration"),
            "url": item.get("url") or f"https://www.youtube.com/watch?v={item['id']}",
            "tab": tab,
            "tab_index_newest_first": i,
        })
    return rows

def main():
    merged = {}
    for tab in ("videos", "shorts", "streams"):
        for row in fetch_tab(tab):
            vid = row["id"]
            if vid not in merged:
                merged[vid] = row | {"source_tabs": [tab]}
            elif tab not in merged[vid]["source_tabs"]:
                merged[vid]["source_tabs"].append(tab)

    rows = list(merged.values())
    rows.sort(key=lambda x: (x.get("tab") or "", x.get("tab_index_newest_first", 10**9)))
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    with CATALOG.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"catalog={len(rows)}")

if __name__ == "__main__":
    main()
