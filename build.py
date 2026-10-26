import base64,json,pathlib,shutil
R=pathlib.Path(__file__).parent;L=R/'logos'
NBA=open('/workspace/nba-scoreboard/league.html').read()
def b64(p,mime):return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
logos={'cbs':b64(L/'CBS_logo.svg','image/svg+xml'),'fox':b64(L/'Fox_Broadcasting_Company_logo_(2019).svg','image/svg+xml'),'nbc':b64(L/'NBC_logo.svg','image/svg+xml'),
 'netflix':b64(L/'Netflix_2015_logo.svg','image/svg+xml'),'youtube':b64(L/'YouTube_Logo_2017.svg','image/svg+xml'),'nfl':b64(L/'nfl_s.png','image/png')}
import re
for k in ['espn','abc','prime']:
  m=re.search(k+r"\s*:\s*'(data:[^']+)'",NBA) or re.search(r'"'+k+r'"\s*:\s*"(data:[^"]+)"',NBA)
  if m: logos[k]=m.group(1)
  else: print('missing',k)
s=(R/'src/shell.html').read_text().replace('/*CSS*/',(R/'src/style.css').read_text()).replace('/*JS*/',(R/'src/app.js').read_text().replace('/*LOGOS*/{}',json.dumps(logos)))
(R/'league.html').write_text(s);(R/'iterations').mkdir(exist_ok=True);shutil.copy(R/'league.html',R/'iterations/league-v1.html')
print(len(s),sorted(logos))
