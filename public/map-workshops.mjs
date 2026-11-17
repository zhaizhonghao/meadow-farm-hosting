// Geometry is in tile coordinates. The map and shop can use the same models
// with different cameras. Only the mill sails and wheat tips use frame time.
const TAU = Math.PI * 2;

function brush(p, {x, y}) {
  const at = (u, v, z = 0) => p.iso(x + u, y + v, z);
  return {
    at, p,
    box: (u,v,w,d,h,wall,top,base=0) => p.box(x+u,y+v,w,d,h,wall,top,base),
    flat: (u,v,w,d,z,color) => p.quad(x+u,y+v,w,d,z,color),
    face: (points,color) => p.poly(points.map(([u,v,z]) => at(u,v,z)),color),
    beam: (a,b,color,width) => p.line(at(...a),at(...b),color,Math.max(.6,p.tile*width)),
    oval: (u,v,z,rx,ry,color) => p.ellipse(at(u,v,z),rx*p.tile,ry*p.tile,color),
    // Sort groups that stand on the same ground plane before painting.
    parts: (...items) => items.sort((a,b) => p.depth(x+a[0],y+a[1])-p.depth(x+b[0],y+b[1])).forEach(item => item[2]())
  };
}

// A round vessel projects to an ellipse regardless of the camera heading.
function vessel(d,u,v,z,r,h,wall,top) {
  const a = d.at(u,v,z), b = d.at(u,v,z+h), rx=r*d.p.tile, ry=rx*.5;
  d.p.ellipse(a,rx,ry,wall);
  d.p.poly([{x:a.x-rx,y:a.y},{x:b.x-rx,y:b.y},{x:b.x+rx,y:b.y},{x:a.x+rx,y:a.y}],wall);
  d.p.ellipse(b,rx,ry,top);
}

function gable(d,u,v,w,h,z,pitch,color) {
  const ridge=u+w/2, end=v+h, peak=z+pitch;
  const near=d.p.facing(0,1)?end:v;
  d.face([[u,near,z],[u+w,near,z],[ridge,near,peak]],d.p.shade(color,-32));
  const left=()=>d.face([[u,v,z],[ridge,v,peak],[ridge,end,peak],[u,end,z]],color);
  const right=()=>d.face([[ridge,v,peak],[u+w,v,z],[u+w,end,z],[ridge,end,peak]],d.p.shade(color,-19));
  d.parts([u+w*.25,v+h/2,left],[u+w*.75,v+h/2,right]);
  d.beam([ridge,v,peak],[ridge,end,peak],d.p.shade(color,22),.022);
}

// The deep well is uncovered. Its masonry courses support a heavy geared
// windlass, in contrast to the low bucket well and the upright pressure pump.
function brickWell(d) {
  const u=.45,v=.50, radius=.35;
  for(let course=0;course<3;course++){
    const z=.03+course*.17;
    vessel(d,u,v,z,.50,.17,'#dfbc98','#d6af89');
    vessel(d,u,v,z+.016,.505,.143,['#ad694e','#bf7857','#ae684e'][course],'#d59a70');
    for(let i=0;i<8;i++){
      const angle=(i+(course%2)*.5)*TAU/8,c=Math.cos(angle),s=Math.sin(angle);
      if(!d.p.facing(c,s))continue;
      const x=u+radius*c, y=v+radius*s;
      d.beam([x,y,z+.026],[x,y,z+.157],'#e8bf99',.021);
    }
  }
  vessel(d,u,v,.53,.54,.083,'#a8957d','#e7d2ac');
  d.oval(u,v,.617,.40,.20,'#534e42');
  d.oval(u,v,.623,.295,.14,'#598f92');
  const pier=x=>{
    d.box(x-.068,.444,.136,.14,.54,'#ae6c53','#cf9671',.59);
    d.box(x-.095,.42,.19,.19,.075,'#b6a188','#e9d3b3',1.115);
  };
  const axle=()=>{
    d.beam([.10,.52,1.11],[.90,.52,1.11],'#66513d',.067);
    d.beam([.32,.52,1.11],[.57,.52,1.11],'#b5864f',.115);
    d.beam([.45,.52,1.095],[.45,.52,.802],'#725238',.031);
    vessel(d,.45,.52,.705,.12,.135,'#996e48','#e2b67f');
    d.oval(.45,.52,.843,.084,.041,'#604d40');
  };
  const crank=()=>{
    const at=a=>[.915,.52+Math.cos(a)*.28,1.11+Math.sin(a)*.28];
    const hub=[.915,.52,1.11];
    for(let i=0;i<12;i++){
      const rim=at(i*TAU/12);
      d.beam(rim,at((i+1)*TAU/12),'#494f49',.058);
      if(i%3===0)d.beam(hub,rim,'#776e55',.032);
    }
    d.beam(at(TAU/12),[1.055,.763,1.25],'#cc9958',.067);
    d.oval(...hub,.064,.057,'#c58d52');
  };
  d.parts([.115,.52,()=>pier(.115)],[.45,.52,axle],[.78,.52,()=>pier(.78)],[.925,.52,crank]);
}

function waterWell(d, rank, trim, ordinary) {
  if(ordinary && rank===1){brickWell(d);return;}
  const wall = rank===1?'#af7156':ordinary?'#9b9b84':'#a4a597';
  vessel(d,.48,.53,.015,.48,.31,wall,'#dbc9a6');
  vessel(d,.48,.53,.30,.51,.09,rank===1?'#cb9779':'#b9b5a2','#efe1c3');
  d.oval(.48,.53,.395,.37,.185,'#46797d');
  d.oval(.48,.53,.397,.28,.128,'#88c3c3');
  if (rank===2) {
    // Pressure pump: a steel upright, regulator wheel, discharge elbow and gauge.
    d.box(.27,.30,.25,.24,.54,'#487b77','#95b1a1',.37);
    vessel(d,.39,.42,.88,.18,.14,'#587d75','#b5c8ad');
    d.beam([.40,.41,.83],[.80,.41,.83],'#c99452',.106);
    d.beam([.80,.41,.84],[.80,.41,.54],'#ad804b',.104);
    d.oval(.80,.41,.53,.065,.031,'#424e48');
    d.oval(.41,.58,.81,.095,.092,'#ac8450');
    d.oval(.41,.58,.816,.07,.066,'#fff0c7');
    d.beam([.41,.58,.815],[.448,.574,.856],'#714d38',.017);
  } else {
    // The wooden frame is open so the bucket and spindle read from both sides.
    for (const u of [.17,.76]) d.box(u,.46,.07,.12,.82,'#805c3b','#bc9964',.22);
    d.beam([.14,.52,.83],[.88,.52,.83],'#bf975d',.083);
    d.beam([.46,.52,.84],[.46,.52,.52],'#66533d',.021);
    vessel(d,.46,.52,.45,.095,.10,'#956e48','#d5ad73');
    d.beam([.86,.52,.84],[.86,.54,.68],'#795a40',.04);
    if (ordinary || rank===0) {
      gable(d,.025,.29,.94,.45,1.015,.24,trim || '#718e85');
    } else {
      // The spring-fed NFT has a second basin and a stone spillway.
      d.box(.72,.65,.18,.28,.15,'#adad96','#cbcdb2',.05);
      d.beam([.73,.63,.40],[.79,.80,.19],'#94d3d0',.055);
    }
  }
}

function mill(d, rank, accent, ordinary, time) {
  const planks = rank===0 && ordinary;
  const body = () => {
    // Tapered windmill tower with a timber cap; flat-sided mills otherwise
    // look almost identical to the village warehouse at distant zooms.
    const ring=(r,z)=>Array.from({length:8},(_,i)=>{
      const a=i*TAU/8+Math.PI/8;
      return [.5+r*Math.cos(a),.46+r*Math.sin(a),z];
    });
    const base=ring(.395,.04), shoulder=ring(.245,1.10);
    for(let i=0;i<8;i++){
      const j=(i+1)%8, a=(i+.5)*TAU/8+Math.PI/8;
      if(!d.p.facing(Math.cos(a),Math.sin(a)))continue;
      d.face([base[i],base[j],shoulder[j],shoulder[i]],d.p.shade(planks?'#b68c59':'#ded1ab',i%3*-10));
      if(planks)d.beam(base[i],shoulder[i],'#917044',.025);
    }
    vessel(d,.50,.46,1.04,.37,.13,'#776c56',accent||'#78908a');
    const brim=ring(.33,1.15);
    for(let i=0;i<8;i++){
      const j=(i+1)%8,a=(i+.5)*TAU/8+Math.PI/8;
      if(d.p.facing(Math.cos(a),Math.sin(a)))d.face([brim[i],brim[j],[.5,.46,1.52]],d.p.shade(accent||'#76908a',i%3*-12));
    }
    if(rank>=1)vessel(d,.50,.46,.42,.50,.055,'#836c50','#b7a37e');
    if(rank===2){
      d.beam([.20,.32,.45],[.26,.32,1.02],'#ac864c',.05);
      d.beam([.77,.32,.45],[.70,.32,1.02],'#ac864c',.05);
    }
  };
  const sails=()=>{
    const gilt=!ordinary && rank===2, hub=[.50,.79,1.10];
    d.beam([.50,.48,1.1],hub,'#776340',.12);
    for(let i=0;i<4;i++){
      const a=time/1700+i*Math.PI/2, c=Math.cos(a), s=Math.sin(a);
      const vertex=(r,t)=>[.5+c*r-s*t,.80,1.1+s*r+c*t];
      d.beam(vertex(0,0),vertex(.79,0),gilt?'#b48f3f':'#997b50',.042);
      d.face([vertex(.22,.016),vertex(.78,.016),vertex(.77,.195),vertex(.22,.11)],gilt?'#e9c661':'#fff2d0');
      d.beam(vertex(.50,0),vertex(.50,.156),gilt?'#a78437':'#c7b894',.018);
    }
    d.oval(.50,.805,1.10,.093,.084,gilt?'#ba913e':'#897554');
  };
  if(d.p.facing(0,1)){body();sails();}else{sails();body();}
}

function ovenMouth(d,u,v,width,fire=false) {
  const outline=(w,h,base)=>[[u-w,v,base],[u+w,v,base],[u+w,v,base+h*.65],[u+w*.67,v,base+h],[u-w*.67,v,base+h],[u-w,v,base+h*.65]];
  d.face(outline(width,.32,.08),'#bd7955');
  d.face(outline(width*.72,.235,.085),'#473d33');
  if(fire){
    d.face([[u-width*.59,v,.105],[u+width*.59,v,.105],[u+width*.45,v,.18],[u+width*.25,v,.155],
      [u+.009,v,.264],[u-width*.37,v,.159],[u-width*.47,v,.192]],'#ed9040');
    d.face([[u-width*.3,v,.112],[u+width*.27,v,.112],[u+.009,v,.196]],'#ffd16b');
  }else d.beam([u-width*.48,v,.113],[u+width*.44,v,.113],'#e9a951',.028);
}

function breadShop(d,rank,accent,hearthGlow) {
  const tileRoof=rank===2?'#ad7753':'#b56d50', ovens=rank===0?[.5]:[.31,.69];
  d.box(.13,.12,.74,.62,.52,'#eed8ac','#fbebc9');
  gable(d,.06,.07,.88,.70,.52,.38,tileRoof);
  // The main flue is also the origin of the existing work smoke.
  const flue=u=>{
    d.box(u-.083,.21,.166,.16,.59,'#9c6249','#be8e6e',.64);
    d.box(u-.106,.19,.212,.2,.078,'#aa7250','#dbab7b',1.23);
    d.flat(u-.055,.232,.11,.11,1.312,'#574b3f');
  };
  const flues=rank===0?[.68]:[.32,.68];
  d.parts(...flues.map(u=>[u,.29,()=>flue(u)]));
  const twin=rank===1;
  if(twin){
    // Project the twin hearths beyond the eaves so the fire is visible from
    // the standard elevated camera. The bread rack sits beside the ovens.
    d.box(.088,.675,.824,.20,.405,'#c08260','#e3ad7c');
    if(d.p.facing(0,1))for(const u of ovens)ovenMouth(d,u,.878,.177,hearthGlow);
  }else if(d.p.facing(0,1)){
    for(const u of ovens)ovenMouth(d,u,.743,rank===0?.20:.15);
    for(let i=0;i<6;i++){
      const u=.095+.135*i;
      d.face([[u,.73,.53],[u+.135,.73,.53],[u+.135,.93,.45],[u,.93,.45]],i%2?'#fff1c8':accent||'#ac684a');
    }
  }
  // The upgraded workshop carries an outdoor rack above the side counter.
  if(rank===2 && d.p.facing(1,0)){
    for(const v of [.22,.58])d.box(.87,v,.036,.04,.49,'#826c51','#c99c62');
    for(const z of [.16,.34]){
      d.box(.865,.19,.125,.45,.035,'#a38158','#cfab74',z);
      for(const v of [.27,.43,.57])d.oval(.92,v,z+.067,.067,.034,'#dfa455');
    }
  }
  if(twin && d.p.facing(1,0)){
    d.box(.88,.23,.12,.39,.095,'#a58258','#d5b27d',.12);
    for(const v of [.33,.51])d.oval(.947,v,.245,.073,.045,'#e0a04c');
  }else if(!twin && d.p.facing(0,1)){
    d.box(.17,.83,.65,.14,.12,'#9e7651','#d2ac75',.055);
    for(const u of [.26,.48,.69]){
      d.oval(u,.89,.225,.095,.05,'#d79849');
      d.beam([u-.03,.89,.247],[u,.89,.263],'#f5d89a',.017);
    }
  }
}

function churn(d,u,v,size) {
  vessel(d,u,v,.03,.105*size,.28*size,'#a6b7ae','#e4e6d5');
  vessel(d,u,v,.03+.28*size,.079*size,.04,'#9ba9a0','#dfe5d7');
}

function cow(d,u,v,z,size) {
  const b=(du,dv,w,h,e,col,top,base)=>d.box(u+du*size,v+dv*size,w*size,h*size,e*size,col,top,z+base*size);
  for(const du of [.04,.31])for(const dv of [.02,.18])b(du,dv,.055,.052,.16,'#514f43','#7b7663',0);
  b(0,0,.41,.24,.20,'#f6eed8','#fff8e3',.13);
  b(.085,-.005,.105,.25,.14,'#4d5549','#586050',.20);
  b(.27,.13,.08,.114,.10,'#475249','#586050',.22);
  b(.335,.04,.11,.16,.16,'#e9debf','#f6eed6',.26);
  b(.39,.015,.145,.21,.17,'#e8dfc6','#fff3d8',.25);
  b(.485,.035,.082,.17,.07,'#cb9783','#e5b59b',.24);
  for(const dv of [-.045,.205])b(.39,dv,.057,.071,.045,'#5d5a48','#726b53',.38);
  d.beam([u,v+.11*size,z+.26*size],[u-.035*size,v+.18*size,z+.09*size],'#625643',.02);
}

function pasture(d,rank,accent) {
  d.flat(.035,.035,.93,.93,.025,'#96b373');
  const rails=(v)=>{
    d.beam([.05,v,.18],[.94,v,.18],'#d6bb8a',.044);
    d.beam([.05,v,.33],[.94,v,.33],'#c8a77a',.040);
    for(const u of [.05,.47,.92])d.box(u,v,.045,.047,.38,'#a4875d','#e1c59a');
  };
  d.parts(
    [.5,.07,()=>rails(.07)], [.5,.94,()=>rails(.94)],
    [.31,.29,()=>{d.box(.06,.10,.51,.37,.45,'#a96149','#d28b68');gable(d,.025,.045,.60,.48,.45,.30,accent||'#8d584a');
      if(d.p.facing(0,1))d.face([[.16,.475,.035],[.43,.475,.035],[.43,.475,.33],[.16,.475,.33]],'#5e5040');
    }],
    [.47,.72,()=>cow(d,.15,.60,.035,1.22)],
    [.775,.27,()=>{
      if(rank===2)vessel(d,.775,.27,.04,.175,.68,'#a7b9ac','#d9e0cb');
      else churn(d,.775,.27,1.12);
    }],
    [.88,.51,()=>{if(rank>=1)churn(d,.88,.51,1);}]
  );
}

function cakeShop(d,rank,accent) {
  d.box(.13,.15,.73,.66,.55,'#e5b6ad','#f7dfc6');
  d.box(.082,.10,.83,.74,.09,'#bd797d','#ffe7ca',.55);
  if(d.p.facing(0,1)){
    d.face([[.19,.815,.13],[.79,.815,.13],[.79,.815,.41],[.19,.815,.41]],'#6b8887');
    d.beam([.20,.82,.15],[.78,.82,.15],'#fff1d0',.029);
    for(let i=0;i<5;i++){
      const u=.13+i*.146;
      d.face([[u,.79,.50],[u+.146,.79,.50],[u+.146,.94,.45],[u,.94,.45]],i%2?'#fff0d4':'#ce8c94');
    }
  }
  // A tiered cake on a scalloped cornice gives the pastry shop a silhouette
  // that remains identifiable from behind and above neighbouring workshops.
  vessel(d,.50,.47,.64,.37,.22,'#d29380','#fff0d7');
  vessel(d,.50,.47,.79,.377,.065,'#f4dfc3','#fff2dd');
  vessel(d,.50,.47,.85,.234,.18,'#dfa998','#fff0d7');
  vessel(d,.50,.47,1.00,.239,.045,'#f8e4c8','#fff4dd');
  d.oval(.50,.47,1.112,.075,.075,'#bb5360');
  d.beam([.50,.47,1.17],[.53,.46,1.24],accent||'#688b53',.022);
  if(rank>=1)for(const u of [.30,.70])d.oval(u,.48,.89,.035,.033,'#b95569');
  if(rank===2 && (d.p.facing(1,0)||d.p.facing(0,1))){
    // The countertop stand mixer is open under the tinted motor housing.
    d.box(.77,.68,.17,.21,.46,'#a2747d','#cf9ba2');
    d.box(.71,.68,.23,.17,.10,'#cb8d92','#f0b8b5',.40);
    vessel(d,.74,.84,.08,.126,.17,'#94aba6','#d0d8c9');
    d.beam([.76,.79,.42],[.75,.84,.25],'#b5c0b7',.027);
  }
}

function log(d,u,v,z,length,r) {
  // The axis is east–west. Show the sawn rings only on the visible end.
  const ring=(x,a)=>[x,v+Math.cos(a)*r,z+Math.sin(a)*r];
  const sides=8;
  for(let i=0;i<sides;i++){
    const a=i*TAU/sides, b=(i+1)*TAU/sides, mid=(a+b)/2;
    const ny=Math.cos(mid), nz=Math.sin(mid);
    if(d.p.depth(0,ny)-d.p.depth(0,0)+nz<=0)continue;
    d.face([ring(u,a),ring(u+length,a),ring(u+length,b),ring(u,b)],['#95673e','#a57849','#ba8955','#b07e4b','#946b43','#865c3b','#815839','#90613d'][i]);
  }
  const end=d.p.facing(1,0)?u+length:u;
  const points=Array.from({length:sides},(_,i)=>ring(end,i*TAU/sides));
  d.face(points,'#e7c38a');
  const at=d.at(end,v,z);
  d.p.ellipse(at,d.p.tile*r*.24,d.p.tile*r*.29,'#b88b58');
}

function lumberYard(d,rank,accent,liveParts=false) {
  d.flat(.04,.07,.91,.87,.015,'#b89e70');
  d.parts(
    [.45,.22,()=>{
      for(const u of [.12,.66])d.box(u,.16,.055,.07,.65,'#846847','#a18c63');
      d.face([[.05,.03,.72],[.82,.03,.72],[.82,.43,.59],[.05,.43,.59]],accent||'#708677');
      d.beam([.05,.43,.585],[.82,.43,.585],'#5e6551',.045);
    }],
    [.48,.50,()=>{
      d.box(.22,.36,.55,.24,.19,'#877254','#b19468');
      if(rank===0){
        log(d,.28,.48,.24,.48,.08);
        // An axe embedded in the chopping block reads even with the shed behind it.
        if(!liveParts){
          d.beam([.35,.51,.24],[.50,.47,.67],'#825728',.05);
          d.face([[.42,.47,.56],[.60,.47,.61],[.58,.47,.76],[.44,.47,.70]],'#c8d3c5');
        }
      }else{
        // Upright circular saw blade and its darker hub.
        const teeth=Array.from({length:24},(_,i)=>{
          const a=i*TAU/24,r=i%2?.19:.24;
          return [.47+Math.cos(a)*r,.51,.43+Math.sin(a)*r];
        });
        d.face(teeth,'#d3d9cb');d.oval(.47,.51,.43,.045,.044,'#697b72');
        if(rank===2){d.box(.22,.34,.12,.11,.40,'#78816d','#b1ac8f');d.beam([.26,.39,.42],[.77,.39,.68],'#a48250',.075);}
      }
    }],
    [.45,.79,()=>{log(d,.09,.69,.123,.77,.092);log(d,.16,.87,.123,.74,.092);log(d,.08,.78,.248,.71,.091);}]
  );
}

function vegetables(d,rank,growth) {
  d.box(.035,.035,.93,.93,.065,'#a1835d','#806144');
  const rows=rank===2?4:3;
  for(let row=0;row<rows;row++){
    const v=.17+row*.68/(rows-1);
    d.flat(.10,v-.044,.81,.087,.071,'#9a7651');
    for(let col=0;col<3;col++){
      const u=.21+col*.28,r=.058+.083*growth, p=d.at(u,v,.11), px=r*d.p.tile;
      if((col+row)%3===1){
        d.p.ellipse(p,px*.65,px*.74,'#d7984d');
        for(const dx of [-.06,.04])d.beam([u,v,.13],[u+dx,v,.16+growth*.15],'#578044',.027);
      }else{
        d.p.ellipse({x:p.x-px*.44,y:p.y},px,px*.64,'#54854b');
        d.p.ellipse({x:p.x+px*.39,y:p.y},px*.92,px*.60,'#78aa5a');
        d.p.ellipse({x:p.x,y:p.y-px*.30},px*.72,px*.67,'#b1ce76');
      }
    }
  }
  if(rank>=1){
    d.beam([.075,.10,.097],[.075,.90,.097],'#517e7b',.035);
    for(const v of [.22,.77]){d.beam([.075,v,.10],[.075,v,.29],'#5e9287',.037);d.oval(.075,v,.30,.047,.022,'#d3bb80');}
  }
}

function wheat(d,growth,time) {
  d.flat(.04,.04,.92,.92,.032,'#8b6942');
  const straw=growth<.50?'#99a952':'#dab658', head=growth<.50?'#b7bc64':'#f1cd68';
  for(let row=0;row<4;row++){
    const v=.17+row*.22, sway=Math.sin(time/780+row)*d.p.tile*.025;
    d.flat(.08,v-.038,.84,.076,.036,'#a58151');
    for(let col=0;col<4;col++){
      const u=.18+col*.215,base=d.at(u,v,.05),h=d.p.tile*(.16+.19*growth),tip={x:base.x+sway,y:base.y-h};
      d.p.line(base,tip,straw,Math.max(.65,d.p.tile*.024));
      d.p.ellipse(tip,d.p.tile*.03,d.p.tile*.065,head);
    }
  }
}

function orchard(d,growth,scenery) {
  if(growth<.28){
    vessel(d,.5,.5,.009,.15,.15,'#947348','#e4c28a');
    if(growth>.12){d.beam([.60,.48,.045],[.65,.48,.22],'#6e9049',.022);d.oval(.67,.48,.21,.058,.033,'#a0bc70');}
    return;
  }
  const s=Math.max(.35,growth),p=d.at(.5,.50,.83*s),r=s*d.p.tile;
  d.box(.44,.44,.12,.12,.75*s,'#97714d','#97714d');
  const canopy=(dx,dy,rx,ry,col)=>d.p.ellipse({x:p.x+r*dx,y:p.y+r*dy},r*rx,r*ry,col);
  canopy(.08,.045,.39,.34,'#497a4e');canopy(-.16,-.050,.29,.31,'#63965e');
  canopy(.13,-.17,.29,.32,'#77a662');canopy(-.035,-.29,.27,.245,'#91b971');
  canopy(-.11,-.375,.115,.062,'#aac781');
  if(!scenery && growth>.82){
    for(const [dx,dy] of [[-.20,-.18],[.08,-.30],[.19,.015],[-.08,.045]]){
      canopy(dx,dy,.059,.061,'#bc6645');canopy(dx-.015,dy-.021,.019,.018,'#e7ab75');
    }
  }
}

const types=new Set(['well','mill','bakery','dairy','cakery','vegetable','lumber','wheat','tree']);
export function drawWorkshop(p,b,model,time=0,accent,appearance={}) {
  if(!types.has(b.type))return false;
  const d=brush(p,b), rank=Math.max(0,Math.min(2,model?.grade??model?.tier??0));
  const growth=appearance.growth??1;
  switch(b.type){
    case 'well': waterWell(d,rank,accent,b.ordinary);break;
    case 'mill': mill(d,rank,accent,b.ordinary,time);break;
    case 'bakery': breadShop(d,rank,accent,appearance.hearthGlow!==false);break;
    case 'dairy': pasture(d,rank,accent);break;
    case 'cakery': cakeShop(d,rank,accent);break;
    case 'vegetable': vegetables(d,rank,growth);break;
    case 'lumber': lumberYard(d,rank,accent,appearance.liveParts);break;
    case 'wheat': wheat(d,growth,time);break;
    case 'tree': orchard(d,growth,appearance.scenery);break;
  }
  return true;
}
