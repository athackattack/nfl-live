/* DEV PREVIEW ONLY — loaded only with ?mock=espn. SAMPLE data shaped exactly like ESPN's
   lm-api-reads /apis/v3/games/ffl/.../leagues/{id}?view=mTeam&view=mRoster&view=mMatchup... response.
   Names/IDs below are SAMPLE values, not Adam's real ESPN rosters. */
(function(){
 const P=[[3139477,'Patrick Mahomes',1,12],[4241457,'Najee Harris',2,24],[4429795,'Jahmyr Gibbs',2,8],[4241389,'CeeDee Lamb',3,6],[4362628,"Ja'Marr Chase",3,4],[4361307,'Trey McBride',4,22],[3054850,'Josh Allen',1,2],[4430807,'Bijan Robinson',2,1],[4596448,'Puka Nacua',3,14],[4426515,'Garrett Wilson',3,20],[3116365,'Mark Andrews',4,33],[-16016,'Vikings D/ST',16,16],[-16021,'Eagles D/ST',16,21],[15683,'Justin Tucker',5,33],[3953687,'Brandon Aubrey',5,6],[4569618,'Rashee Rice',3,12],[4430737,'Kyren Williams',2,14],[4047365,'Josh Jacobs',2,9],[4361370,'Chris Olave',3,18],[4372016,'Jaylen Waddle',3,15]];
 const pl=(i,sp,act,pr)=>{const [id,n,pos,pro]=P[i%P.length];return {playerId:id,lineupSlotId:sp,playerPoolEntry:{appliedStatTotal:act,player:{id,fullName:n,defaultPositionId:pos,proTeamId:pro,injuryStatus:i%7===3?'QUESTIONABLE':'ACTIVE',stats:[{scoringPeriodId:7,statSourceId:0,statSplitTypeId:1,appliedTotal:act},{scoringPeriodId:7,statSourceId:1,statSplitTypeId:1,appliedTotal:pr}]}}}};
 const SL=[0,2,2,4,4,6,23,16,17,20,20,20,20];
 const roster=s=>SL.map((sp,k)=>pl(s+k*3,sp,+(Math.abs(Math.sin(s*7+k))*(sp===20?14:20)*(k%3===0?0:1)).toFixed(2),+(6+Math.abs(Math.cos(s+k))*12).toFixed(2)));
 window.ESPN_MOCK=function(id,qs){
  const n=id==='1811214'?12:10,me=id==='1811214'?3:5,mine=id==='1811214'?["Treebeard's Ent Army"]:['Beaver First'];
  const names=['Gridiron Gurus','Sunday Scaries','Hail Murray','Kittle Me This','Mixon It Up','Tua Legit','Bijan Mustard','The Waddlers','Lamb Chops','Chase the Bag','Purdy Good','Dak to the Future'];
  if(/kona_player_info/.test(qs))return Promise.resolve({players:P.slice(8,20).map((p,i)=>({status:'FREEAGENT',player:{id:p[0],fullName:p[1],defaultPositionId:p[2],proTeamId:p[3],ownership:{percentOwned:60-i*4},stats:[{scoringPeriodId:7,statSourceId:1,appliedTotal:12-i*.6}]}}))});
  const teams=[...Array(n)].map((_,i)=>{const id=i+1;return {id,abbrev:'T'+id,name:id===me?mine[0]:names[i],owners:['{SAMPLE-'+id+'}'],playoffSeed:((i*5)%n)+1,logo:'',record:{overall:{wins:(i*3)%7,losses:6-(i*3)%7,ties:0,pointsFor:620+i*13.4,pointsAgainst:640-i*7.1}},roster:{entries:roster(id)}}});
  const schedule=[];for(let i=0;i<n;i+=2){const a=teams[i],h=teams[i+1];const sum=t=>t.roster.entries.filter(e=>e.lineupSlotId!==20).reduce((s,e)=>s+e.playerPoolEntry.appliedStatTotal,0);
   schedule.push({id:100+i,matchupPeriodId:7,away:{teamId:a.id,totalPoints:sum(a),totalPointsLive:sum(a),rosterForCurrentScoringPeriod:{entries:a.roster.entries}},home:{teamId:h.id,totalPoints:sum(h),totalPointsLive:sum(h),rosterForCurrentScoringPeriod:{entries:h.roster.entries}},winner:'UNDECIDED'})}
  // make sure "my" team plays in matchup period 7
  return Promise.resolve({id:+id,seasonId:2026,scoringPeriodId:7,status:{currentMatchupPeriod:7,isActive:true},settings:{name:(id==='1811214'?'153 Overlords':'We dem girlz')+' (SAMPLE)'},members:teams.map(t=>({id:t.owners[0],displayName:'Owner '+t.id})),teams,schedule,_me:[me]})};
})();
