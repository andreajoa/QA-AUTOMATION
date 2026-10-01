# VirtualBacon Research Pipeline

Automated research pipeline for the public VirtualBacon YouTube channel.

## Goals
- Catalog every public upload.
- Process Shorts and livestreams not already covered by the long-form corpus.
- Prefer public captions when available.
- Fall back to temporary audio transcription on a GitHub-hosted runner.
- Extract structured trading-strategy evidence.
- Keep checkpoints so later scheduled runs continue automatically.

## Output
`results/<video_id>.json` contains derived analysis only.
`progress.json` reports coverage.
`strategy_patterns.json` aggregates recurring patterns.

This workflow is for research only.
