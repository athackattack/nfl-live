# NFL Live

A single-file web app for live NFL scores, standings, game pages, and a Fantasy tab that tracks Sleeper and ESPN fantasy teams. Built as the NFL counterpart to NBA Live.

Live: https://athackattack.github.io/nfl-live/

- `index.html` – the built app (generated from `src/` by `build.py`).
- Data comes from ESPN's public scoreboard APIs and Sleeper's public API.
- Private ESPN fantasy leagues go through an optional read-only Cloudflare Worker (`espn-worker.js`, `wrangler.toml`). Your cookies live only as Worker secrets. See [ESPN-SETUP.md](ESPN-SETUP.md).
- `?mock=espn` loads sample ESPN data (`espn-mock.js`) for preview only.
