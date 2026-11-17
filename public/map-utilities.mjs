// All dimensions are in map tiles. Parts have world coordinates so canopies,
// cargo, ladders and vehicle wheels keep their orientation during camera orbit.
const steel = '#57717b';
const paleSteel = '#bdd2d0';
const timber = '#98714d';
const darkWood = '#725438';
const cream = '#fff0cc';
const tire = '#334748';
const gold = '#daa54e';
const ring = Array.from({length: 12}, (_, i) => {
  const angle = i * Math.PI / 6;
  return [Math.cos(angle), Math.sin(angle)];
});

function builders(p, x, y) {
  const point = (u, v, z = 0) => p.iso(x + u, y + v, z);
  return {
    point,
    box: (u, v, w, d, h, wall, top, base = 0) => p.box(x + u, y + v, w, d, h, wall, top, base),
    face: (corners, color) => p.poly(corners.map(c => point(...c)), color),
    bar: (a, b, color, width = .024) =>
      p.line(point(...a), point(...b), color, Math.max(.6, p.tile * width)),
    // Equipment is composed of small models. Sorting their footprints prevents
    // a box behind a warehouse or the far wheel of a cart from covering it.
    sorted: parts => parts.sort((a, b) => p.depth(x + a[0], y + a[1]) - p.depth(x + b[0], y + b[1]))
      .forEach(part => part[2]()),
  };
}

// One ring profile supports ribbed drums, grain hoppers and conical caps.
// Fixed lighting is applied per facet while hidden facets are skipped.
function drum(p, g, u, v, lowerZ, upperZ, lowerR, upperR, wall, lid) {
  const lower = ring.map(([dx, dy]) => g.point(u + dx * lowerR, v + dy * lowerR, lowerZ));
  const upper = ring.map(([dx, dy]) => g.point(u + dx * upperR, v + dy * upperR, upperZ));
  const facets = [];
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const nx = (ring[i][0] + ring[j][0]) * .5, ny = (ring[i][1] + ring[j][1]) * .5;
    // Expose the back of a cone when its slope faces toward the camera.
    if (lowerR === upperR && !p.facing(nx, ny)) continue;
    const light = Math.round(8 * ny - 16 * nx);
    const corners = [lower[i], lower[j], upper[j], upper[i]], color = p.shade(wall, light);
    if (lowerR === upperR) p.poly(corners,color);
    else facets.push({corners,color,depth:p.depth(nx,ny)});
  }
  facets.sort((a,b) => a.depth - b.depth).forEach(f => p.poly(f.corners,f.color));
  if (lid) p.poly(upper, lid);
}

function crate(g, u, v, w, base = .03) {
  const h = w * .82;
  g.box(u, v, w, w * .83, h, '#bf8956', '#edbd7d', base);
  g.face([[u+w*.4,v,base+h],[u+w*.57,v,base+h],[u+w*.57,v+w*.83,base+h],[u+w*.4,v+w*.83,base+h]], '#f8d49b');
}

function solarRack(g, u, v, w, d, z, rise, columns, rows) {
  const cell = (a, b) => [u + a * w, v + b * d, z + (1 - b) * rise];
  g.face([cell(0,0),cell(1,0),cell(1,1),cell(0,1)], '#a6c5cb');
  g.face([cell(.025,.035),cell(.975,.035),cell(.975,.965),cell(.025,.965)], '#2b5472');
  // The diagonal sky reflection crosses a continuous surface under the busbars.
  g.face([cell(.05,.05),cell(.43,.05),cell(.75,.96),cell(.53,.96)], '#447695');
  for (let i = 1; i < columns; i++) g.bar(cell(i/columns,.035),cell(i/columns,.965),'#b2d3d6',.014);
  for (let i = 1; i < rows; i++) g.bar(cell(.025,i/rows),cell(.975,i/rows),'#a2c2ce',.012);
}

function solar(p, g, m, accent) {
  const roof = m.id === 'standard-solar';
  const multi = m.grade === 2 || m.id === 'solar-array';
  if (roof) {
    g.box(.10,.13,.80,.73,.47,'#dbcaad','#e8ddbf');
    // Mono-pitch roof and matching sloped panels, with a vented inverter below.
    g.face([[.10,.13,.47],[.90,.13,.47],[.90,.13,.65],[.10,.13,.65]],'#ab9271');
    for (const side of [.10,.90]) {
      g.face([[side,.13,.47],[side,.86,.47],[side,.13,.65]],'#ccb590');
    }
    solarRack(g,.055,.08,.89,.83,.49,.19,5,3);
    if (p.facing(0,1)) {
      g.box(.33,.87,.31,.065,.24,steel,paleSteel,.10);
      for (const z of [.16,.22,.28]) g.bar([.37,.938,z],[.59,.938,z],'#8ea49e',.022);
    }
    return;
  }
  if (multi) {
    // Two independent rack tables leave a visible aisle between the arrays.
    const parts = [.06,.55].map(u => [u+.20,.5,() => {
      g.box(u+.15,.43,.10,.13,.46,steel,paleSteel);
      g.box(u+.06,.35,.28,.31,.07,'#bab6a0','#ddd6bd');
      solarRack(g,u,.08,.40,.83,.35,.32,3,4);
    }]);
    g.sorted(parts);
    if (m.id === 'solar-array') {
      // Tracker control post with a sun sensor.
      g.box(.46,.83,.075,.075,.49,steel,paleSteel);
      g.box(.43,.80,.14,.13,.08,accent || gold,'#f5d27d',.49);
    }
    return;
  }
  g.box(.29,.30,.42,.40,.065,'#a5aa99','#cdd0b9');
  g.box(.445,.43,.12,.13,.34,steel,paleSteel,.05);
  g.bar([.22,.30,.52],[.50,.5,.28],paleSteel,.045);
  g.bar([.82,.32,.53],[.50,.5,.28],steel,.05);
  solarRack(g,.08,.14,.84,.70,.27,.32,4,3);
}

function wind(p, g, m, time, accent) {
  const grade = m.grade ?? 1;
  const height = 1.17 + grade * .13, radius = .55 + grade * .055;
  g.box(.35,.35,.30,.30,.09,'#b6b6a3','#d6d5bd');
  g.box(.456,.456,.088,.088,height,'#dbded1','#e6ebda',.08);
  if (grade === 0) {
    for (const u of [.32,.68]) {
      g.bar([u,.52,.075],[.49,.52,.67],steel,.037);
    }
  } else {
    g.box(.445,.445,.11,.11,.13,accent || '#7b9f94','#deebd9',.14);
  }
  g.box(.42,.33,.16,.34,.14,'#c8d4cb','#f0ecd5',height);
  // The rotor stands in a vertical plane and becomes narrow when viewed on edge.
  // Draw a hub on both sides so its center remains legible at those angles.
  const angle = time / 1250;
  for (let i = 0; i < 3; i++) {
    const a = angle+i*Math.PI*2/3, c=Math.cos(a), s=Math.sin(a);
    const blade = (r,t) => [.5+c*r-s*t,.682,height+.07+s*r+c*t];
    g.face([blade(.03,-.035),blade(radius*.46,-.044),blade(radius,.024),blade(radius,.056),blade(radius*.32,.072)], '#faf3d9');
    if (grade > 0) g.face([blade(radius*.81,.001),blade(radius,.024),blade(radius,.056),blade(radius*.81,.06)],grade===2?'#cb9970':'#94b7a7');
  }
  p.ellipse(g.point(.5,.682,height+.07),p.tile*.072,p.tile*.07,accent || '#568a84');
}

function tankStand(p, g, brick) {
  if (brick) {
    drum(p,g,.50,.50,.05,.8,.235,.215,'#aa7965','#d3a18b');
    for (const z of [.22,.45,.66]) drum(p,g,.5,.5,z,z+.025,.235,.232,'#d4b59a');
    return;
  }
  const corners = [[.26,.26],[.74,.26],[.74,.74],[.26,.74]];
  for (let i=0; i<4; i++) {
    const a=corners[i],b=corners[(i+1)%4];
    g.bar([...a,.05],[...a,.89],timber,.064);
    g.bar([...a,.16],[...b,.72],darkWood,.039);
  }
}

function tower(p, g, m) {
  const brick = m.grade === 1, wide = m.grade === 2;
  tankStand(p,g,brick || wide);
  const r = wide ? .43 : .34, bottom=.73, top=wide?1.56:1.31;
  const pipe=()=>{
    const u=.5+r;
    g.bar([u,.5,bottom+.07],[u,.5,.20],steel,.049);
    g.bar([u,.5,.20],[u,.77,.20],steel,.049);
    if (m.id==='tower-rain') {
      g.bar([u,.72,.20],[u,.72,.37],steel,.045);
      g.bar([u-.10,.72,.37],[u+.10,.72,.37],gold,.054);
    }
  };
  if (!p.facing(1,0)) pipe();
  drum(p,g,.5,.5,bottom-.08,bottom,r*.56,r,'#4c8290');
  drum(p,g,.5,.5,bottom,top,r,r,'#6dadae','#b1d8c9');
  for(const z of [bottom+.06,top-.09]) drum(p,g,.5,.5,z,z+.043,r+.011,r+.011,'#dbdcbe');
  if (wide) drum(p,g,.5,.5,1.14,1.19,r+.013,r+.013,steel);
  drum(p,g,.50,.50,top,top+.12,r+.02,.05,'#738b8b','#d1b99a');
  if (m.id==='tower-rain') {
    drum(p,g,.5,.5,top+.105,top+.21,.046,.16,steel,'#a4cfd1');
  }
  if (p.facing(1,0)) pipe();
}

function grainBin(p,g,u,v,r,h,wood,cap) {
  const wall = wood ? '#bb925f' : '#b8bbb0';
  drum(p,g,u,v,.075,h,r,r,wall,wood?'#c9ab7c':'#cdd2bf');
  if (wood) for(let i=0;i<ring.length;i++){
    const [dx,dy]=ring[i];
    if (p.facing(dx,dy)) g.bar([u+dx*r,v+dy*r,.08],[u+dx*r,v+dy*r,h],darkWood,.013);
  }
  for (const z of [.23*h,.56*h,.85*h]) drum(p,g,u,v,z,z+.035,r+.009,r+.009,wood?'#627775':'#838f91');
  drum(p,g,u,v,h,h+r*.83,r+.02,.045,cap,'#e4d5b7');
  drum(p,g,u,v,h+r*.83,h+r*.83+.05,.043,.043,'#b3a98e','#dfd9c4');
  // The steel ladder follows the side of the bin and is occluded at the back.
  if (!wood && p.facing(0,1)) {
    for(const offset of [-.065,.065]) g.bar([u+offset,v+r,.09],[u+offset,v+r,h],steel,.02);
    for(let z=.19;z<h;z+=.16)g.bar([u-.065,v+r,z],[u+.065,v+r,z],paleSteel,.016);
  }
}

function silo(p,g,m,accent) {
  const twin=m.grade===2, wood=m.grade===0;
  if (twin) {
    g.sorted([[.29,.67,()=>grainBin(p,g,.29,.67,.26,1.03,false,'#82918b')],
      [.68,.30,()=>grainBin(p,g,.68,.30,.24,.91,false,'#82918b')]]);
    return;
  }
  grainBin(p,g,.5,.5,.34,wood?.80:1.02,wood,accent || '#899782');
}

function warehouse(p,g,m,accent){
  const grade=m.grade ?? 1, wall='#afb9ad', width=.86, x=.07, y=.08, d=.63;
  const shed=()=> {
    g.box(x,y,width,d,.52,wall,'#d4d9c7',.08);
    // Asymmetric steel roof with a continuous clerestory on upgraded depots.
    g.box(x-.025,y-.025,width+.05,d+.05,.085,accent || '#798d81','#8c9e8c',.60);
    for(const u of [.22,.43,.64,.85]) g.bar([u,y,.688],[u,y+d,.688],'#71877d',.022);
    if (grade===2) {
      g.box(.23,.22,.56,.23,.09,'#6c9399','#e0e6ce',.69);
    }
    if (p.facing(0,1)) {
      const bays=grade===0?1:2;
      for(let i=0;i<bays;i++) {
        const left=bays===1?.25:.14+i*.39, right=left+(bays===1?.48:.32), face=y+d+.004;
        g.face([[left,face,.10],[right,face,.10],[right,face,.48],[left,face,.48]],'#4c605d');
        for (const z of [.24,.31,.38,.45]) g.bar([left+.013,face,z],[right-.013,face,z],'#91a09a',.018);
      }
    }
    if(p.facing(1,0)) {
      for(const v of [.16,.36,.56])g.face([[x+width+.003,v,.38],[x+width+.003,v+.105,.38],[x+width+.003,v+.105,.49],[x+width+.003,v,.49]],'#6e959a');
    }
  };
  const pallets=()=> {
    g.box(.13,.73,.72,.20,.075,'#8e775b','#b59a78');
    crate(g,.20,.74,.20,.075);
    crate(g,.48,.74,.19,.075);
    if(grade>0)crate(g,.20,.74,.17,.24);
    if(grade===2)crate(g,.66,.74,.18,.075);
  };
  g.sorted([[.5,.39,shed],[.5,.83,pallets]]);
}

function wheel(p,g,u,v,z,r){
  const face=(radius,offset,color)=>{
    const points=ring.map(([du,dz])=>g.point(u+du*radius,v+offset,z+dz*radius));
    p.poly(points,color);
  };
  const sign=p.facing(0,1)?1:-1,outer=.032*sign;
  // A short tread remains visible when looking along the axle.
  p.ellipse(g.point(u,v,z),Math.max(.035*p.tile,Math.abs(g.point(u+r,v,z).x-g.point(u,v,z).x)),r*p.tile,'#334646');
  face(r,outer,tire);face(r*.43,outer*1.08,'#d1bd88');
}

function vehicle(p,g,model,accent){
  const tractor=model.id==='tractor-field';
  const robot=model.id==='tractor-ranger'||model.grade===2;
  const tow=model.grade===1;
  const body=accent && !model.ordinary ? accent : robot?'#5a8c92':tractor?'#739455':'#639179';
  const far=p.facing(0,1)?.24:.74,near=.98-far;
  const wheels=v=>{
    if(tractor){wheel(p,g,.30,v,.21,.208);wheel(p,g,.75,v,.135,.128);}
    else if(tow){wheel(p,g,.20,v,.12,.105);wheel(p,g,.58,v,.105,.105);wheel(p,g,.82,v,.105,.105);}
    else {wheel(p,g,.27,v,.13,.12);wheel(p,g,.72,v,.13,.12);}
  };
  wheels(far);
  if (robot) {
    g.box(.16,.26,.67,.46,.18,steel,'#7e9490',.12);
    g.box(.18,.26,.63,.45,.20,body,'#8cb9b5',.29);
    g.box(.25,.33,.33,.29,.075,'#d6dfc9','#e1ead3',.49);
    // A dark sensor visor wraps the nose and a small lidar head crowns the pod.
    g.box(.70,.25,.12,.45,.095,'#354e59','#486676',.34);
    for(const v of [.31,.55])g.box(.811,v,.018,.074,.05,'#9adfda','#ceeee6',.354);
    drum(p,g,.59,.48,.50,.62,.067,.067,'#d2a04e','#f4d682');
    g.bar([.25,.38,.55],[.25,.38,.76],steel,.022);
  } else if(tractor) {
    g.box(.17,.25,.67,.46,.15,body,'#89a879',.23);
    g.box(.48,.32,.36,.33,.19,body,'#8ab3a0',.38);
    g.box(.22,.34,.18,.27,.22,'#514d42','#806b51',.38);
    for(const v of [.30,.65])g.bar([.25,v,.38],[.25,v,.80],steel,.041);
    g.box(.15,.24,.32,.48,.045,body,'#9fc5ad',.80);
    g.bar([.70,.59,.54],[.70,.59,.76],steel,.05);
  } else if(tow) {
    g.box(.049,.31,.32,.37,.09,'#90785d','#bda57c',.16);
    crate(g,.11,.34,.22,.25);
    g.bar([.35,.49,.20],[.49,.49,.20],steel,.048);
    g.box(.47,.28,.44,.43,.17,body,'#a2bc94',.17);
    g.box(.72,.31,.14,.37,.20,body,'#bbccb1',.34);
    g.bar([.64,.46,.33],[.69,.46,.50],steel,.026);
  } else {
    // Low battery pallet cart with an upright tiller and a single parcel.
    g.box(.14,.27,.70,.45,.12,body,'#abbf9d',.15);
    g.box(.17,.27,.16,.44,.13,body,'#97ad89',.27);
    crate(g,.52,.34,.22,.27);
    g.bar([.23,.49,.33],[.12,.49,.64],steel,.040);
    g.bar([.12,.37,.64],[.12,.61,.64],tire,.045);
  }
  wheels(near);
}

function depot(p,g,m,accent) {
  const grade=m.grade ?? 1;
  const front=.54;
  const office=()=>{
    g.box(.08,.07,.81,.47,.54,'#e3c296','#edd2ad');
    if (p.facing(0,1)) {
      g.face([[.22,front+.002,.08],[.76,front+.002,.08],[.76,front+.002,.43],[.22,front+.002,.43]],'#5b7776');
      g.bar([.49,front+.006,.08],[.49,front+.006,.43],cream,.035);
    }
    if (p.facing(1,0)) {
      g.face([[.892,.16,.20],[.892,.38,.20],[.892,.38,.43],[.892,.16,.43]],'#62888b');
    }
    // A bright parcel canopy, with a shipping arrow painted onto its roof.
    const canopy=grade===0?.58:.70;
    g.box(.035,.035,.93,canopy,.075,accent || '#b98c51','#d7ae68',.54);
    g.face([[.28,.27,.618],[.58,.27,.618],[.58,.20,.618],[.76,.35,.618],[.58,.50,.618],[.58,.423,.618],[.28,.423,.618]],cream);
    if(grade===2){
      // Dispatch light gantry sits above the loading apron.
      g.bar([.14,.57,.62],[.14,.57,.93],steel,.046);
      g.bar([.83,.57,.62],[.83,.57,.93],steel,.046);
      g.box(.11,.51,.76,.11,.10,steel,'#aebcaa',.88);
      if(p.facing(0,1)) for(const u of [.25,.43,.61]){
        p.ellipse(g.point(u,.626,.931),p.tile*.033,p.tile*.034,'#e6bf59');
      }
    }
  };
  const van=()=>{
    for (const u of [.29,.70])wheel(p,g,u,.86,.10,.097);
    g.box(.18,.65,.59,.22,.09,steel,paleSteel,.12);
    g.box(.16,.63,.36,.265,.25,'#e3d8af','#faf0cc',.20);
    g.box(.53,.65,.25,.235,.17,'#af7e4c','#edc386',.20);
    if(p.facing(0,1)){
      g.face([[.56,.89,.26],[.72,.89,.26],[.72,.89,.35],[.56,.89,.35]],'#669098');
      if(m.id==='depot-express') g.face([[.26,.898,.41],[.40,.898,.41],[.34,.898,.34],[.40,.898,.34],[.25,.898,.23],[.30,.898,.32],[.24,.898,.32]],'#b57e38');
    }
    if(p.facing(0,1))for(const u of [.29,.70])wheel(p,g,u,.901,.10,.091);
  };
  g.sorted([[.49,.30,office],[.48,.78,van]]);
}

const drawByType = {solar,wind,tower,silo,warehouse,tractor:vehicle,depot};
export function drawUtility(p, building, model, time = 0, accent = null) {
  const draw=drawByType[building.type];
  if (!draw) return false;
  const g=builders(p,building.x,building.y);
  if (building.type==='wind') wind(p,g,model || {},time,accent);
  else draw(p,g,model || {},accent);
  return true;
}
