import base64, json, pathlib, re
R = pathlib.Path(__file__).parent
L = R / 'logos'

def b64(p, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(p.read_bytes()).decode()

logos = {
    'cbs': b64(L / 'CBS_logo.svg', 'image/svg+xml'),
    'fox': b64(L / 'Fox_Broadcasting_Company_logo_(2019).svg', 'image/svg+xml'),
    'nbc': b64(L / 'NBC_logo.svg', 'image/svg+xml'),
    'netflix': b64(L / 'Netflix_2015_logo.svg', 'image/svg+xml'),
    'youtube': b64(L / 'YouTube_Logo_2017.svg', 'image/svg+xml'),
    'nfl': b64(L / 'nfl_s.png', 'image/png'),
}
# ESPN / ABC / Prime marks are data-URIs carried in the built page (or the NBA source, when present).
blobs = []
nba = pathlib.Path('/workspace/nba-scoreboard/league.html')
if nba.exists():
    blobs.append(nba.read_text(errors='ignore'))
built = R / 'index.html'
if built.exists():
    blobs.append(built.read_text(errors='ignore'))
for k in ['espn', 'abc', 'prime']:
    found = None
    for blob in blobs:
        m = re.search(r'"' + k + r'"\s*:\s*"(data:[^"]+)"', blob) or re.search(k + r"\s*:\s*'(data:[^']+)'", blob)
        if m:
            found = m.group(1)
            break
    if found:
        logos[k] = found
    else:
        print('missing', k)
js = (R / 'src/app.js').read_text().replace('/*LOGOS*/{}', json.dumps(logos))
css = (R / 'src/style.css').read_text()
s = (R / 'src/shell.html').read_text().replace('/*CSS*/', css).replace('/*JS*/', js)
(R / 'index.html').write_text(s)
print(len(s), sorted(logos), {k: len(v) for k, v in logos.items()})
