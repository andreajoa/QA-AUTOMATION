import argparse
import json
import pathlib
import re
import subprocess
import tempfile
import time

from analyze_text import analyze_text

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.jsonl"
RESULTS = ROOT / "results"
FAILURES = ROOT / "failures"
CONFIG = json.loads((ROOT / "config.json").read_text())

def transcript_api_text(video_id):
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    fetched = api.fetch(video_id, languages=["en"])
    parts = []
    for item in fetched:
        txt = getattr(item, "text", None)
        if txt:
            parts.append(txt)
    text = re.sub(r"\s+", " ", " ".join(parts)).strip()
    return text

def ytdlp_caption_text(video_url):
    with tempfile.TemporaryDirectory(prefix="vb-caption-") as td:
        out = str(pathlib.Path(td) / "%(id)s.%(ext)s")
        cmd = [
            "yt-dlp", "--skip-download",
            "--write-subs", "--write-auto-subs",
            "--sub-langs", "en,en-US,en-GB",
            "--sub-format", "json3",
            "--sleep-requests", "1",
            "--retries", "2",
            "--no-warnings",
            "-o", out,
            video_url,
        ]
        p = subprocess.run(cmd, text=True, capture_output=True, timeout=180)
        files = list(pathlib.Path(td).glob("*.json3"))
        if not files:
            raise RuntimeError("caption_unavailable:" + p.stderr[-700:])
        data = json.loads(files[0].read_text(errors="ignore"))
        chunks = []
        for event in data.get("events") or []:
            piece = "".join(
                seg.get("utf8", "")
                for seg in (event.get("segs") or [])
            ).strip()
            if piece:
                chunks.append(piece)
        return re.sub(r"\s+", " ", " ".join(chunks)).strip()

def get_text(row):
    video_id = row["id"]
    url = row.get("url") or f"https://www.youtube.com/watch?v={video_id}"
    errors = []
    try:
        text = transcript_api_text(video_id)
        if len(text.split()) >= 5:
            return text, "youtube_transcript_api"
    except Exception as exc:
        errors.append(f"api:{type(exc).__name__}:{exc}")
    try:
        text = ytdlp_caption_text(url)
        if len(text.split()) >= 5:
            return text, "youtube_public_captions"
    except Exception as exc:
        errors.append(f"captions:{type(exc).__name__}:{exc}")
    raise RuntimeError(" | ".join(errors)[-1600:])

def load_catalog():
    return [
        json.loads(line)
        for line in CATALOG.read_text().splitlines()
        if line.strip()
    ]

def failure_attempts(video_id):
    path = FAILURES / f"{video_id}.json"
    if not path.exists():
        return 0
    try:
        return int(json.loads(path.read_text()).get("attempts", 0))
    except Exception:
        return 0

def save_failure(row, exc):
    FAILURES.mkdir(parents=True, exist_ok=True)
    payload = {
        "video_id": row["id"],
        "title": row.get("title"),
        "tab": row.get("tab"),
        "attempts": failure_attempts(row["id"]) + 1,
        "last_error": str(exc)[-1600:],
        "updated_at": int(time.time()),
    }
    (FAILURES / f"{row['id']}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2)
    )

def process_one(row):
    text, source = get_text(row)
    analysis = analyze_text(text)
    payload = {
        "video_id": row["id"],
        "title": row.get("title"),
        "url": row.get("url"),
        "tab": row.get("tab"),
        "duration_seconds": row.get("duration"),
        "status": "analyzed",
        "source_method": source,
        "processed_at": int(time.time()),
        "analysis": analysis,
    }
    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / f"{row['id']}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2)
    )
    fail = FAILURES / f"{row['id']}.json"
    if fail.exists():
        fail.unlink()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--minutes", type=int, default=75)
    parser.add_argument("--max-items", type=int, default=80)
    args = parser.parse_args()

    target_tabs = set(CONFIG.get("process_tabs") or ["shorts", "streams"])
    rows = [r for r in load_catalog() if r.get("tab") in target_tabs]
    done = {p.stem for p in RESULTS.glob("*.json")}
    pending = [r for r in rows if r["id"] not in done]
    pending.sort(key=lambda r: (
        failure_attempts(r["id"]),
        0 if r.get("tab") == "streams" else 1,
        r.get("tab_index_newest_first", 10**9),
    ))

    started = time.monotonic()
    ok = 0
    for row in pending:
        if ok >= args.max_items:
            break
        if time.monotonic() - started >= args.minutes * 60:
            break
        try:
            process_one(row)
            ok += 1
            print("OK", row["id"], row.get("tab"), flush=True)
        except Exception as exc:
            save_failure(row, exc)
            print("FAIL", row["id"], str(exc)[-400:], flush=True)

    print(f"processed_this_run={ok} pending_before={len(pending)}")

if __name__ == "__main__":
    main()
