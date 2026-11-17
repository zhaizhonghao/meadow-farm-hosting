const productNames={bread:'面包',milk:'牛奶',cake:'蛋糕',vegetables:'蔬菜',wood:'木材'};
const produced=(resource,target)=>({kind:'produced',resource,target,label:`新生产 ${target} 份${productNames[resource]}`});
const shipped=(resource,target)=>({kind:'shipped',resource,target,label:`运回结算 ${target} 份${productNames[resource]}`});
const trips=target=>({kind:'trips',target,label:`完成 ${target} 次货车往返`});
const breadLine=[['well'],['mill'],['bakery']],milkLine=[...breadLine,['dairy']],cakeLine=[...milkLine,['cakery'],['solar','wind']];
const PREVIOUS_CHALLENGES=[
 {id:'bread-rush',stage:1,name:'面包保供',difficulty:'起步',seconds:300,reward:24,requires:breadLine,goals:[produced('bread',6),shipped('bread',9),trips(3)],tip:'建议 2 块麦田，水井、磨坊、面包房各 1 座，配合综合仓库。先接通道路，再开始计时。'},
 {id:'bread-supply',stage:2,name:'早餐扩产',difficulty:'熟练',seconds:420,reward:32,requires:breadLine,goals:[produced('bread',9),shipped('bread',12),trips(4)],tip:'建议 3 块麦田；基础设施即可完成。面包满 3 份就发车，让生产和运输同时进行。'},
 {id:'dairy-team',stage:3,name:'牧场协作',difficulty:'协作',seconds:540,reward:44,requires:milkLine,goals:[produced('milk',10),produced('bread',12),shipped('milk',9),shipped('bread',12),trips(7)],tip:'建议 3～4 块麦田，增加 1 座牧场。准备时间不限，先卖面包赚经营币，再补齐牧场。'},
 {id:'cake-sprint',stage:4,name:'甜品工坊',difficulty:'综合',seconds:660,reward:60,requires:cakeLine,goals:[produced('cake',6),produced('milk',14),produced('bread',12),shipped('cake',6),shipped('milk',12),shipped('bread',12),trips(11)],tip:'准备期先售卖面包，攒够经营币再建蛋糕房和能源设施。建议 4 块麦田、2 座基础磨坊；留出面包、牛奶给蛋糕原料。'},
 {id:'harvest-feast',stage:5,name:'丰收庆典',difficulty:'经营高手',seconds:900,reward:80,requires:cakeLine,goals:[produced('cake',10),produced('milk',20),produced('bread',15),shipped('cake',10),shipped('milk',15),shipped('bread',15),trips(15)],tip:'建议 4 块麦田、2 座基础磨坊。先备齐产线和少量原料再计时；基础设施也能达成，NFT 可以提高容错。'}
];
const gardenLine=[...breadLine,['vegetable']],ranchGardenLine=[...gardenLine,['dairy']];
const dessertGardenLine=[...ranchGardenLine,['cakery'],['solar','wind']];
export const CHALLENGES=[
 {...PREVIOUS_CHALLENGES[0],focus:'接通面包产线，学会装车与回站结算。',goals:[produced('bread',6),shipped('bread',6),trips(2)]},
 {...PREVIOUS_CHALLENGES[1],name:'田园双线',requires:gardenLine,focus:'新增蔬菜订单，两条产线共用清水与货车。',
  goals:[produced('bread',12),shipped('bread',12),produced('vegetables',24),shipped('vegetables',24),trips(8)],
  tip:'建议 3 块麦田、1 块菜地。蔬菜和面包共用水井与货车，交替发货，避免只运一种产品。'},
 {...PREVIOUS_CHALLENGES[2],requires:ranchGardenLine,focus:'加入牧场，同时供应面包、牛奶和蔬菜。',
  goals:[produced('bread',16),shipped('bread',15),produced('milk',21),shipped('milk',21),produced('vegetables',42),shipped('vegetables',42),trips(19)],
  tip:'建议 4 块麦田、1 块菜地、1 座牧场。先补齐三条产线，观察缺料和在途货物，按未完成订单轮换发车。'},
 {...PREVIOUS_CHALLENGES[3],requires:dessertGardenLine,focus:'新增蛋糕与能源，平衡原料加工和直接出售。',
  goals:[produced('bread',30),shipped('bread',24),produced('milk',30),shipped('milk',24),produced('cake',16),shipped('cake',16),produced('vegetables',54),shipped('vegetables',54),trips(33)],
  tip:'建议 4 块麦田、2 座磨坊，加上菜地、牧场、蛋糕房和能源。留出面包与牛奶做蛋糕，完成蛋糕目标后暂停烘焙或启用原料平衡。'},
 {...PREVIOUS_CHALLENGES[4],requires:[...dessertGardenLine,['lumber']],focus:'新增可再生林业，同时调度五种商品与共享仓储。',
  goals:[produced('bread',39),shipped('bread',30),produced('milk',39),shipped('milk',30),produced('cake',26),shipped('cake',26),produced('vegetables',66),shipped('vegetables',66),produced('wood',27),shipped('wood',27),trips(53)],
  tip:'在甜品产线之外增加 1 座伐木场，范围内种 4 棵果树轮流采伐。建议 4 块麦田、2 座磨坊；留意仓储空间，可增建仓库或用快递站缩短往返。'}
];
// Replays select the rules that were offered at the recorded start time.
// A client-supplied plan is never used to verify an on-chain reward.
export const CHALLENGE_RULES_UPDATED_AT=1794837802060;
export const challengePlansAt=now=>now<CHALLENGE_RULES_UPDATED_AT?PREVIOUS_CHALLENGES:CHALLENGES;
// Preserve the rules and promised payout of an attempt already in progress.
const LEGACY_CHALLENGES=[
 {...PREVIOUS_CHALLENGES[0],stage:1,difficulty:'基础'},
 {id:'dairy-team',stage:1,name:'牧场协作（原任务）',difficulty:'进阶',seconds:360,reward:36,requires:milkLine,goals:[produced('milk',10),produced('bread',4),shipped('milk',9),trips(3)]},
 {id:'cake-sprint',stage:1,name:'甜品竞速（原任务）',difficulty:'挑战',seconds:420,reward:48,requires:cakeLine,goals:[produced('cake',6),produced('milk',10),shipped('cake',6),trips(4)]}
];
const dayFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
export const today=(now=Date.now())=>dayFormatter.format(new Date(now));
export const dayEnd=now=>new Date(`${today(now)}T00:00:00+08:00`).getTime()+86400000;
const currentRound=(s,a)=>!s.roundMode||!!s.round&&!s.round.legacy&&!s.round.rewardClaimed&&(!a||a.roundId===s.round.id);
function clock(s,now){s.challengeClock=Math.max(s.challengeClock||0,now);return s.challengeClock}
const nextStage=d=>Math.min(CHALLENGES.length,d.stageClaims.length+1);
const attemptPlan=a=>a?.planSnapshot||CHALLENGES.find(p=>p.id===a?.planId);
export function dailyState(s,now=Date.now()){
 now=clock(s,now);const date=today(now);
 if(!s.daily||s.daily.date!==date)s.daily={version:2,date,deliveries:0,claimed:false,stageClaims:[],challenge:null,attempts:0};
 const d=s.daily;
 if(d.version!==2){
  const old=LEGACY_CHALLENGES.find(p=>p.id===d.challenge?.planId)||LEGACY_CHALLENGES[0];
  d.stageClaims=d.claimed?[{stage:1,planId:old.id,reward:old.reward,roundId:d.challenge?.roundId,legacy:true}]:[];
  if(d.claimed)d.challenge=null;
  else if(d.challenge){d.challenge.stage=1;d.challenge.planSnapshot=structuredClone(old)}
  d.version=2;d.claimed=false;
 }
 d.stageClaims??=[];d.deliveries??=0;d.attempts??=d.challenge?1:0;d.claimed=d.stageClaims.length>=CHALLENGES.length;
 d.planId=CHALLENGES[nextStage(d)-1].id;
 const a=d.challenge;
 // A restored older save may predate plan snapshots. Pin its original terms
 // before viewing or retrying it, including after a client rules update.
 if(a && !a.planSnapshot){
  const previous=PREVIOUS_CHALLENGES.find(p=>p.id===a.planId);
  if(previous)a.planSnapshot=structuredClone(previous);
 }
 if(a?.status==='active'&&now>=a.endsAt)a.status='expired';
 return d;
}
export const challengePlan=(s,now=Date.now())=>{const d=dailyState(s,now);return attemptPlan(d.challenge)||challengePlansAt(now)[nextStage(d)-1]};
export function goalValue(a,goal){return !a?0:goal.kind==='trips'?a.trips:(a[goal.kind]?.[goal.resource]||0)}
export function challengeView(s,now=Date.now()){
 const d=dailyState(s,now),a=d.challenge,plan=challengePlan(s,now);now=clock(s,now);
 const canFitToday=dayEnd(now)-now>=plan.seconds*1000,retrySeconds=canFitToday?plan.seconds:0,stage=nextStage(d);
 return {plan,attempt:a,stage,totalStages:CHALLENGES.length,stageClaims:d.stageClaims,earned:d.stageClaims.reduce((n,c)=>n+c.reward,0),stages:CHALLENGES.map(p=>({...(a&&p.stage===a.stage?plan:p),status:d.stageClaims.some(c=>c.stage===p.stage)?'claimed':p.stage===stage?'current':'locked'})),canFitToday,retrySeconds,attempts:d.attempts||0,needsRebuild:!d.claimed&&!currentRound(s),status:d.claimed?'claimed':a?.status||'ready',remaining:a?Math.max(0,Math.ceil((a.endsAt-(a.completedAt??now))/1000)):plan.seconds,elapsed:a?Math.max(0,Math.ceil(((a.completedAt??now)-a.startedAt)/1000)):0,goals:plan.goals.map(g=>({...g,value:goalValue(a,g)}))};
}
export function beginChallenge(s,id,now=Date.now(),retry=false){
 const d=dailyState(s,now),unfinished=d.challenge&&['active','expired'].includes(d.challenge.status),plan=retry&&unfinished?attemptPlan(d.challenge):challengePlansAt(now)[nextStage(d)-1];now=clock(s,now);
 if(!plan||id!==plan.id||d.claimed||(d.challenge&&!(retry&&unfinished))||!currentRound(s)||s.roundMode&&!s.round.builds||dayEnd(now)-now<plan.seconds*1000)return false;
 d.attempts=(d.attempts||0)+1;
 d.challenge={id:`${s.accountId||'local'}:${d.date}:stage-${nextStage(d)}:${now}:${d.attempts}`,stage:nextStage(d),planId:id,planSnapshot:structuredClone(plan),roundId:s.round?.id,startedAt:now,endsAt:now+plan.seconds*1000,status:'active',produced:{},shipped:{},trips:0};return true;
}
export function retryChallenge(s,now=Date.now()){const d=dailyState(s,now);if(!d.challenge||!['active','expired'].includes(d.challenge.status))return false;return beginChallenge(s,d.challenge.planId,now,true)}
export function activeChallengeId(s,now=Date.now()){const d=dailyState(s,now);return d.challenge?.status==='active'&&d.challenge.stage===nextStage(d)&&currentRound(s,d.challenge)?d.challenge.id:null}
function completeIfReady(s,a,now){const plan=attemptPlan(a);if(plan.goals.every(g=>goalValue(a,g)>=g.target)){a.status='completed';a.completedAt=clock(s,now)}}
export function recordChallengeProduction(s,outputs,attemptId,now=Date.now()){
 const a=dailyState(s,now).challenge;if(!a||a.status!=='active'||a.id!==attemptId||!currentRound(s,a))return;
 for(const [k,v]of Object.entries(outputs))a.produced[k]=(a.produced[k]||0)+v;
 completeIfReady(s,a,now);
}
export function recordChallengeDelivery(s,delivery,resource,amount,now=Date.now()){
 const a=dailyState(s,now).challenge;if(!a||a.status!=='active'||delivery.challengeId!==a.id||!currentRound(s,a))return;
 a.trips++;a.shipped[resource]=(a.shipped[resource]||0)+amount;completeIfReady(s,a,now);
}
export function dailyCleared(s,now=Date.now()){const d=dailyState(s,now);return d.stageClaims.length>0||d.challenge?.status==='completed'}
export function claimDailyReward(s,now=Date.now()){
 const d=dailyState(s,now),a=d.challenge;if(d.claimed||a?.status!=='completed'||a.stage!==nextStage(d)||!currentRound(s,a))return false;
 const plan=attemptPlan(a);s.token+=plan.reward;d.stageClaims.push({stage:a.stage,planId:plan.id,reward:plan.reward,claimedAt:clock(s,now),roundId:a.roundId,attemptId:a.id});
 d.challenge=null;d.claimed=d.stageClaims.length===CHALLENGES.length;d.planId=CHALLENGES[nextStage(d)-1].id;if(s.roundMode)s.round.rewardClaimed=true;return true;
}
