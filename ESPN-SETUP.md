# Connecting your 2 ESPN leagues to NFL Live

Both ESPN leagues ("153 Overlords" 1811214 and "We dem girlz" 421893485) are **private**. ESPN only
returns them with your login cookies (`espn_s2` + `SWID`). A web page can't attach those cookies
itself (and iPhone Safari blocks them), so the app talks to a tiny **private proxy you own** (free Cloudflare Worker).
Your cookies live only as encrypted Worker secrets — never in the app, GitHub, or chat.

## One-time setup (~10 min, on your PC)
1. **Get the two cookie values (keep them private — don't paste them to anyone, including bots):**
   Chrome → sign in at https://fantasy.espn.com → press F12 → *Application* tab → *Cookies* → `https://fantasy.espn.com`
   → copy the values of **espn_s2** and **SWID** (SWID includes the `{ }` braces).
2. Create a free account at https://dash.cloudflare.com (if you don't have one).
3. Install Node.js (LTS), then in a terminal in this folder (`nfl-scoreboard`):
   ```
   npx wrangler login
   npx wrangler secret put ESPN_S2      # paste espn_s2 when prompted
   npx wrangler secret put SWID         # paste SWID when prompted
   npx wrangler deploy
   ```
   Wrangler prints a URL like `https://nfl-live-espn.<you>.workers.dev`.
4. Open NFL Live → ⚙︎ Settings → **ESPN connection** → paste that URL into **ESPN data URL**. Done — both ESPN teams load on every device where you paste it.

## Notes
* Read-only: the Worker only does GET requests, only for the two league IDs in `wrangler.toml`, only for a fixed list of ESPN "views", and only answers pages from `athackattack.github.io` / localhost.
  (An Origin check isn't bulletproof — someone who learns the Worker URL could read these two leagues' data, but never your cookies or anything else on your account.)
* `espn_s2` expires about once a year or when you sign out of ESPN everywhere → repeat step 1 and `wrangler secret put ESPN_S2`.
* To revoke instantly: `npx wrangler delete` (or sign out of ESPN on all devices).
* "Try direct ESPN login" in Settings: on desktop Chrome while signed into ESPN, the page may load the leagues without the Worker. It won't work on iPhone.
* Dev preview with sample ESPN data: open `index.html?mock=espn` (or `league.html?mock=espn` locally) (labeled SAMPLE; never used otherwise).
