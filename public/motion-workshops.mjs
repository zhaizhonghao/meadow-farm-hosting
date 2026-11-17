// Moving details share the actual tile anchors of map-workshops.mjs. The map
// draws these after each building, before painting the next, nearer building.
// All motion depends on the supplied game clock; no per-building timers.
const TAU = 2 * Math.PI;
const cycle = (time, period) => time / period - Math.floor(time / period);
const workshopTypes = new Set(['well','mill','bakery','dairy','cakery','vegetable','lumber','wheat','tree']);

function brush(p, b) {
  const at = (u,v,z) => p.iso(b.x+u,b.y+v,z);
  const beam = (a,b,color,width) => p.line(at(...a),at(...b),color,Math.max(.65,p.tile*width));
  const oval = (u,v,z,rx,ry,color) => p.ellipse(at(u,v,z),p.tile*rx,p.tile*ry,color);
  const face = (vertices,color) => p.poly(vertices.map(v=>at(...v)),color);
  return {p,at,beam,oval,face};
}

// Water glints stay on the near half of the circular pool, clear of the bucket.
function well(d, rank, ordinary, time, working) {
  const brick = ordinary && rank===1, z = brick ? .624 : .399;
  const c = d.at(brick ? .45 : .48,brick ? .50 : .53,z);
  const tile = d.p.tile, drift = Math.sin(time*1.8)*.041;
  for(let i=0;i<2;i++){
    const x = c.x+tile*(drift-.13+i*.15), y = c.y+tile*(.066+i*.028);
    d.p.line({x,y},{x:x+tile*(.09+.018*Math.sin(time*2.5+i)),y:y-tile*.012},'#d2efdf',Math.max(.7,tile*.019));
  }
  if(!working)return;
  if(rank===2){
    // The high-pressure discharge ends at the surface inside the rim.
    const t = cycle(time,.72);
    if(d.p.facing(1,0)){
      d.beam([.80,.41,.52],[.80,.41,.399],'#75babd',.046);
      d.oval(.8,.41,.505-t*.096,.028,.042,'#dcf3e6');
    }
  }else{
    const t = cycle(time,1.12);
    const h = brick ? .70 : .45;
    d.oval(brick ? .45 : .46,.54,h-(h-z)*t*t,.026,.035,'#bee6df');
    if(brick && d.p.facing(1,0)){
      const spin=time*2.6;
      const handle=[.96,.52+.275*Math.cos(spin),1.11+.275*Math.sin(spin)];
      d.beam([.915,.52,1.11],handle,'#ba9154',.04);
      d.oval(...handle,.048,.046,'#dbad65');
    }
  }
}

function smoke(d,u,v,z,time) {
  for(let i=0;i<3;i++){
    const t=cycle(time+i*.84,2.52), size=.047+.06*t;
    const p=d.at(u,v,z+.52*t), tile=d.p.tile;
    const alpha=.56*Math.sin(t*Math.PI);
    d.p.ellipse({x:p.x+tile*(.13*t+.032*Math.sin(TAU*t)),y:p.y},tile*size,tile*size*.80,'rgba(250,242,217,'+alpha.toFixed(2)+')');
  }
}

function bakery(d,rank,time,working) {
  // A cowl follows the breeze even when the ovens are cold.
  const u=.68,v=.29, yaw=.7*Math.sin(time*1.7);
  const dx=.17*Math.cos(yaw), dy=.17*Math.sin(yaw);
  d.beam([u,v,1.31],[u,v,1.47],'#8e795d',.027);
  d.face([[u-dx*.6,v-dy*.6,1.42],[u+dx,v+dy,1.43],[u+dx,v+dy,1.53],[u,v,1.49]],'#a89473');
  if(!working)return;
  smoke(d,u,v,1.47,time);
  if(rank===1){
    smoke(d,.32,.29,1.32,time+.87);
    if(d.p.facing(0,1)){
      for(const x of [.31,.69]){
        const flicker=Math.sin(time*6+x*13)*.036;
        d.face([[x-.104,.879,.105],[x+.10,.879,.105],[x+.065,.879,.175],[x+.034,.879,.151],[x-.014,.879,.239+flicker],[x-.058,.879,.162]],'#f18f41');
        d.face([[x-.044,.880,.111],[x+.054,.880,.111],[x-.007,.880,.184-flicker*.45]],'#ffdc81');
      }
    }
  }
}

function pasture(d,time) {
  // The last joint meets the black-and-white cow's fixed tail. Keeping this
  // below the back line preserves the cow's silhouette from the opposite side.
  if(d.p.facing(-1,0)||d.p.facing(0,1)){
    const swing=Math.sin(time*2.85+.6*Math.sin(time*1.4));
    const tip=[.068+.033*swing,.77+.10*swing,.109+.07*swing*swing];
    d.beam([.107,.820,.145],tip,'#776750',.028);
    d.oval(...tip,.049,.036,'#504e3e');
  }
  // A loose ear-tag hangs from the near ear and bobs as the cow chews.
  const nearY = d.p.facing(0,1) ? .855 : .57;
  const y = nearY+.015*Math.sin(time*2.1), u=.662+.017*Math.cos(time*2.1);
  if(d.p.facing(1,0)||d.p.facing(0,1)){
    d.face([[u-.026,y,.525],[u+.032,y,.533],[u+.05,y,.458],[u-.018,y,.45]],'#d9ac52');
  }
  // A small bell hangs above the shed ridge, visible even behind the cow.
  const wobble=.06*Math.sin(time*1.9);
  d.beam([.34,.25,.75],[.34,.25,.93],'#9d7752',.026);
  d.beam([.34,.25,.92],[.44,.25,.92],'#9d7752',.022);
  d.oval(.44+wobble*.4,.25,.87,.055,.052,'#bc924d');
  d.oval(.44+wobble,.25,.815,.022,.022,'#7e633c');
}

function cakeShop(d,rank,time,working) {
  // A little pastry pennant is tied to the cake topper, clear of the windows
  // and the mixer. Its free edge trails the pole rather than moving as a block.
  const bend=.049*Math.sin(time*2.4);
  d.beam([.52,.46,1.21],[.54,.46,1.45],'#91754f',.022);
  d.face([[.54,.46,1.45],[.70,.49+bend,1.41+bend*.4],[.64,.50+bend,1.38],[.70,.49+bend,1.35+bend*.2],[.54,.46,1.37]],'#ce7f87');
  if(!working)return;
  if(rank===2 && (d.p.facing(1,0)||d.p.facing(0,1))){
    const spin=time*5.2,dx=.074*Math.cos(spin),dy=.074*Math.sin(spin);
    d.beam([.76,.79,.42],[.74+dx,.84+dy,.26],'#e8e3c8',.024);
    d.beam([.74+dx,.84+dy,.26],[.74,.84,.25],'#9caea4',.021);
  }else if(d.p.facing(0,1)){
    // Cake rotates for icing behind the serving window, above its sill.
    const t=cycle(time,2.7), u=.50+.11*Math.sin(t*TAU);
    d.oval(.46,.819,.225,.13,.052,'#dca48c');
    d.oval(.46,.819,.258,.13,.053,'#fff0cb');
    d.oval(u,.82,.292,.031,.030,'#bd6770');
  }
}

function vegetables(d,rank,time,working,growth) {
  const nearV=d.p.facing(0,1) ? .85 : .17;
  const height=.16+growth*.12;
  const sway=Math.sin(time*2.1)*.054;
  for(const u of [.21,.77]){
    d.face([[u,nearV,.115],[u-.074,nearV-.01,height+.015],[u-.02+sway,nearV,.08+height],[u+.021,nearV+.015,height]],'#76a35f');
  }
  if(!working)return;
  if(rank===0){
    // Basic plots get water along the furrow, without sprinkler hardware.
    const u=.12+.6*cycle(time,2.4);
    d.beam([u,.68,.077],[u+.094,.68,.077],'#91bbb0',.031);
  }else{
    for(const v of [.22,.77])for(let i=0;i<3;i++){
      const t=cycle(time+i*.36+v*.5,1.08);
      const u=.075+.64*t, y=v+.082*t*Math.sin(time*1.6);
      const z=.295+.60*t*(1-t)-.18*t*t;
      d.oval(u,y,z,.025+.008*t,.026,'#c2e8dc');
    }
  }
}

function axe(d,time,working) {
  // A local worker raises the hatchet slowly and strikes the same log on
  // each downstroke. The raised and lowered blade use a single rigid pivot.
  if(!working){
    d.beam([.35,.51,.24],[.50,.47,.67],'#825728',.05);
    d.face([[.42,.47,.56],[.60,.47,.61],[.58,.47,.76],[.44,.47,.70]],'#c8d3c5');
    return;
  }
  const t=cycle(time,1.75);
  const lift=t<.72 ? t/.72 : Math.max(0,(1-t)/.28);
  const angle=-.32+2.07*lift*lift*(3-2*lift);
  const origin=[.355,.54,.417], c=Math.cos(angle),s=Math.sin(angle);
  const part=(r,across)=>[origin[0]+r*c-across*s,.54,origin[2]+r*s+across*c];
  for(const u of [.215,.278])d.beam([u,.575,.275],[u,.575,.055],'#645f51',.042);
  d.oval(.24,.57,.38,.085,.133,'#678476');
  d.oval(.24,.57,.565,.076,.078,'#ddb687');
  d.oval(.24,.57,.619,.105,.04,'#ac8052');
  d.beam([.24,.57,.43],origin,'#c8a375',.046);
  d.beam(part(-.038,0),part(.35,0),'#825728',.05);
  d.face([part(.24,.047),part(.36,.067),part(.42,-.071),part(.31,-.084)],'#b5c4bf');
}

function lumber(d,rank,time,working,liveAxe) {
  // A short marking tape hangs from the outer corner of the timber shed.
  const flutter=.047*Math.sin(time*2.5);
  d.beam([.76,.435,.60],[.76+flutter,.448,.445],'#d3ab6e',.042);
  if(rank===0 && liveAxe)axe(d,time,working);
  if(!working)return;
  if(rank>0 && (d.p.facing(0,1)||d.p.facing(1,0))){
    const theta=time*5.65;
    for(let i=0;i<3;i++){
      const a=theta+i*TAU/3, c=Math.cos(a),s=Math.sin(a);
      d.beam([.47+c*.067,.519,.43+s*.067],[.47+c*.152,.519,.43+s*.152],'#869c98',.024);
    }
  }
  const strike=cycle(time,1.75);
  if(rank===0 && strike<.94 && strike>.28)return;
  const burst=rank===0 ? cycle(strike+.06,1)/.34 : cycle(time,.85);
  for(let i=0;i<3;i++){
    const t=rank===0 ? Math.min(1,burst) : (burst+i/3)%1;
    if(t>=1)continue;
    const u=(rank===0 ? .71 : .55)+(.16+i*.038)*t, v=.53+(.035+i*.046)*t;
    const z=.36+(.7+i*.09)*t*(1-t)-.14*t;
    d.beam([u,v,z],[u+.027,v+.006,z+.025*(1-t)],'#d9b77a',.026);
  }
}

function tree(d,b,time,growth) {
  if(growth<.28){
    // Only the grasses beside the cut stump move. The fruit and crown return
    // when the actual regrowth stage brings them back.
    const bend=Math.sin(time*2.2)*.054;
    d.face([[.67,.62,.015],[.70+bend,.615,.17],[.705,.62,.027]],'#769857');
    return;
  }
  const size=Math.max(.35,growth), c=d.at(.5,.5,.83*size),scale=d.p.tile*size;
  const sway=.05*Math.sin(time*2.15), dx=b.scenery ? .15 : -.14;
  const leaf=(x,y,rx,ry,color)=>d.p.ellipse({x:c.x+x*scale,y:c.y+y*scale},rx*scale,ry*scale,color);
  leaf(dx+sway*.6,-.25+sway*.7,.115,.055,'#84a965');
  leaf(dx+.12+sway,-.29+sway*.8,.083,.044,'#a2be76');
}

// Mills already turn their sails and the wheat crop already bends its stalks
// in the main pass. Returning true avoids drawing the same components twice.
export function drawWorkshopMotion(p,b,model,motion) {
  if(!workshopTypes.has(b.type))return false;
  if(b.type==='mill'||b.type==='wheat')return true;
  const d=brush(p,b);
  const live=motion.enabled!==false && !motion.preview;
  const time=live ? motion.time : 0;
  const working=live && !!motion.working;
  const rank=model?.grade??model?.tier??0;
  switch(b.type){
    case 'well': well(d,rank,!!b.ordinary,time,working);break;
    case 'bakery': bakery(d,rank,time,working);break;
    case 'dairy': pasture(d,time);break;
    case 'cakery': cakeShop(d,rank,time,working);break;
    case 'vegetable': vegetables(d,rank,time,working,motion.growth??1);break;
    case 'lumber': lumber(d,rank,time,working,live);break;
    case 'tree': tree(d,b,time,motion.growth??1);break;
  }
  return true;
}
