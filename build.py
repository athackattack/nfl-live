import base64, json, pathlib, re
R = pathlib.Path(__file__).parent
L = R / 'logos'

def b64(p, mime):
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()

logos = {
    'cbs': b64(L / 'CBS_logo.svg', 'image/svg+xml'),
    'fox': b64(L / 'Fox_Broadcasting_Company_logo_(2019).svg', 'image/svg+xml'),
    'nbc': b64(L / 'NBC_logo.svg', 'image/svg+xml'),
    'netflix': b64(L / 'Netflix_2015_logo.svg', 'image/svg+xml'),
    'youtube': b64(L / 'YouTube_Logo_2017.svg', 'image/svg+xml'),
    'nfl': b64(L / 'nfl_s.png', 'image/png'),
}

def pull(text):
    m = re.search(r'const LOGO=(\{.*?\});', text)
    if not m:
        return {}
    try:
        return json.loads(m.group(1))
    except Exception:
        return {}

# espn / abc / prime are embedded data URIs. Prefer a sibling NBA build when
# present, otherwise keep the copies already shipped in index.html.
for src in (pathlib.Path('/workspace/nba-scoreboard/league.html'), R / 'index.html'):
    if src.exists():
        found = pull(src.read_text())
        for k in ('espn', 'abc', 'prime'):
            if k not in logos and found.get(k):
                logos[k] = found[k]

missing = [k for k in ('espn', 'abc', 'prime') if k not in logos]
if missing:
    raise SystemExit('missing logos: ' + ', '.join(missing))

js = (R / 'src/app.js').read_text().replace('/*LOGOS*/{}', json.dumps(logos, separators=(',', ':')))
html = (R / 'src/shell.html').read_text().replace('/*CSS*/', (R / 'src/style.css').read_text()).replace('/*JS*/', js)
(R / 'index.html').write_text(html)
print(len(html), sorted(logos))
