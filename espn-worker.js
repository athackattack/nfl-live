/**
 * NFL Live — private ESPN Fantasy read-only proxy (Cloudflare Worker).
 * Secrets (set with `wrangler secret put`, NEVER in code or the web app):  ESPN_S2, SWID
 * Plain vars (wrangler.toml [vars]):  LEAGUE_IDS="1811214,421893485"
 *                                     ALLOWED_ORIGINS="https://athackattack.github.io,http://localhost:8000"
 * Route: GET /league/{leagueId}?view=...&scoringPeriodId=...   (optional header x-fantasy-filter)
 */
const VIEWS = new Set(['mTeam','mRoster','mMatchup','mMatchupScore','mSettings','mStatus','mScoreboard','mStandings','kona_player_info','mBoxscore']);
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const cors = { 'Access-Control-Allow-Origin': ok ? origin : 'null', 'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'x-fantasy-filter', 'Access-Control-Max-Age': '86400' };
    if (req.method === 'OPTIONS') return new Response(null, { status: ok ? 204 : 403, headers: cors });
    if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: cors });
    if (!ok) return new Response('Forbidden origin', { status: 403, headers: cors });
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/league\/(\d{1,12})\/?$/);
    const leagues = (env.LEAGUE_IDS || '').split(',').map(s => s.trim());
    if (!m || !leagues.includes(m[1])) return new Response('Not found', { status: 404, headers: cors });
    const q = new URLSearchParams();
    for (const v of url.searchParams.getAll('view')) if (VIEWS.has(v)) q.append('view', v);
    const sp = url.searchParams.get('scoringPeriodId'); if (sp && /^\d{1,2}$/.test(sp)) q.set('scoringPeriodId', sp);
    const season = env.SEASON || '2026';
    const upstream = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${m[1]}?${q}`;
    const h = { 'Accept': 'application/json', 'Cookie': `espn_s2=${env.ESPN_S2}; SWID=${env.SWID}` };
    const ff = req.headers.get('x-fantasy-filter'); if (ff && ff.length < 2000) h['x-fantasy-filter'] = ff;
    const r = await fetch(upstream, { headers: h, cf: { cacheTtl: 15 } });
    if (!r.ok) return new Response(JSON.stringify({ error: 'ESPN ' + r.status }), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
    const d = await r.json();
    // Mark which team(s) belong to the cookie owner, then strip member details down to id + display name.
    const swid = String(env.SWID || '').toUpperCase();
    d._me = (d.teams || []).filter(t => (t.owners || []).some(o => String(o).toUpperCase() === swid)).map(t => t.id);
    if (Array.isArray(d.members)) d.members = d.members.map(x => ({ id: x.id, displayName: x.displayName }));
    return new Response(JSON.stringify(d), { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};
