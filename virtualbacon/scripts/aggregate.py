import collections
import json
import pathlib
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.jsonl"
RESULTS = ROOT / "results"
FAILURES = ROOT / "failures"

def read_json(path):
    try:
        return json.loads(path.read_text())
    except Exception:
        return None

def main():
    catalog = [
        json.loads(line)
        for line in CATALOG.read_text().splitlines()
        if line.strip()
    ] if CATALOG.exists() else []

    result_rows = []
    for p in RESULTS.glob("*.json"):
        data = read_json(p)
        if data and data.get("status") == "analyzed":
            result_rows.append(data)

    failures = []
    for p in FAILURES.glob("*.json"):
        data = read_json(p)
        if data:
            failures.append(data)

    targets = [x for x in catalog if x.get("tab") in {"shorts", "streams"}]
    done_ids = {x["video_id"] for x in result_rows}
    pending = [x for x in targets if x["id"] not in done_ids]

    category_totals = collections.Counter()
    rule_true = collections.Counter()
    asset_counts = collections.Counter()
    method_counts = collections.Counter()
    tab_done = collections.Counter()
    action_totals = collections.Counter()

    for row in result_rows:
        analysis = row.get("analysis") or {}
        method_counts[row.get("source_method") or "unknown"] += 1
        tab_done[row.get("tab") or "unknown"] += 1
        for key, value in (analysis.get("category_counts") or {}).items():
            category_totals[key] += int(value or 0)
        for key, value in (analysis.get("rule_flags") or {}).items():
            if value:
                rule_true[key] += 1
        for asset in analysis.get("assets") or []:
            asset_counts[asset] += 1
        for action, count in (analysis.get("action_counts") or {}).items():
            action_totals[action] += int(count or 0)

    progress = {
        "updated_at": int(time.time()),
        "catalog_total": len(catalog),
        "target_total_shorts_streams": len(targets),
        "analyzed_total": len(result_rows),
        "analyzed_by_tab": dict(tab_done),
        "pending_total": len(pending),
        "failure_records": len(failures),
        "completion_pct": round(
            (len(result_rows) / len(targets) * 100) if targets else 0, 2
        ),
    }
    (ROOT / "progress.json").write_text(
        json.dumps(progress, indent=2, ensure_ascii=False)
    )

    patterns = {
        "updated_at": int(time.time()),
        "videos_analyzed": len(result_rows),
        "source_methods": dict(method_counts),
        "category_occurrences": dict(category_totals.most_common()),
        "rule_video_counts": dict(rule_true.most_common()),
        "asset_video_counts": dict(asset_counts.most_common()),
        "action_occurrences": dict(action_totals.most_common()),
    }
    (ROOT / "strategy_patterns.json").write_text(
        json.dumps(patterns, indent=2, ensure_ascii=False)
    )
    print(json.dumps(progress, indent=2))

if __name__ == "__main__":
    main()
