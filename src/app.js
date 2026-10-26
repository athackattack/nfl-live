'use strict';
const API='https://site.api.espn.com/apis/site/v2/sports/football/nfl/';
const STAND='https://site.api.espn.com/apis/v2/sports/football/nfl/standings?level=3';
const SL='https://api.sleeper.app/v1',SLX='https://api.sleeper.app',SEASON=2026;
const ESPN_DIRECT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/'+SEASON+'/segments/0/leagues/';
/* Adam's 3 fantasy teams. League/team IDs are public identifiers, not credentials. */
const FT=[
 {key:'sl',plat:'sleeper',league:'1397614011826114560',roster:10,leagueName:'Tco fantasy football league 2026',short:'Tco 2026'},
 {key:'e1',plat:'espn',league:'1811214',team:3,teamName:"Treebeard's Ent Army",leagueName:'153 Overlords',short:'Ent Army'},
 {key:'e2',plat:'espn',league:'421893485',team:null,teamName:'Beaver First',leagueName:'We dem girlz',short:'Beaver First'}];
const SDEF={fav:'MIN',tab:'tS',rs:30,ns:false,theme:'dark',rm:false,tz:'America/Chicago',fteam:'all',espnUrl:'',espnDirect:false,haptics:true,alerts:true};
const SET=Object.assign({},SDEF,(()=>{try{return JSON.parse(localStorage.getItem('nflSettings')||'{}')||{}}catch(e){return{}}})());
const saveSet=()=>{try{localStorage.setItem('nflSettings',JSON.stringify(SET))}catch(e){}};
const MOCK=/[?&]mock=espn\b/.test(location.search);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let TZ='America/Chicago',TZL='CT';
function tzLabel(z){try{return new Intl.DateTimeFormat('en-US',{timeZone:z,timeZoneName:'short'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName').value.replace(/^C[SD]T$/,'CT').replace(/^E[SD]T$/,'ET').replace(/^M[SD]T$/,'MT').replace(/^P[SD]T$/,'PT')}catch(e){return ''}}
function setTZ(){TZ=SET.tz==='auto'?(Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Chicago'):SET.tz;TZL=tzLabel(TZ)}
const fmtTime=iso=>new Date(iso).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'})+' '+TZL;
const fmtDay=iso=>new Date(iso).toLocaleDateString('en-US',{timeZone:TZ,weekday:'long',month:'short',day:'numeric'});
const fmtShort=iso=>new Date(iso).toLocaleDateString('en-US',{timeZone:TZ,weekday:'short',month:'numeric',day:'numeric'});
const normName=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g,'').replace(/[^a-z]/g,'');
const f1=x=>x==null||isNaN(x)?'—':(+x).toFixed(1),f2=x=>x==null||isNaN(x)?'—':(+x).toFixed(2);
const SLA={WAS:'WSH',JAC:'JAX',LA:'LAR',OAK:'LV',SD:'LAC'};const nTeam=a=>SLA[a]||a; // Sleeper -> ESPN abbr
const ESPN_PRO={1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};
const ESPN_POS={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'DEF'};
const ESPN_SLOT={0:'QB',1:'TQB',2:'RB',3:'RB/WR',4:'WR',5:'WR/TE',6:'TE',7:'SFLX',16:'DEF',17:'K',20:'BN',21:'IR',23:'FLEX'};
const SLOT_ORD=['QB','RB','WR','TE','FLEX','RB/WR','WR/TE','SFLX','K','DEF'];
const POSC={QB:'#ff6f91',RB:'#5ee6b4',WR:'#5bb4ff',TE:'#ffae42',K:'#c18cff',DEF:'#9aa6bd',FLEX:'#e0e6f0',SFLX:'#ff9fb6',BN:'#3a4766',IR:'#5a3a3a','RB/WR':'#9be3d0','WR/TE':'#ffd29a'};
const teamLogo=a=>`https://a.espncdn.com/i/teamlogos/nfl/500/${String(a||'').toLowerCase()}.png`;
const injPill=s=>{if(!s)return'';const u=String(s).toUpperCase();const k=u.startsWith('Q')?'Q':u.startsWith('D')?'D':u.startsWith('O')?'O':u.startsWith('I')||u==='INJURY_RESERVE'?'IR':u.startsWith('S')?'SUS':'';return k&&u!=='ACTIVE'&&u!=='NORMAL'?`<span class="inj ${k}">${k}</span>`:''};
/* ---------- network logos (official national broadcasters / streamers only) ---------- */
const LOGO=/*LOGOS*/{};
const WATCH=[[/^CBS/i,'CBS · Paramount+','https://www.paramountplus.com/live-tv/','cbs'],[/^FOX/i,'FOX · Fox One','https://www.foxsports.com/live','fox'],[/^NBC$|peacock/i,'NBC · Peacock','https://www.peacocktv.com/sports/nfl','nbc'],
 [/^ESPN2?$|^ESPN\+$/i,'ESPN','https://www.espn.com/watch/','espn'],[/^ABC$/i,'ABC · ESPN app','https://www.espn.com/watch/','abc'],[/prime/i,'Prime Video','https://www.amazon.com/gp/video/storefront/','prime'],
 [/^NFL ?Net/i,'NFL Network · NFL+','https://www.nfl.com/plus/','nfl','NET'],[/netflix/i,'Netflix','https://www.netflix.com/','netflix'],[/youtube/i,'YouTube','https://tv.youtube.com/','youtube']];
function watchHTML(g){const a='target="_blank" rel="noopener noreferrer"',seen=new Set(),out=[];
  for(const n of g.tv){const m=WATCH.find(w=>w[0].test(n));if(!m||seen.has(m[3])||!LOGO[m[3]])continue;if(m[3]==='abc'&&seen.has('espn'))continue;seen.add(m[3]);if(m[3]==='espn')seen.add('abc');
    out.push(`<a class="wb" ${a} href="${m[2]}" title="Watch on ${esc(m[1])}" aria-label="Watch on ${esc(m[1])}"><img src="${LOGO[m[3]]}" alt="">${m[4]?`<i>${m[4]}</i>`:''}</a>`)}
  return `<div class="watch">${out.join('')}</div>${g.link?`<a class="gp" ${a} href="${esc(g.link)}" title="ESPN game page" aria-label="ESPN game page"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/></svg></a>`:''}`}
/* ---------- scores ---------- */
function parseGame(e){const c=e.competitions[0],st=e.status||c.status,cs=c.competitors||[];
  const T=x=>({id:x.team.id,abbr:x.team.abbreviation,name:x.team.shortDisplayName||x.team.name,full:x.team.displayName,logo:x.team.logo||teamLogo(x.team.abbreviation),color:'#'+(x.team.color||'556070'),rec:(x.records||[]).find(r=>r.type==='total')?.summary||x.records?.[0]?.summary||'',score:x.score??'',winner:!!x.winner,ls:(x.linescores||[]).map(l=>l.displayValue??l.value)});
  const away=cs.find(x=>x.homeAway==='away')||cs[0],home=cs.find(x=>x.homeAway==='home')||cs[1];
  const tv=[];(c.broadcasts||[]).forEach(b=>(b.names||[]).forEach(n=>tv.push(n)));(c.geoBroadcasts||[]).forEach(b=>{const n=b.media?.shortName;if(n&&b.market?.type!=='Home'&&b.market?.type!=='Away')tv.push(n)});
  const s=c.situation;const state=st.type.state;
  return {id:e.id,date:e.date,state,status:state==='pre'?(st.type.name==='STATUS_POSTPONED'?'Postponed':fmtTime(e.date)):st.type.shortDetail,teams:[T(away),T(home)],tv:[...new Set(tv)],
    sit:state==='in'&&s?{dd:s.downDistanceText||'',poss:s.possession,rz:s.isRedZone,last:s.lastPlay?.text||''}:null,link:(e.links||[]).find(l=>(l.rel||[]).includes('summary'))?.href||'',venue:c.venue?.fullName||'',odds:c.odds?.[0]?.details||'',period:st.period,clock:st.clock};}
function gameRem(g){if(!g)return 1;if(g.state==='post')return 0;if(g.state==='pre')return 1;const p=g.period||1,c=+g.clock||0;return p>4?0.03:Math.max(0,Math.min(1,((4-p)*900+c)/3600))}
const EYE='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EMPTY_IC='<svg class="emptyic" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="32" rx="26" ry="16" transform="rotate(-32 32 32)" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M20 44 44 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M26.5 33l4.6 4.6M30.5 29l4.6 4.6M34.5 25l4.6 4.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
function emptyMsg(title,sub){return `<div class="msg">${EMPTY_IC}<b>${title}</b>${sub?`<small>${sub}</small>`:''}</div>`}
function accent(hex){let h=String(hex||'#5c6b80').replace('#','');if(h.length===3)h=h.replace(/./g,c=>c+c);const n=parseInt(h.slice(0,6),16);if(!Number.isFinite(n))return '#5c6b80';let r=n>>16&255,g=n>>8&255,b=n&255;const L=(.2126*r+.7152*g+.0722*b)/255;if(L<.22){const m=.55;r=Math.round(r+(255-r)*m);g=Math.round(g+(255-g)*m);b=Math.round(b+(255-b)*m)}return `rgb(${r},${g},${b})`}
function renderCard(g,open,S,myTeams){const [a,h]=g.teams,show=g.state!=='pre';
  const tr=t=>`<div class="tm ${g.state==='post'?(t.winner?'w':'lo'):''}"><img src="${esc(t.logo)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div class="nm"><b>${esc(t.name)}${SET.fav===t.abbr?'<span class="favtag">FAV</span>':''}${myTeams.has(t.abbr)?'<span class="star" title="You have fantasy players in this game">⭐</span>':''}${g.sit&&g.sit.poss===t.id?'<span class="pos" title="Possession">🏈</span>':''}</b><small>${esc(t.rec)}</small></div><div class="sc" data-k="s:${g.id}:${esc(t.abbr)}" data-sv="${show?esc(t.score):''}">${show?esc(t.score):''}</div></div>`;
  const sit=g.sit?`<div class="sit">${esc(g.sit.dd)}${g.sit.rz?' · <b class="rz">RED ZONE</b>':''}${g.sit.last?`<br><small>${esc(g.sit.last)}</small>`:''}</div>`:'';
  return `<div class="card ${g.state} ${g.state==='in'?'live':''} ${open?'open':''} ${SET.fav&&g.teams.some(t=>t.abbr===SET.fav)?'fav':''} ${NSREV.has(g.id)?'rev':''}" data-id="${g.id}"><div class="rail" aria-hidden="true"><i style="background:${accent(a.color)}"></i><i style="background:${accent(h.color)}"></i></div><div class="hd"><div class="st"><span class="${g.state==='in'?'l':''}">${esc(g.status)}</span><span>${esc(g.state==='pre'?g.odds:'')}</span></div>${tr(a)}${tr(h)}${sit}</div><button class="nsrev" data-rev="${g.id}">${EYE} Reveal score</button><div class="det">${open?renderSummary(S,g):''}</div>${watchHTML(g)}</div>`}
function renderGames(events,openSet,sums,myTeams){const G=(events||[]).map(parseGame).sort((x,y)=>new Date(x.date)-new Date(y.date)||((SET.fav&&y.teams.some(t=>t.abbr===SET.fav))-(SET.fav&&x.teams.some(t=>t.abbr===SET.fav))));
  if(!G.length)return emptyMsg('No NFL games this week','Use the arrows to browse other weeks.');
  let out='',last='';for(const g of G){const d=fmtDay(g.date);if(d!==last){out+=`<div class="dayh">${esc(d)}</div>`;last=d}out+=renderCard(g,openSet.has(g.id),sums[g.id],myTeams)}return out}
function lineTable(g){const n=Math.max(g.teams[0].ls.length,g.teams[1].ls.length);if(!n)return'';const hd=[...Array(n)].map((_,i)=>`<th>${i<4?'Q'+(i+1):'OT'}</th>`).join('');
  return `<div class="tw"><table class="ls"><tr><th></th>${hd}<th>T</th></tr>${g.teams.map(t=>`<tr><td><b>${esc(t.abbr)}</b></td>${[...Array(n)].map((_,i)=>`<td>${esc(t.ls[i]??'')}</td>`).join('')}<td><b>${esc(t.score)}</b></td></tr>`).join('')}</table></div>`}
const BXCAT=['passing','rushing','receiving','kicking','defensive','interceptions','fumbles','kickReturns','puntReturns','punting'];
const BXLBL={passing:'Passing',rushing:'Rushing',receiving:'Receiving',kicking:'Kicking',defensive:'Defense',interceptions:'Interceptions',fumbles:'Fumbles',kickReturns:'Kick returns',puntReturns:'Punt returns',punting:'Punting'};
function renderSummary(S,g){if(!S)return '<div class="hint">Loading game details…</div>';const out=[];
  out.push(lineTable(g));
  const bt=S.boxscore?.teams||[];if(bt.length===2){const want=['Total Yards','Passing','Rushing','Turnovers','3rd down efficiency','Possession','Penalties','Sacks-Yards Lost'];
    const row=l=>{const a=bt[0].statistics.find(s=>s.label===l),b=bt[1].statistics.find(s=>s.label===l);return a&&b?`<div>${esc(a.displayValue)}</div><div class="lab">${esc(l)}</div><div class="r">${esc(b.displayValue)}</div>`:''};
    out.push(`<h3>Team stats</h3><div class="cmp"><div><b>${esc(bt[0].team.abbreviation)}</b></div><div></div><div class="r"><b>${esc(bt[1].team.abbreviation)}</b></div>${want.map(row).join('')}</div>`)}
  const sp=S.scoringPlays||[];if(sp.length)out.push(`<h3>Scoring</h3>${sp.map(p=>`<div class="drv"><b>${esc(p.team?.abbreviation||'')} · Q${esc(p.period?.number)} ${esc(p.clock?.displayValue||'')}</b><small>${esc(p.text)} (${esc(p.awayScore)}-${esc(p.homeScore)})</small></div>`).join('')}`);
  for(const tp of S.boxscore?.players||[]){const ab=tp.team?.abbreviation;const cats=BXCAT.map(n=>tp.statistics.find(s=>s.name===n)).filter(c=>c&&c.athletes&&c.athletes.length);
    if(!cats.length)continue;
    out.push(`<details class="cl"><summary><span><img src="${esc(tp.team?.logo||teamLogo(ab))}" alt="" style="width:20px;height:20px;vertical-align:-5px;margin-right:6px">${esc(tp.team?.displayName||ab)} box score</span></summary><div class="in">${cats.map(c=>`<h3>${BXLBL[c.name]}</h3><div class="tw"><table class="bx"><tr><th>Player</th>${c.labels.map(l=>`<th>${esc(l)}</th>`).join('')}</tr>${c.athletes.map(a=>{const mine=MINE_N.has(normName(a.athlete.displayName));return `<tr class="tp ${mine?'mine':''}" data-aid="${esc(a.athlete.id)}" data-gid="${esc(g.id)}"><td><img class="hsi" src="${esc(a.athlete.headshot?.href||'')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">${mine?'⭐ ':''}${esc(a.athlete.shortName||a.athlete.displayName)}</td>${a.stats.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`}).join('')}</table></div>`).join('')}</div></details>`)}
  if(!(S.boxscore?.players||[]).length)out.push('<div class="hint">Box score appears after kickoff.</div>');
  const dr=[...(S.drives?.previous||[])],cd=S.drives?.current;if(cd&&!dr.some(d=>d.id===cd.id))dr.push(cd);
  if(dr.length)out.push(`<details class="cl"><summary>Play-by-play (${dr.length} drives)</summary><div class="in">${dr.slice().reverse().map(d=>`<details class="cl"><summary><span><b>${esc(d.team?.abbreviation||'')}</b> · ${esc(d.displayResult||d.result||'In progress')} <small style="color:var(--mut);font-weight:600">${esc(d.description||'')}</small></span></summary><div class="in">${(d.plays||[]).slice().reverse().map(p=>`<div class="pl drv ${p.scoringPlay?'s':''}" style="border-top:0"><small>Q${esc(p.period?.number)} ${esc(p.clock?.displayValue||'')}${p.start?.downDistanceText?' · '+esc(p.start.downDistanceText):''}</small>${esc(p.text)}</div>`).join('')}</div></details>`).join('')}</div></details>`);
  const inj=(S.injuries||[]).map(t=>({t:t.team?.abbreviation,L:(t.injuries||[]).filter(x=>x.status&&x.status!=='Active')})).filter(x=>x.L.length);
  if(inj.length)out.push(`<details class="cl"><summary>Injury report</summary><div class="in">${inj.map(x=>`<h3>${esc(x.t)}</h3>${x.L.map(i=>`<div class="drv"><b>${esc(i.athlete?.displayName)}</b> ${injPill(i.status)}<small>${esc(i.athlete?.position?.abbreviation||'')} · ${esc(i.details?.type||'')} ${esc(i.status)}</small></div>`).join('')}`).join('')}</div></details>`);
  return out.join('')}
/* ---------- standings ---------- */
function parseStandings(d){return (d.children||[]).map(c=>({name:c.name,abbr:c.abbreviation,divs:(c.children||[]).map(dv=>({name:dv.name,rows:(dv.standings?.entries||[]).map(e=>{const s={};for(const x of e.stats||[])s[x.name||x.type]=x.displayValue;
  return {id:e.team.id,abbr:e.team.abbreviation,name:e.team.shortDisplayName||e.team.name,full:e.team.displayName,logo:e.team.logos?.[0]?.href||teamLogo(e.team.abbreviation),w:+s.wins||0,l:+s.losses||0,t:+s.ties||0,pct:s.winPercent,strk:s.streak,diff:s.differential,seed:+s.playoffSeed||99,ov:s.overall}}).sort((a,b)=>a.seed-b.seed)}))}))}
function renderStandings(C){if(!C||!C.length)return emptyMsg('Standings unavailable','Pull down to retry.');
  return C.map(c=>`<div class="conf"><h2>${esc(c.name)}</h2><div class="divs">${c.divs.map(d=>`<div class="dv"><h4>${esc(d.name)}</h4><div class="sr" style="cursor:default;color:var(--mut);font-size:11px"><span></span><span></span><span>Team</span><span class="sd">W-L${d.rows.some(r=>r.t)?'-T':''}</span><span class="sd">PCT</span><span class="sd">STRK</span></div>${d.rows.map((r,i)=>`<div class="sr ${SET.fav===r.abbr?'fav':''}" data-tid="${r.id}"><span class="sd">${r.seed<99?r.seed:i+1}</span><img src="${esc(r.logo)}" alt="" loading="lazy"><b>${esc(r.name)}</b><span class="sd" style="color:var(--txt)">${r.w}-${r.l}${r.t?'-'+r.t:''}</span><span class="sd">${esc(r.pct||'')}</span><span class="sd">${esc(r.strk||'')}</span></div>`).join('')}</div>`).join('')}</div></div>`).join('')+'<div class="hint">Number = conference playoff seed. Tap a team for its schedule.</div>'}
function renderTeam(T,SC){const t=T.team,col='#'+(t.color||'26324d');const ev=SC?.events||[];const now=Date.now();
  const row=e=>{const c=e.competitions[0],me=c.competitors.find(x=>x.team.id===t.id),op=c.competitors.find(x=>x.team.id!==t.id);if(!me||!op)return'';const done=c.status?.type?.completed;
    const res=done?`<span class="${me.winner?'W':'L'}">${me.winner?'W':(op.winner?'L':'T')}</span> ${esc(me.score?.displayValue||me.score)}-${esc(op.score?.displayValue||op.score)}`:`<small>${fmtTime(e.date)}</small>`;
    return `<div class="sch"><small>${esc(e.week?.text||'').replace('Week ','Wk ')}</small><span>${me.homeAway==='home'?'vs':'@'} <img src="${esc(op.team.logos?.[0]?.href||teamLogo(op.team.abbreviation))}" alt=""> ${esc(op.team.shortDisplayName||op.team.abbreviation)} <small>${esc(fmtShort(e.date))}</small></span><span>${res}</span></div>`};
  const up=ev.filter(e=>!e.competitions[0].status?.type?.completed),past=ev.filter(e=>e.competitions[0].status?.type?.completed);
  return `<div class="thd" style="background:${col}"><img src="${esc(t.logo||teamLogo(t.abbreviation))}" alt=""><div><b>${esc(t.displayName)}</b>${esc(t.recordSummary||'')} · ${esc(t.standingSummary||'')}</div></div>
   ${(()=>{const have=new Set(ev.map(e=>e.week?.number));const b=[...Array(18)].map((_,i)=>i+1).filter(w=>!have.has(w));return b.length&&ev.length?`<div class="hint">Bye: Week ${b.join(', ')}</div>`:''})()}<div class="sec">Upcoming</div>${up.map(row).join('')||'<div class="hint">No remaining regular-season games.</div>'}<div class="sec">Results</div>${past.slice().reverse().map(row).join('')}
   <div class="hint"><a href="https://www.espn.com/nfl/team/_/name/${esc(String(t.abbreviation).toLowerCase())}" target="_blank" rel="noopener noreferrer">ESPN team page ›</a></div>`}
/* ---------- fantasy model ---------- */
// Team: {id,name,owner,rec,rank,total,proj,starters[],bench[],avatar,logo}; Player: {id,name,pos,slot,nfl,pts,proj,live,inj,img,gs}
function gameInfo(nfl,GM){if(!GM||GM.missing)return {txt:'',rem:0,state:'unk'};const g=GM[nfl];if(!g)return {txt:'BYE',rem:0,state:'bye'};const opp=g.teams.find(t=>t.abbr!==nfl),home=g.teams[1]&&g.teams[1].abbr===nfl;const me=g.teams.find(t=>t.abbr===nfl);
  const vs=(home?'vs ':'@ ')+(opp?.abbr||'');let txt;if(g.state==='pre')txt=`${vs} · ${fmtShort(g.date)} ${fmtTime(g.date)}`;else if(g.state==='in')txt=`${vs} · ${g.status} · ${me.score}-${opp.score}`;else txt=`${vs} · ${me.winner?'W':'L'} ${me.score}-${opp.score}`;
  return {txt,rem:gameRem(g),state:g.state}}
function finishTeam(t,GM){const missing=!GM||GM.missing;for(const p of [...t.starters,...t.bench]){const gi=missing?{txt:'',rem:0,state:'unk'}:gameInfo(p.nfl,GM);p.gs=gi.txt;p.gstate=gi.state;p.rem=gi.rem;p.live=(p.pts||0)+(p.proj||0)*gi.rem}
  t.total=t.total??t.starters.reduce((s,p)=>s+(p.pts||0),0);
  if(missing){t.proj=t.total;t.rem=.5}else{t.proj=t.total+t.starters.reduce((s,p)=>s+(p.proj||0)*p.rem,0);t.rem=t.starters.reduce((s,p)=>s+p.rem,0)/Math.max(1,t.starters.length)}
  return t}
function winProb(A,B){const diff=A.proj-B.proj,rem=(A.rem+B.rem)/2;if(rem<=0.001)return A.total>B.total?1:A.total<B.total?0:.5;const sd=3+30*Math.sqrt(rem);const z=diff/sd;return 1/(1+Math.exp(-1.702*z))}
function slScore(stats,sc){if(!stats)return null;let t=0;for(const k in sc)if(stats[k]!=null)t+=sc[k]*stats[k];return Math.round(t*100)/100}
function buildSleeper(o,GM){const {league:lg,users,rosters,matchups:mus,proj,week}=o,sc=lg.scoring_settings||{},cfg=FT[0];
  const P={};for(const x of proj){P[x.player_id]={name:x.player_id.match(/^[A-Z]{2,3}$/)?`${x.player.last_name} D/ST`:`${x.player.first_name} ${x.player.last_name}`,pos:x.player.position,nfl:nTeam(x.team||x.player.team),inj:x.player.injury_status,proj:slScore(x.stats,sc)}}
  const slots=(lg.roster_positions||[]).filter(s=>s!=='BN'&&s!=='IR'&&s!=='TAXI').map(s=>s==='SUPER_FLEX'?'SFLX':s==='REC_FLEX'?'WR/TE':s==='WRRB_FLEX'?'RB/WR':s);
  const teams={};for(const ro of rosters){const u=users.find(x=>x.user_id===ro.owner_id)||{},m=mus.find(x=>x.roster_id===ro.roster_id)||{};const pp=m.players_points||{};
    const mk=(id,slot)=>{const p=P[id]||{name:'Player '+id,pos:'?',nfl:''};const isDef=/^[A-Z]{2,3}$/.test(id);return {id,name:p.name,pos:p.pos,slot,nfl:isDef?nTeam(id):p.nfl,pts:pp[id]??0,proj:p.proj??0,inj:p.inj,img:isDef?teamLogo(nTeam(id)):`https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg`}};
    const stz=(m.starters||ro.starters||[]);const starters=stz.map((id,i)=>id&&id!=='0'?mk(id,slots[i]||'FLEX'):null).filter(Boolean);
    const bench=(m.players||ro.players||[]).filter(id=>!stz.includes(id)).map(id=>mk(id,(ro.reserve||[]).includes(id)?'IR':'BN'));
    const s=ro.settings||{};teams[ro.roster_id]=finishTeam({id:ro.roster_id,name:u.metadata?.team_name||u.display_name||'Team '+ro.roster_id,owner:u.display_name||'',avatar:u.avatar?`https://sleepercdn.com/avatars/thumbs/${u.avatar}`:'',rec:`${s.wins||0}-${s.losses||0}${s.ties?'-'+s.ties:''}`,w:s.wins||0,pf:(s.fpts||0)+(s.fpts_decimal||0)/100,pa:(s.fpts_against||0)+(s.fpts_against_decimal||0)/100,total:m.points??0,starters,bench,mid:m.matchup_id},GM)}
  const rank=Object.values(teams).sort((a,b)=>b.w-a.w||b.pf-a.pf);rank.forEach((t,i)=>t.rank=i+1);
  const by={};for(const t of Object.values(teams))if(t.mid!=null)(by[t.mid]=by[t.mid]||[]).push(t.id);
  return {cfg,plat:'sleeper',league:lg.name,week,teams,matchups:Object.values(by),myId:cfg.roster,standings:rank,players:P,rostered:new Set(rosters.flatMap(r=>r.players||[]))}}
function buildEspn(d,cfg,GM){const cur=d.scoringPeriodId,mp=d.status?.currentMatchupPeriod||cur;const mem={};for(const m of d.members||[])mem[m.id]=m.displayName||((m.firstName||'')+' '+(m.lastName||'')).trim();
  const teams={},raw={};for(const t of d.teams||[]){raw[t.id]=t;const r=t.record?.overall||{};teams[t.id]={id:t.id,name:t.name||((t.location||'')+' '+(t.nickname||'')).trim()||t.abbrev,owner:mem[(t.owners||[])[0]]||t.abbrev||'',avatar:t.logo||'',rec:`${r.wins||0}-${r.losses||0}${r.ties?'-'+r.ties:''}`,w:r.wins||0,pf:r.pointsFor||0,pa:r.pointsAgainst||0,seed:t.playoffSeed||t.rankCalculatedFinal||99,starters:[],bench:[],total:null}}
  const ent=e=>{const pl=e.playerPoolEntry?.player||e.player||{},st=pl.stats||[];const pick=src=>st.find(s=>s.scoringPeriodId===cur&&s.statSourceId===src&&(s.statSplitTypeId==null||s.statSplitTypeId===1));
    const slot=ESPN_SLOT[e.lineupSlotId]||'BN',pos=ESPN_POS[pl.defaultPositionId]||'?',nfl=ESPN_PRO[pl.proTeamId]||'';const pts=e.playerPoolEntry?.appliedStatTotal??pick(0)?.appliedTotal??0;
    return {id:String(pl.id??e.playerId),name:pos==='DEF'?`${nfl} D/ST`:pl.fullName,pos,slot,nfl,pts,proj:pick(1)?.appliedTotal??0,inj:pl.injuryStatus,img:pos==='DEF'?teamLogo(nfl):`https://a.espncdn.com/i/headshots/nfl/players/full/${pl.id}.png`}};
  const fill=(tid,entries,tot)=>{const T=teams[tid];if(!T)return;const L=(entries||[]).map(ent);T.starters=L.filter(p=>!['BN','IR'].includes(p.slot)).sort((a,b)=>SLOT_ORD.indexOf(a.slot)-SLOT_ORD.indexOf(b.slot));T.bench=L.filter(p=>['BN','IR'].includes(p.slot));if(tot!=null)T.total=tot};
  const M=[];for(const s of d.schedule||[]){if(s.matchupPeriodId!==mp)continue;const h=s.home,a=s.away;
    if(h){fill(h.teamId,h.rosterForCurrentScoringPeriod?.entries||raw[h.teamId]?.roster?.entries,h.totalPointsLive??h.totalPoints)}if(a){fill(a.teamId,a.rosterForCurrentScoringPeriod?.entries||raw[a.teamId]?.roster?.entries,a.totalPointsLive??a.totalPoints)}
    M.push(a?[a.teamId,h.teamId]:[h.teamId])}
  for(const id in teams){if(!teams[id].starters.length&&raw[id]?.roster)fill(id,raw[id].roster.entries);finishTeam(teams[id],GM)}
  const rank=Object.values(teams).sort((a,b)=>a.seed-b.seed||b.w-a.w||b.pf-a.pf);rank.forEach((t,i)=>t.rank=i+1);
  let my=(d._me||[])[0]??cfg.team;if(my==null||!teams[my]){const f=Object.values(teams).find(t=>normName(t.name)===normName(cfg.teamName));if(f)my=f.id}
  return {cfg,plat:'espn',league:d.settings?.name||cfg.leagueName,week:cur,teams,matchups:M,myId:my,standings:rank,rostered:new Set(Object.values(teams).flatMap(t=>[...t.starters,...t.bench].map(p=>p.id)))}}
/* ---------- fantasy render ---------- */
const platTag=c=>`<span class="plat ${c.plat==='sleeper'?'sl':'es'}">${c.plat==='sleeper'?'SLEEPER':'ESPN'}</span>`;
function mcard(F,m,i){const T=F.teams,A=T[m[0]],B=T[m[1]];const mine=m.includes(F.myId)||m.map(String).includes(String(F.myId));
  const av=t=>t.avatar?`<span class="hs" style="width:22px;height:22px;display:inline-block;vertical-align:-5px;margin-right:5px;background-image:url('${esc(t.avatar)}')"></span>`:'';
  const half=(t,p,right,lead)=>{const r=Math.round(p*100),cl=r>50?'fav':r<50?'dog':'even';const pv=Math.max(0,Math.min(1,r/100)).toFixed(4);return `<div class="mhf ${right?'r':''} ${cl} ${lead}"><div class="mtop"><span class="msc" data-k="fs:${esc(F.cfg.key)}:${esc(t.id)}" data-sv="${esc(f2(t.total))}">${f2(t.total)}</span><span class="wpc">${r}%</span></div><div class="mbar"><i data-p="${pv}" data-k="${esc(F.cfg.key)}:${esc(t.id)}" data-side="${right?'r':'l'}"></i></div><div class="mpj">Proj ${f1(t.proj)}</div><div class="mname">${String(t.id)===String(F.myId)?'⭐ ':''}${right?'':av(t)}${esc(t.name)}${right?av(t):''}</div><div class="msub">${esc(t.rec)}${t.rank?' · #'+t.rank:''}</div></div>`};
  if(!B)return `<div class="mcard ${mine?'mine':''}" data-m="${i}" data-k="${F.cfg.key}">${half(A,1,0,'')}<div class="vsb">BYE</div><div></div></div>`;
  const p=winProb(A,B),lead=A.total>B.total?['lead','trail']:B.total>A.total?['trail','lead']:['',''];
  return `<div class="mcard ${mine?'mine':''}" data-m="${i}" data-k="${F.cfg.key}">${half(A,p,0,lead[0])}<div class="vsb">VS</div>${half(B,1-p,1,lead[1])}</div>`}
function myMatch(F){return F.matchups.findIndex(m=>m.map(String).includes(String(F.myId)))}
function prow(p,k){const gs=p.gs?` · ${esc(p.gs)}`:'';return `<div class="pc" data-pk="${esc(k)}" data-pid="${esc(p.id)}"><div class="slot" style="background:${POSC[p.slot]||'#9aa6bd'};${p.slot==='BN'||p.slot==='IR'?'color:#cfd6e4':''}">${esc(p.slot)}</div><div class="hs" style="background-image:url('${esc(p.img)}')"></div><div class="pi"><b>${esc(p.name)}</b>${injPill(p.inj)}<small class="${p.gstate==='in'?'live':''}">${esc(p.pos)} · ${esc(p.nfl||'FA')}${gs}</small></div><div class="pr"><b>${f2(p.pts)}</b><small>${p.gstate==='post'||p.gstate==='bye'?'final':'proj '+f1(p.proj)}</small></div></div>`}
function renderMatchupView(F,ui){const i=ui.mi!=null&&F.matchups[ui.mi]?ui.mi:myMatch(F);if(i<0)return emptyMsg('No matchup this week','This team has a bye, or the week has not started.');const m=F.matchups[i],T=F.teams;
  const side=ui.side!=null&&m.map(String).includes(String(ui.side))?ui.side:(m.map(String).includes(String(F.myId))?F.myId:m[0]);const t=T[side];
  return `${mcard(F,m,i)}${m.length>1?`<div class="fsub" id="sideSeg">${m.map(id=>`<button data-side="${id}" class="${String(id)===String(side)?'on':''}">${esc(T[id].name)}</button>`).join('')}</div>`:''}
   <div class="sec">Starters</div>${t.starters.map(p=>prow(p,F.cfg.key)).join('')}<details class="cl"><summary>Bench (${t.bench.length})</summary><div class="in">${t.bench.map(p=>prow(p,F.cfg.key)).join('')}</div></details>
   <div class="hint">${F.gmMissing?'Game clocks hidden while the scoreboard retries. ':''}Points from ${F.plat==='sleeper'?'Sleeper':'ESPN'} (league scoring). Projection = points so far + remaining share of each starter's pre-game projection; win % is an estimate.</div>`}
function renderLeagueView(F){return `<div class="lhead"><b>${esc(F.league)}</b><span>Week ${esc(F.week)}</span></div>${F.matchups.map((m,i)=>mcard(F,m,i)).join('')}`}
function renderFStand(F){return `<div class="tw"><table class="stbl"><tr><th>#</th><th style="text-align:left">Team</th><th>W-L</th><th>PF</th><th>PA</th></tr>${F.standings.map(t=>`<tr class="${String(t.id)===String(F.myId)?'me':''}"><td>${t.rank}</td><td style="text-align:left;position:static">${esc(t.name)}<br><small style="color:var(--mut)">${esc(t.owner)}</small></td><td>${esc(t.rec)}</td><td>${f1(t.pf)}</td><td>${f1(t.pa)}</td></tr>`).join('')}</table></div>`}
function renderWaivers(F,W){if(!W)return '<div class="hint">Loading waiver wire…</div>';if(W.err)return `<div class="setup">${W.err}</div>`;
  return `<div class="sec">${esc(W.title)}</div>${W.list.map((p,i)=>`<div class="wv" data-pk="${F.cfg.key}" data-wid="${esc(p.id)}"><span class="rk">${i+1}</span><div class="hs" style="background-image:url('${esc(p.img)}')"></div><div class="pi"><b>${esc(p.name)}</b>${injPill(p.inj)}<small>${esc(p.pos)} · ${esc(p.nfl||'FA')}${p.note?' · '+esc(p.note):''}</small></div><div class="pr"><b>${f1(p.proj)}</b><small>wk proj</small></div></div>`).join('')}<div class="hint">${esc(W.hint)}</div>`}
function espnSetupHTML(c,err){return `<div class="setup"><b>${esc(c.teamName)} · ${esc(c.leagueName)}</b> ${platTag(c)}<p>${esc(err||'ESPN private league — needs a connection.')}</p>
 <p>ESPN private leagues need your ESPN login cookies, and browsers can't send those to ESPN from this page. Open ⚙︎ Settings → ESPN connection and paste your private <b>ESPN data URL</b> (your Cloudflare Worker). Setup steps are in the README that came with this app.</p></div>`}
/* ---------- app ---------- */
const NSREV=new Set();let MINE_N=new Set(),MINE_T=new Set();
if(typeof module!=='undefined'){module.exports={parseGame,renderGames,renderSummary,parseStandings,renderStandings,buildSleeper,buildEspn,winProb}}
else(function(){
 setTZ();const H=document.documentElement;const UI={fsub:'m',mi:null,side:null};
 const open=new Set(),sums={};let WEEKS=[],wkIdx=-1,curWk=null,EV=null,lastOk=0,timer,FD={},FERR={},WV={},STD=null,stdT=0,GMW={},SP=null;
 const OFF=k=>{try{return JSON.parse(localStorage.getItem('nflOff:'+k)||'null')}catch(e){return null}};
 async function j(u,o,key){try{const r=await fetch(u,o||{cache:'no-store'});if(!r.ok){const e=Error('HTTP '+r.status);e.status=r.status;throw e}const v=await r.json();if(key){try{localStorage.setItem('nflOff:'+key,JSON.stringify(v))}catch(e){}}return v}catch(e){if(key&&!e.status){const c=OFF(key);if(c){OFFLINE=true;return c}}throw e}}
 let OFFLINE=false;
 function haptic(){if(!SET.haptics)return;try{if(navigator.vibrate&&navigator.vibrate(8))return;$('hl').click()}catch(e){}}
 function toast(t){const el=document.createElement('div');el.className='toast';el.textContent=t;$('toasts').appendChild(el);setTimeout(()=>el.remove(),3500)}
 function applyLook(){H.classList.toggle('light',SET.theme==='light'||(SET.theme==='auto'&&matchMedia('(prefers-color-scheme: light)').matches));H.classList.toggle('ns',!!SET.ns);H.classList.toggle('rm',!!SET.rm);const meta=document.querySelector('meta[name=theme-color]');if(meta)meta.content=H.classList.contains('light')?'#f3f5f9':'#080c14'}
 function reduceMotion(){return !!SET.rm||matchMedia('(prefers-reduced-motion: reduce)').matches}
 function enter(el){if(!el||reduceMotion())return;el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');setTimeout(()=>el.classList.remove('enter'),720)}
 const SV={},BAR={};
 function popNums(root){if(!root)return;const rm=reduceMotion();root.querySelectorAll('[data-sv]').forEach(el=>{const k=el.dataset.k,v=el.dataset.sv;if(!rm&&v!==''&&SV[k]!=null&&SV[k]!==v)el.classList.add('pop');if(v!=='')SV[k]=v})}
 function fillBars(root){if(!root)return;const rm=reduceMotion();root.querySelectorAll('.mbar i').forEach(i=>{const p=Math.max(0,Math.min(1,+i.dataset.p||0));const k=(i.dataset.k||'')+':'+(i.dataset.side||'');const prev=BAR[k];
   if(rm||prev==null||Math.abs(prev-p)<.004){i.style.transition='none';i.style.transform=`scaleX(${p})`}
   else{i.style.transition='none';i.style.transform=`scaleX(${prev})`;requestAnimationFrame(()=>requestAnimationFrame(()=>{i.style.transition='transform .55s cubic-bezier(.22,.8,.2,1)';i.style.transform=`scaleX(${p})`}))}
   BAR[k]=p})}
 /* tabs */
 const TABS={tS:'games',tT:'standings',tF:'fantasy'};
 function pill(){const T=document.querySelector('.tabs'),b=T.querySelector('button.on'),p=T.querySelector('.pill');if(!b||!p)return;p.style.width=b.offsetWidth+'px';p.style.transform=`translateX(${b.offsetLeft}px)`}
 function showTab(id){for(const k in TABS){$(k).classList.toggle('on',k===id);$(TABS[k]).classList.toggle('hide',k!==id)}$('nav').classList.toggle('hide',id!=='tS');SET.tab=id;saveSet();pill();enter($(TABS[id]));
   if(id==='tT')loadStandings();if(id==='tF')loadFantasy()}
 for(const k in TABS)$(k).onclick=()=>{haptic();showTab(k)};
 /* weeks */
 function weekLabel(w){return w?(w.st===1?'Pre ':w.st===3?'':'')+w.label:''}
 function renderWeekSel(){$('wk').innerHTML=WEEKS.map((w,i)=>`<option value="${i}" ${i===wkIdx?'selected':''}>${esc(weekLabel(w))}${w.detail?' · '+esc(w.detail):''}</option>`).join('')}
 function setCalendar(d){const out=[];for(const c of d.leagues?.[0]?.calendar||[]){const st=+c.value;if(st===4)continue;for(const e of c.entries||[])out.push({st,wk:+e.value,label:e.label,detail:e.detail,start:e.startDate,end:e.endDate})}
   if(out.length)WEEKS=out.filter(w=>w.st!==1);const st=d.season?.type,wk=d.week?.number;curWk=WEEKS.findIndex(w=>w.st===st&&w.wk===wk);if(wkIdx<0)wkIdx=curWk;renderWeekSel()}
 function myNflTeams(){const s=new Set();for(const k in FD){const F=FD[k];const t=F.teams[F.myId];if(t)for(const p of [...t.starters])if(p.nfl)s.add(p.nfl)}return s}
 function minePlayers(){const s=new Set();for(const k in FD){const F=FD[k];const t=F.teams[F.myId];if(t)for(const p of [...t.starters,...t.bench])s.add(normName(p.name))}MINE_N=s}
 function paintGames(){if(!EV)return;MINE_T=myNflTeams();minePlayers();$('games').innerHTML=renderGames(EV,open,sums,MINE_T);popNums($('games'));const live=EV.filter(e=>e.status?.type?.state==='in').length;$('liveN').classList.toggle('hide',!live);$('liveN').querySelector('b').textContent=live;badge(live)}
 async function load(reset){const w=WEEKS[wkIdx];$('dot').className='dot spin';
   try{const u=w?`${API}scoreboard?dates=${SEASON}&seasontype=${w.st}&week=${w.wk}`:`${API}scoreboard`;const d=await j(u,null,'sb:'+(w?w.st+'-'+w.wk:'cur'));if(!WEEKS.length||!w)setCalendar(d);EV=d.events||[];lastOk=Date.now();
     if(reset){$('games').scrollTop=0}paintGames();if(reset)enter($('games'));for(const id of open)loadSum(id);$('dot').className='dot';updLabel()}
   catch(e){$('dot').className='dot err';$('ut').textContent='Offline — retrying';if(!EV)$('games').innerHTML=emptyMsg('Couldn\'t load scores','Pull down to retry.')}
   sched()}
 function sched(){clearTimeout(timer);timer=setTimeout(()=>{if(!document.hidden){if(!$('games').classList.contains('hide'))load(false);else if(!$('fantasy').classList.contains('hide'))loadFantasy(true)}else sched()},SET.rs*1000)}
 function updLabel(){$('ut').textContent=(OFFLINE?'Offline copy · ':'')+'Updated '+new Date(lastOk).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'})+' '+TZL+' · '+weekLabel(WEEKS[wkIdx])}
 async function loadSum(id){try{sums[id]=await j(API+'summary?event='+id);paintGames()}catch(e){}}
 function shift(d){const n=wkIdx+d;if(n<0||n>=WEEKS.length)return;wkIdx=n;open.clear();renderWeekSel();EV=null;$('games').innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';haptic();load(true)}
 $('prev').onclick=()=>shift(-1);$('next').onclick=()=>shift(1);$('wk').onchange=e=>{wkIdx=+e.target.value;shift(0)};$('cur').onclick=()=>{wkIdx=curWk;shift(0)};
 $('games').addEventListener('click',e=>{const rv=e.target.closest('[data-rev]');if(rv){NSREV.add(rv.dataset.rev);haptic();paintGames();return}
   const tr=e.target.closest('tr.tp');if(tr){openAthlete(tr.dataset.aid,tr.dataset.gid);return}
   if(e.target.closest('a,details,summary,.det'))return;const c=e.target.closest('.card');if(!c)return;const id=c.dataset.id;haptic();if(open.has(id))open.delete(id);else{open.add(id);if(!sums[id])loadSum(id)}paintGames();if(open.has(id))setTimeout(()=>{const card=document.querySelector(`.card[data-id="${id}"]`);if(!card)return;const top=card.getBoundingClientRect().top+scrollY-(document.querySelector('header.hx')?.offsetHeight||0)-8;scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'})},30)});
 /* overlays */
 function ov(title,html){$('ovT').textContent=title;$('ovB').innerHTML=html;$('ov').classList.remove('hide')}
 $('ovX').onclick=()=>$('ov').classList.add('hide');$('ov').addEventListener('click',e=>{if(e.target===$('ov'))$('ov').classList.add('hide')});
 function fantasyOwn(name){const n=normName(name),out=[];for(const k in FD){const F=FD[k];for(const t of Object.values(F.teams))for(const p of [...t.starters,...t.bench])if(normName(p.name)===n)out.push({F,t,p})}return out}
 function fantasyBlock(name){const L=fantasyOwn(name);return L.length?`<div class="sec">Fantasy</div>${L.map(({F,t,p})=>`<div class="gopt"><div><b>${String(t.id)===String(F.myId)?'⭐ ':''}${esc(t.name)}</b> ${platTag(F.cfg)}<small>${esc(F.league)} · ${esc(p.slot)}</small></div><div class="pr"><b>${f2(p.pts)}</b><small>proj ${f1(p.proj)}</small></div></div>`).join('')}`:'<div class="hint">Not rostered on any of your fantasy teams.</div>'}
 function openAthlete(aid,gid){const S=sums[gid];let a=null,team='';const lines=[];for(const tp of S?.boxscore?.players||[])for(const c of tp.statistics){const x=(c.athletes||[]).find(q=>q.athlete.id===aid);if(x){a=x.athlete;team=tp.team.abbreviation;lines.push(`<div><small>${BXLBL[c.name]||c.name}</small>${c.labels.map((l,i)=>`<span style="display:inline-block;margin-right:8px"><b style="display:inline;font-size:14px">${esc(x.stats[i])}</b> <small>${esc(l)}</small></span>`).join('')}</div>`)}}
   if(!a)return;haptic();ov(a.displayName,`<div class="pcard"><div class="ph"><img src="${esc(a.headshot?.href||'')}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(a.displayName)}</b><small style="color:var(--mut)">${esc(team)}${a.jersey?' · #'+esc(a.jersey):''}</small></div></div><div class="sec">This game</div><div class="stl" style="grid-template-columns:1fr">${lines.join('')}</div>${fantasyBlock(a.displayName)}<div class="hint"><a href="https://www.espn.com/nfl/player/_/id/${esc(aid)}" target="_blank" rel="noopener noreferrer">ESPN player page ›</a></div></div>`)}
 function openFPlayer(k,pid){const F=FD[k];if(!F)return;let p=null,t=null;for(const x of Object.values(F.teams))for(const q of [...x.starters,...x.bench])if(String(q.id)===String(pid)){p=q;t=x}
   if(!p&&WV[k]&&WV[k].list)p=WV[k].list.find(q=>String(q.id)===String(pid));if(!p)return;haptic();
   ov(p.name,`<div class="pcard"><div class="ph"><img src="${esc(p.img)}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(p.name)}</b>${injPill(p.inj)}<small style="color:var(--mut)">${esc(p.pos)} · ${esc(p.nfl||'FA')}</small></div></div>
    <div class="stl"><div><small>Week ${esc(F.week)} pts</small><b>${f2(p.pts)}</b></div><div><small>Projection</small><b>${f1(p.proj)}</b></div><div><small>Slot</small><b>${esc(p.slot||'FA')}</b></div></div>
    ${p.gs?`<div class="hint">${esc(p.gs)}</div>`:''}${t?`<div class="hint">On <b>${esc(t.name)}</b> (${esc(F.league)})</div>`:'<div class="hint">Free agent in this league</div>'}${fantasyBlock(p.name)}</div>`)}
 /* standings */
 async function loadStandings(force){if(!force&&STD&&Date.now()-stdT<3e5){$('standings').innerHTML=renderStandings(STD);enter($('standings'));return}if(!STD)$('standings').innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';try{STD=parseStandings(await j(STAND,null,'std'));stdT=Date.now();$('standings').innerHTML=renderStandings(STD);enter($('standings'))}catch(e){if(!STD)$('standings').innerHTML=emptyMsg('Standings unavailable','Pull down to retry.')}}
 $('standings').addEventListener('click',async e=>{const r=e.target.closest('.sr[data-tid]');if(!r)return;haptic();ov('Team','<div class="skel"></div>');try{const SC=await j(API+'teams/'+r.dataset.tid+'/schedule?season='+SEASON),T={team:SC.team};$('ovT').textContent=T.team.displayName;$('ovB').innerHTML=renderTeam(T,SC)}catch(err){$('ovB').innerHTML=emptyMsg('Couldn\'t load team','Pull down on the standings and try again.')}});
 /* fantasy loading — ESPN scoreboard is optional. Sleeper still renders if it fails. */
 let SLRAW=null;const ESRAW={};let gmTimer=null,gmDelay=4000;const gmQueue=new Set();
 function mapBoard(d){const M={t:Date.now(),ok:true};for(const e of d.events||[]){try{const g=parseGame(e);for(const t of g.teams)if(t&&t.abbr)M[t.abbr]=g}catch(err){}}return M}
 function applyFreshGM(week,GM){let ch=false;
   if(SLRAW&&SLRAW.week===week&&SLRAW.needGM){FD.sl=buildSleeper(SLRAW,GM);FD.sl.projRaw=SLRAW.proj;FD.sl.gmMissing=false;SLRAW.needGM=false;ch=true}
   for(const k in ESRAW){const r=ESRAW[k];if(r.week===week&&r.needGM){FD[k]=buildEspn(r.d,r.c,GM);FD[k].gmMissing=false;r.needGM=false;ch=true}}
   if(ch){paintF();if(EV)paintGames()}}
 function retryGames(week){gmQueue.add(week);if(gmTimer)return;const arm=()=>{gmTimer=setTimeout(async()=>{gmTimer=null;for(const w of [...gmQueue]){try{const GM=await gamesFor(w);gmQueue.delete(w);applyFreshGM(w,GM)}catch(e){}}
   if(gmQueue.size){gmDelay=Math.min(gmDelay*2,60000);arm()}else gmDelay=4000},gmDelay)};arm()}
 async function gamesFor(week){const hit=GMW[week];if(hit&&hit.ok&&!hit.stale&&Date.now()-hit.t<25e3)return hit;
   try{const d=await j(`${API}scoreboard?dates=${SEASON}&seasontype=2&week=${week}`,null,'gm:'+week);const M=mapBoard(d);GMW[week]=M;return M}
   catch(e){if(hit&&hit.ok)return hit;const c=OFF('gm:'+week)||OFF('sb:2-'+week);if(c&&c.events){const M=mapBoard(c);M.stale=true;GMW[week]=M;return M}throw e}}
 async function withGames(week){try{return await gamesFor(week)}catch(e){retryGames(week);return {missing:true}}}
 async function loadSleeperF(){const c=FT[0];const [state,league,users,rosters]=await Promise.all([j(SL+'/state/nfl',null,'sst'),j(`${SL}/league/${c.league}`,null,'slg'),j(`${SL}/league/${c.league}/users`,null,'sus'),j(`${SL}/league/${c.league}/rosters`,null,'sro')]);
   const week=state.display_week||state.week;const [matchups,proj]=await Promise.all([j(`${SL}/league/${c.league}/matchups/${week}`,null,'smu'),SP&&SP.w===week&&Date.now()-SP.t<6e5?SP.v:j(`${SLX}/projections/nfl/${SEASON}/${week}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K&position[]=DEF`)]);
   const GM=await withGames(week);
   SP={w:week,t:SP&&SP.w===week&&SP.v===proj?SP.t:Date.now(),v:proj};
   SLRAW={league,users,rosters,matchups,proj,week,needGM:!!GM.missing};FD.sl=buildSleeper(SLRAW,GM);FD.sl.projRaw=proj;FD.sl.gmMissing=!!GM.missing;delete FERR.sl}
 async function espnGet(c,qs,filter){const tries=[];if(MOCK&&window.ESPN_MOCK)return window.ESPN_MOCK(c.league,qs);
   if(SET.espnUrl)tries.push([SET.espnUrl.replace(/\/+$/,'')+'/league/'+c.league+'?'+qs,{cache:'no-store',headers:filter?{'x-fantasy-filter':filter}:{}}]);
   if(SET.espnDirect)tries.push([ESPN_DIRECT+c.league+'?'+qs,{cache:'no-store',credentials:'include',headers:filter?{'x-fantasy-filter':filter}:{}}]);
   let last=null;for(const [u,o] of tries){try{const r=await fetch(u,o);if(r.ok)return await r.json();last=r.status}catch(e){last=last||'network'}}
   const e=Error(last===401||last===403?'ESPN says this league is private and no ESPN login was available (HTTP '+last+').':last?'ESPN connection failed ('+last+').':'No ESPN connection configured.');e.code=last;throw e}
 async function loadEspnF(c){const d=await espnGet(c,'view=mTeam&view=mRoster&view=mMatchup&view=mMatchupScore&view=mSettings&view=mStatus');const GM=await withGames(d.scoringPeriodId);ESRAW[c.key]={d,c,week:d.scoringPeriodId,needGM:!!GM.missing};FD[c.key]=buildEspn(d,c,GM);FD[c.key].gmMissing=!!GM.missing;delete FERR[c.key]}
 let floading=false,fT=0;
 async function loadFantasy(bg){if(floading)return;if(!bg&&Object.keys(FD).length&&Date.now()-fT<2e4){paintF(true);return}floading=true;if(!Object.keys(FD).length&&!Object.keys(FERR).length)$('fantasy').innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
   await Promise.all([loadSleeperF().catch(e=>{FERR.sl=e.message}),...FT.slice(1).map(c=>loadEspnF(c).catch(e=>{FERR[c.key]=e.message}))]);fT=Date.now();floading=false;paintF(!bg);if(EV)paintGames();sched()}
 async function loadWaivers(k){const F=FD[k];if(!F||WV[k])return;
   if(F.plat==='sleeper'){try{const tr=await j(`${SL}/players/nfl/trending/add?lookback_hours=48&limit=60`);const P=F.players;const proj=F.projRaw||[];
       const trend=tr.filter(x=>!F.rostered.has(x.player_id)&&P[x.player_id]).slice(0,15).map(x=>{const p=P[x.player_id];return {id:x.player_id,name:p.name,pos:p.pos,nfl:p.nfl,inj:p.inj,proj:p.proj,note:`+${x.count} adds (48h)`,img:/^[A-Z]{2,3}$/.test(x.player_id)?teamLogo(p.nfl):`https://sleepercdn.com/content/nfl/players/thumb/${x.player_id}.jpg`}});
       const top=proj.filter(x=>!F.rostered.has(x.player_id)&&P[x.player_id]&&['QB','RB','WR','TE'].includes(P[x.player_id].pos)).map(x=>({id:x.player_id,...P[x.player_id],img:`https://sleepercdn.com/content/nfl/players/thumb/${x.player_id}.jpg`})).sort((a,b)=>b.proj-a.proj).slice(0,15);
       WV[k]={title:'Trending free agents',list:trend.concat(top.filter(p=>!trend.some(t=>t.id===p.id)).map(p=>Object.assign(p,{note:'top proj'}))),hint:'Unrostered in your league. Trending = most-added across Sleeper in the last 48h; “top proj” = highest projected this week (league scoring). Source: Sleeper.'}}catch(e){WV[k]={err:'Couldn\'t load Sleeper waivers.'}}}
   else{const filter=JSON.stringify({players:{filterStatus:{value:['FREEAGENT','WAIVERS']},filterSlotIds:{value:[0,2,4,6,17,16]},limit:30,sortPercOwned:{sortPriority:1,sortAsc:false},filterRanksForScoringPeriodIds:{value:[F.week]}}});
     try{const d=await espnGet(F.cfg,'view=kona_player_info&scoringPeriodId='+F.week,filter);WV[k]={title:'Most-owned available players',list:(d.players||[]).map(x=>{const pl=x.player||{},pos=ESPN_POS[pl.defaultPositionId]||'?',nfl=ESPN_PRO[pl.proTeamId]||'';const pr=(pl.stats||[]).find(s=>s.scoringPeriodId===F.week&&s.statSourceId===1);return {id:String(pl.id),name:pos==='DEF'?nfl+' D/ST':pl.fullName,pos,nfl,inj:pl.injuryStatus,proj:pr?.appliedTotal,note:pl.ownership?`${f1(pl.ownership.percentOwned)}% owned`:(x.status==='WAIVERS'?'waivers':''),img:pos==='DEF'?teamLogo(nfl):`https://a.espncdn.com/i/headshots/nfl/players/full/${pl.id}.png`}}),hint:'Free agents and waiver players in this ESPN league, sorted by ESPN ownership %. Source: ESPN.'}}
     catch(e){WV[k]={err:`ESPN waiver list unavailable: ${esc(e.message)} <a href="https://fantasy.espn.com/football/players/add?leagueId=${F.cfg.league}" target="_blank" rel="noopener noreferrer">Open on ESPN ›</a>`}}}
   paintF()}
 function fsel(){return SET.fteam==='all'||!FT.find(c=>c.key===SET.fteam)?'all':SET.fteam}
 function paintF(anim){const sel=fsel(),el=$('fantasy');let h=MOCK?'<div class="banner">DEV PREVIEW — ESPN teams below use SAMPLE data (schema test), not your real ESPN leagues.</div>':'';
   h+=`<div class="fpick">${[['all','All teams']].concat(FT.map(c=>[c.key,c.short])).map(([k,l])=>`<button data-fk="${k}" class="${sel===k?'on':''}">${esc(l)}${k!=='all'?' '+platTag(FT.find(c=>c.key===k)):''}</button>`).join('')}</div>`;
   if(sel==='all'){el.classList.add('wide');h+=`<div class="fgrid">${FT.map(c=>{const F=FD[c.key];if(!F)return `<div>${FERR[c.key]?(c.plat==='espn'?espnSetupHTML(c,FERR[c.key]):`<div class="setup">${esc(c.short)}: ${esc(FERR[c.key])}</div>`):'<div class="skel"></div>'}</div>`;const i=myMatch(F);
     return `<div><div class="ohead">${platTag(c)} ${esc(F.teams[F.myId]?.name||c.short)}<small>${esc(F.league)} · Wk ${esc(F.week)}</small></div>${i>=0?mcard(F,F.matchups[i],i):'<div class="hint">No matchup this week.</div>'}</div>`}).join('')}</div><div class="hint">${FT.some(c=>FD[c.key]&&FD[c.key].gmMissing)?'Game clocks hidden while the scoreboard retries. ':''}Tap a matchup to open that team. Green = winning / favored, red = losing / underdog.</div>`}
   else{el.classList.remove('wide');const c=FT.find(x=>x.key===sel),F=FD[sel];
     if(!F)h+=FERR[sel]?(c.plat==='espn'?espnSetupHTML(c,FERR[sel]):`<div class="setup">${esc(FERR[sel])}</div>`):'<div class="skel"></div>';
     else{const sub=['m','l','s','w'].includes(UI.fsub)?UI.fsub:'m';h+=`<div class="fsub" id="fsub">${[['m','Matchup'],['l','League'],['s','Standings'],['w','Waivers']].map(([k,l])=>`<button data-sub="${k}" class="${sub===k?'on':''}">${l}</button>`).join('')}</div>`;
       h+=sub==='m'?renderMatchupView(F,UI):sub==='l'?renderLeagueView(F):sub==='s'?renderFStand(F):renderWaivers(F,WV[sel]);if(sub==='w')loadWaivers(sel)}}
   el.innerHTML=h;popNums(el);fillBars(el);if(anim)enter(el)}
 $('fantasy').addEventListener('click',e=>{const b=e.target.closest('[data-fk]');if(b){haptic();SET.fteam=b.dataset.fk;saveSet();UI.mi=null;UI.side=null;paintF(true);return}
   const s=e.target.closest('[data-sub]');if(s){haptic();UI.fsub=s.dataset.sub;UI.mi=null;UI.side=null;paintF(true);return}
   const sd=e.target.closest('[data-side]');if(sd){haptic();UI.side=sd.dataset.side;paintF();return}
   const m=e.target.closest('.mcard');if(m){haptic();if(fsel()==='all'){SET.fteam=m.dataset.k;saveSet();UI.fsub='m';UI.mi=null}else{UI.fsub='m';UI.mi=+m.dataset.m;UI.side=null}paintF(true);scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});return}
   const p=e.target.closest('[data-pid],[data-wid]');if(p)openFPlayer(p.dataset.pk,p.dataset.pid||p.dataset.wid)});
 /* settings */
 const TEAMS=[['ARI','Cardinals'],['ATL','Falcons'],['BAL','Ravens'],['BUF','Bills'],['CAR','Panthers'],['CHI','Bears'],['CIN','Bengals'],['CLE','Browns'],['DAL','Cowboys'],['DEN','Broncos'],['DET','Lions'],['GB','Packers'],['HOU','Texans'],['IND','Colts'],['JAX','Jaguars'],['KC','Chiefs'],['LAC','Chargers'],['LAR','Rams'],['LV','Raiders'],['MIA','Dolphins'],['MIN','Vikings'],['NE','Patriots'],['NO','Saints'],['NYG','Giants'],['NYJ','Jets'],['PHI','Eagles'],['PIT','Steelers'],['SEA','Seahawks'],['SF','49ers'],['TB','Buccaneers'],['TEN','Titans'],['WSH','Commanders']];
 function settingsHTML(){const tog=(k,t,s)=>`<div class="gopt"><div><b>${t}</b><small>${s}</small></div><label class="tog"><input type="checkbox" data-sk="${k}" ${SET[k]?'checked':''}><span></span></label></div>`;
   const sel=(k,t,opts,s)=>`<div class="gopt"><div><b>${t}</b>${s?`<small>${s}</small>`:''}</div><select data-sk="${k}">${opts.map(([v,l])=>`<option value="${v}" ${String(SET[k])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
   const st=c=>FD[c.key]?'Connected':FERR[c.key]?'Not connected':'…';
   return `<div class="gs-sec">My fantasy team</div>${[['all','All teams','Overview of all 3 matchups']].concat(FT.map(c=>[c.key,(FD[c.key]?.teams[FD[c.key].myId]?.name)||c.teamName||c.short,c.leagueName+' · '+st(c),c])).map(([k,n,s,c])=>`<div class="gt ${fsel()===k?'on':''}" data-ft="${k}"><div><b>${esc(n)}${c?' '+platTag(c):''}</b><small>${esc(s)}</small></div>${fsel()===k?'✓':''}</div>`).join('')}
   <div class="gs-sec">Scores</div>${sel('fav','Favorite team',[['','None']].concat(TEAMS.map(([a,n])=>[a,n])),'Pinned first and highlighted')}${tog('ns','No Spoilers Mode','Hide scores until you tap “Reveal”')}${sel('rs','Auto-refresh',[[15,'15 sec'],[30,'30 sec'],[60,'1 min'],[120,'2 min']])}
   <div class="gs-sec">Look &amp; feel</div>${sel('theme','Theme',[['dark','Dark'],['light','Light'],['auto','Match device']])}${tog('rm','Reduce motion','Turn off animations')}${tog('haptics','Haptics','Light tap feedback (iPhone, iOS 18+)')}${sel('tz','Time zone',[['America/Chicago','Central'],['America/New_York','Eastern'],['America/Denver','Mountain'],['America/Los_Angeles','Pacific'],['auto','Device']])}
   <div class="gs-sec">ESPN connection</div><div class="gopt" style="flex-wrap:wrap"><div style="flex:1 1 100%"><b>ESPN data URL</b><small>Your private Cloudflare Worker URL (no cookies here — they live only in the Worker). Saved on this device only.</small></div><input type="url" data-sk="espnUrl" placeholder="https://espn-proxy.yourname.workers.dev" value="${esc(SET.espnUrl)}" style="max-width:100%;flex:1 1 100%"></div>
   ${tog('espnDirect','Try direct ESPN login','Uses your espn.com browser login if the browser allows it (usually desktop Chrome only)')}
   <div class="hint">${FT.slice(1).map(c=>`${esc(c.short)}: ${st(c)}`).join(' · ')}</div>`}
 function gRender(){$('gsB').innerHTML=settingsHTML()}
 $('gOpen').onclick=()=>{haptic();gRender();$('gs').classList.remove('hide')};$('gsX').onclick=()=>$('gs').classList.add('hide');$('gs').addEventListener('click',e=>{if(e.target===$('gs'))$('gs').classList.add('hide');const t=e.target.closest('[data-ft]');if(t){haptic();SET.fteam=t.dataset.ft;saveSet();UI.mi=null;UI.side=null;gRender();paintF();showTab('tF');$('gs').classList.add('hide')}});
 $('gsB').addEventListener('change',e=>{const k=e.target.dataset.sk;if(!k)return;let v=e.target.type==='checkbox'?e.target.checked:e.target.value;if(typeof SDEF[k]==='number')v=+v;if(k==='espnUrl'){v=String(v).trim();if(v&&!/^https:\/\/[^\s]+$/.test(v)){toast('ESPN data URL must start with https://');return}}
   SET[k]=v;saveSet();applyLook();if(k==='tz'){setTZ();paintGames();updLabel()}if(k==='fav'){paintGames()}if(k==='ns'){NSREV.clear();paintGames()}if(k==='rs')sched();if(k==='espnUrl'||k==='espnDirect'){for(const c of FT.slice(1)){delete FD[c.key];delete WV[c.key]}fT=0;loadFantasy().then(gRender)}});
 /* gestures: swipe weeks on Scores (ignores screen edges for iOS back-swipe), pull-to-refresh everywhere */
 let sx=0,sy=0,st0=0,pulling=false,dy=0;const ptr=$('ptr');
 document.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;st0=Date.now();const el=e.target&&e.target.closest?e.target:null;pulling=scrollY<=0&&!(el&&el.closest('.ov,.tw,.fpick'));dy=0},{passive:true});
 document.addEventListener('touchmove',e=>{if(!pulling)return;const t=e.touches[0];dy=t.clientY-sy;if(dy>0&&Math.abs(t.clientX-sx)<dy){const p=Math.min(dy,120);ptr.classList.toggle('ready',p>70);ptr.style.opacity=Math.min(1,p/64);ptr.style.transform=`translateY(${p*.42-28}px) rotate(${p*2.2}deg) scale(${.9+Math.min(p,100)/280})`}},{passive:true});
 document.addEventListener('touchend',async e=>{const t=e.changedTouches[0],dx=t.clientX-sx,ddy=t.clientY-sy;
   if(pulling&&dy>70){haptic();ptr.classList.add('spin');ptr.classList.remove('ready');ptr.style.transform='translateY(8px) scale(1)';const v=SET.tab;try{if(v==='tT')await loadStandings(true);else if(v==='tF'){fT=0;for(const k in WV)delete WV[k];await loadFantasy()}else await load(false)}catch(err){}ptr.classList.remove('spin')}
   ptr.classList.remove('ready');ptr.style.opacity=0;ptr.style.transform='';pulling=false;
   const el=e.target&&e.target.closest?e.target:null;if(SET.tab==='tS'&&!(el&&el.closest('.card.open,.ov,.tw'))&&sx>24&&sx<innerWidth-24&&Math.abs(dx)>70&&Math.abs(dx)>Math.abs(ddy)*1.8&&Date.now()-st0<700)shift(dx<0?1:-1)},{passive:true});
 /* iPhone extras: app badge (live games), update check, offline shell, splash, keyboard shortcuts on desktop */
 function badge(n){try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge()}}catch(e){}}
 const MYVER=document.querySelector('meta[name=app-version]')?.content;let lastChk=0;
 async function chkUpdate(){if(location.protocol==='file:'||!MYVER||Date.now()-lastChk<6e4)return;lastChk=Date.now();try{const t=await (await fetch(location.pathname+'?v='+Date.now(),{cache:'no-store'})).text();const m=t.match(/name="app-version" content="([^"]+)"/);if(m&&m[1]!==MYVER){toast('Updating to the latest version…');setTimeout(()=>location.reload(),900)}}catch(e){}}
 if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){chkUpdate();if(SET.tab==='tS')load(false);else if(SET.tab==='tF')loadFantasy(true)}});
 addEventListener('keydown',e=>{if(e.target.closest('input,select'))return;if(e.key==='ArrowLeft'&&SET.tab==='tS')shift(-1);if(e.key==='ArrowRight'&&SET.tab==='tS')shift(1);if(e.key==='Escape'){$('ov').classList.add('hide');$('gs').classList.add('hide')}});
 addEventListener('resize',pill);
 applyLook();const q=new URLSearchParams(location.search).get('tab');const startTab=q==='fantasy'?'tF':q==='standings'?'tT':q==='scores'?'tS':(TABS[SET.tab]?SET.tab:'tS');
 load(true).then(()=>{setTimeout(()=>$('splash').classList.add('out'),150)});setTimeout(()=>$('splash').classList.add('out'),3000);
 showTab(startTab);loadFantasy(true);requestAnimationFrame(pill);
})();
