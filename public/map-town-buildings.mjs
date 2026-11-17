// The permanent town buildings and the combined barn have separate footprints
// and roof profiles. Positions below are fractions of the tile, including z.
function wallPanel(p, point, left, bottom, right, top, color) {
  p.poly([point(left,bottom),point(right,bottom),point(right,top),point(left,top)],color);
}

function barn(p,x,y) {
  const left=.08,right=.69,back=.1,front=.91,eave=.60,ridge=1.11;
  const main=()=>{
    p.box(x+left,y+back,right-left,front-back,eave,'#b0593f','#c37953');
    const frontFacing=p.facing(0,1);
    const face=(u,z)=>p.iso(x+u,y+(frontFacing?front+.002:back-.002),z);
    const side=(v,z)=>p.iso(x+(p.facing(1,0)?right+.002:left-.002),y+v,z);
    for(let v=.18;v<front;v+=.095) p.line(side(v,.055),side(v,eave),'#cc8060',Math.max(.6,p.tile*.016));
    // Matching doors on both gables allow grain carts to cross the barn.
    wallPanel(p,face,.17,.015,.60,.49,'#773e32');
    wallPanel(p,face,.188,.03,.58,.465,'#965338');
    const trim=Math.max(.85,p.tile*.032);
    for(const u of [.18,.385,.59]) p.line(face(u,.025),face(u,.48),'#f5daad',trim);
    p.line(face(.17,.49),face(.60,.49),'#f5daad',trim);
    p.line(face(.19,.055),face(.367,.44),'#edd1a3',trim*.8);
    p.line(face(.402,.44),face(.58,.055),'#edd1a3',trim*.8);
    // Four gambrel slopes form the high hayloft instead of a cottage gable.
    const profile=[[.025,eave],[.10,.91],[.385,ridge],[.67,.91],[.746,eave]];
    const gableY=y+(frontFacing?front+.035:back-.035);
    const loft=(u,z)=>p.iso(x+u,gableY,z);
    const slopes=['#4b6870','#75908c','#5d7b82','#3f5f68'];
    const order=p.facing(1,0)?[0,1,2,3]:[3,2,1,0];
    for(const i of order){
      const [u,z]=profile[i],[v,h]=profile[i+1];
      p.poly([p.iso(x+u,y+back-.035,z),p.iso(x+v,y+back-.035,h),
        p.iso(x+v,y+front+.035,h),p.iso(x+u,y+front+.035,z)],slopes[i]);
      for(const along of [.29,.66]) p.line(p.iso(x+u,y+along,z),p.iso(x+v,y+along,h),'#829993',Math.max(.5,p.tile*.012));
    }
    // The visible gable sits flush with the roof end.
    p.poly(profile.map(([u,z])=>p.iso(x+u,gableY,z)),'#b86946');
    wallPanel(p,loft,.30,.655,.47,.81,'#613f2d');
    p.line(loft(.30,.655),loft(.47,.81),'#dfbd87',trim*.8);
  };
  const grainBin=()=>{
    const ring=(z,i)=>p.iso(x+.835+.132*Math.cos(i*Math.PI/5),y+.44+.132*Math.sin(i*Math.PI/5),z);
    const tip=p.iso(x+.835,y+.44,.8),sides=[];
    for(let i=0;i<10;i++){
      const a=(i+.5)*Math.PI/5,nx=Math.cos(a),ny=Math.sin(a);
      if(p.facing(nx,ny)) {
        p.poly([ring(.015,i),ring(.015,i+1),ring(.63,i+1),ring(.63,i)],p.shade('#bcad81',Math.round(13*nx-9*ny)));
        for(const z of [.22,.47])p.line(ring(z,i),ring(z,i+1),'#7a795f',Math.max(.65,p.tile*.018));
      }
      sides.push({i,order:p.depth(x+.835+nx*.1,y+.44+ny*.1)});
    }
    for(const {i} of sides.sort((a,b)=>a.order-b.order))p.poly([ring(.63,i),ring(.63,i+1),tip],p.shade('#687f79',Math.round(10*Math.cos(i*Math.PI/5))));
  };
  if(p.depth(x+.835,y+.44)>p.depth(x+.385,y+.505)){main();grainBin();}else{grainBin();main();}
}

function tradeStation(p,x,y) {
  const main=()=>{
    p.box(x+.09,y+.10,.79,.53,.49,'#afc4b8','#d4d6b9',.115);
    const yFace=p.facing(0,1)?.634:.097;
    const face=(u,z)=>p.iso(x+u,y+yFace,z);
    wallPanel(p,face,.27,.117,.72,.48,'#45685f');
    for(const z of [.20,.28,.36,.44])p.line(face(.28,z),face(.71,z),'#8ea99b',Math.max(.65,p.tile*.019));
    const side=(v,z)=>p.iso(x+(p.facing(1,0)?.883:.087),y+v,z);
    wallPanel(p,side,.22,.31,.47,.50,'#fff0cc');
    wallPanel(p,side,.24,.33,.45,.48,'#668c8e');
    p.line(side(.34,.33),side(.34,.48),'#dae7d2',Math.max(.75,p.tile*.022));
    p.box(x+.044,y+.06,.88,.62,.075,'#526f67','#709082',.606);
    p.box(x+.16,y+.19,.3,.24,.06,'#98aa98','#b7c6ac',.682);
  };
  const dock=()=>{
    p.box(x+.05,y+.65,.9,.31,.13,'#887c65','#cfbb91');
    // The striped loading canopy and low dock remain clear of the moving truck.
    for(const u of [.11,.84])p.box(x+u,y+.86,.035,.04,.44,'#68766c','#8fa394',.13);
    for(let i=0;i<6;i++){
      const u=.035+i*.155;
      const color=i%2?'#f4dd9f':'#538d7f';
      p.poly([p.iso(x+u,y+.615,.625),p.iso(x+u+.155,y+.615,.625),p.iso(x+u+.155,y+.967,.57),p.iso(x+u,y+.967,.57)],color);
      p.poly([p.iso(x+u,y+.967,.57),p.iso(x+u+.155,y+.967,.57),p.iso(x+u+.155,y+.967,.51),p.iso(x+u,y+.967,.51)],p.shade(color,-14));
    }
    if(p.facing(0,1)){
      p.box(x+.54,y+.85,.19,.13,.15,'#a97549','#ddb37e',.13);
      p.quad(x+.615,y+.85,.034,.13,.281,'#f2d39a');
    }
  };
  p.box(x+.05,y+.055,.9,.64,.12,'#9b927b','#c5bba0');
  if(p.facing(0,1)){main();dock();}else{dock();main();}
}

function farmhouse(p,x,y) {
  p.box(x+.14,y+.15,.68,.67,.52,'#ecdcbc','#eddfc3');
  const face=(u,z)=>p.iso(x+u,y+(p.facing(0,1)?.821:.149),z);
  const side=(v,z)=>p.iso(x+(p.facing(1,0)?.821:.139),y+v,z);
  wallPanel(p,face,.51,.018,.685,.39,'#6e775b');
  wallPanel(p,face,.205,.23,.41,.435,'#f8efcc');
  wallPanel(p,face,.228,.25,.387,.405,'#799d9c');
  wallPanel(p,side,.30,.24,.56,.43,'#769393');
  p.line(face(.307,.248),face(.307,.408),'#f6e6bd',Math.max(.8,p.tile*.025));
  p.line(side(.43,.24),side(.43,.43),'#f6e6bd',Math.max(.8,p.tile*.025));
  p.roof(x+.13,y+.14,.70,.69,.52,'#bf7954');
  p.box(x+.58,y+.35,.12,.14,.29,'#a57659','#d6b189',.73);
  p.box(x+.566,y+.337,.147,.166,.045,'#8d6550','#a58065',1.02);
  if(p.facing(0,1))p.box(x+.48,y+.823,.25,.11,.055,'#a5987a','#d5c5a3');
}
export function drawTownBuilding(p,b) {
  if(b.type==='barn') barn(p,b.x,b.y);
  else if(b.type==='trade') tradeStation(p,b.x,b.y);
  else if(b.type==='house') farmhouse(p,b.x,b.y);
  else return false;
  return true;
}
