// Motion is drawn over the matching utility body in its own tile. Effects use
// local coordinates and follow the camera; they neither move goods nor run timers.
const circle = Math.PI * 2;
const lampGold = '#ffd894';
const paintedSteel = '#566c6c';
const water = '#83c8cf';

function brush(p, b) {
  const point = (x,y,z) => p.iso(b.x + x, b.y + y, z);
  return {
    point,
    face: (corners, fill) => p.poly(corners.map(c => point(...c)), fill),
    bar: (a, end, color, width) => p.line(point(...a), point(...end), color, Math.max(.7, p.tile * width)),
    dot: (x,y,z,rx,ry,color) => p.ellipse(point(x,y,z), p.tile * rx, p.tile * ry, color)
  };
}

function solarReflection(g, time, night, u, v, w, d, z, slope) {
  // Keep the reflection inside the glass, including its top and bottom margins.
  const a = .35 + .23 * Math.sin(time * .83);
  const point = (col,row) => [u + col*w, v + row*d, z + (1-row)*slope + .003];
  g.face([point(a,.05),point(a+.10,.05),point(a+.35,.955),point(a+.25,.955)], night?'#b6d8f137':'#edf9ef73');
}

function solar(g, m, s) {
  if (m.id === 'standard-solar') {
    solarReflection(g,s.time,s.night,.055,.08,.89,.83,.49,.19);
  } else if (m.grade === 2 || m.id === 'solar-array') {
    for (const u of [.06,.55]) solarReflection(g,s.time,s.night,u,.08,.40,.83,.35,.32);
  } else {
    solarReflection(g,s.time,s.night,.08,.14,.84,.70,.27,.32);
  }
}

function wind(g, p, m, s) {
  // The main rotor already turns in the body renderer. Its opposite, sheltered
  // side carries a wind ribbon. Do not paint this ribbon across the blades.
  if (!p.facing(0,-1)) return;
  const h = 1.30 + .13 * (m.grade ?? 1);
  const wave = .037 * Math.sin(s.time * 4.4);
  g.bar([.5,.35,h-.035],[.5,.35,h+.11],paintedSteel,.020);
  g.face([[.5,.35,h+.102],[.51,.19,h+.080],[.49+wave,.055,h+.053+wave],
    [.50,.18,h+.010],[.5,.35,h+.03]],'#d58c59');
}

function tower(g, p, m, s) {
  const wide = m.grade === 2;
  const top = (wide ? 1.56 : 1.31) + (m.id === 'tower-rain' ? .21 : .12);
  // A two-tone vane rides the tank's vent. The direction eases continuously and
  // stays readable even when the outlet is on the far side of the tank.
  const angle = .65 + .61*Math.sin(s.time*.92);
  const du = Math.cos(angle), dv = Math.sin(angle);
  const vane = (r,z) => [.5+du*r,.5+dv*r,top+z];
  g.bar(vane(0,0),vane(0,.17),paintedSteel,.027);
  g.bar(vane(-.17,.138),vane(.195,.138),'#826a49',.025);
  g.face([vane(-.19,.215),vane(-.055,.165),vane(-.055,.117),vane(-.19,.085)],'#bb7450');
  g.face([vane(.195,.138),vane(.105,.186),vane(.105,.097)],'#f6cb70');

  if (!s.working || s.enabled === false || !p.facing(1,0)) return;
  const outlet = wide ? .93 : .84;
  // Water travels outward only while irrigation is actually available.
  for (let i=0;i<3;i++) {
    const f = (s.time*1.22 + i/3)%1;
    g.dot(outlet,.775+f*.135,.205+.09*f-.275*f*f,.023,.040,water);
  }
}

function silo(g, m, s) {
  const twin = m.grade === 2, wooden = m.grade === 0;
  // A wind-driven grain aerator sits directly on the crown of the taller bin.
  const u = twin ? .29 : .50, v = twin ? .67 : .50;
  const crown = twin ? 1.296 : (wooden ? 1.132 : 1.352);
  g.bar([u,v,crown-.018],[u,v,crown+.10],paintedSteel,.035);
  const active = s.enabled !== false && s.traffic;
  const angle = s.time * (active ? 2.8 : 1.45);
  for (let i=0;i<3;i++) {
    const a = angle + circle*i/3, c = Math.cos(a), n = Math.sin(a);
    g.face([[u+.035*c,v+.035*n,crown+.107],[u+.16*c-.028*n,v+.16*n+.028*c,crown+.15],
      [u+.12*c+.046*n,v+.12*n-.046*c,crown+.095]], i===1?'#bad1c2':'#77968e');
  }
  g.dot(u,v,crown+.13,.035,.023,'#f4deb0');
}

function warehouse(g, p, s) {
  // A small dock jib, secured at the edge of the front eave. Empty slings
  // sway gently; a receiving hauler makes the hoist pay out and retract.
  const anchorX=.70, anchorY=.66, pivot=.99;
  const yaw = Math.sin(s.time*1.63)*.087;
  const active = s.enabled !== false && s.traffic;
  const tipX=anchorX-.10+yaw, tipY=.85, sway=Math.sin(s.time*1.91)*.025;
  const top=[tipX,tipY,pivot];
  g.bar([anchorX,anchorY,.68],[anchorX,anchorY,pivot],'#706b55',.055);
  g.bar([anchorX,anchorY,pivot-.11],top,'#ac8755',.041);
  g.bar([anchorX,anchorY,pivot],top,'#e2b063',.062);
  // From the rear the lower hook disappears behind the front roof parapet.
  const z = p.facing(0,1) ? (active?.57+.14*Math.sin(s.time*2.05):.72) : .82;
  const hook=[tipX+sway,tipY+.013,z];
  g.bar(top,hook,'#526665',.017);
  g.bar(hook,[hook[0]+.050,hook[1],z+.030],'#d6ab68',.03);
}

function vehicle(g, m, s) {
  const robot=m.id==='tractor-ranger' || m.grade===2;
  const field=m.id==='tractor-field';
  const tow=m.grade===1;
  const powered=s.enabled!==false && s.working;
  const active=powered && s.traffic;
  const angle=powered?s.time*(active?3.9:1.8):0;
  // The robot sweeps its own lidar head. The mechanical vehicles have a
  // rotating amber safety beacon above their controls, clear of the cargo.
  const [u,v,z] = robot ? [.59,.48,.628] : field ? [.26,.45,.854] :
    tow ? [.79,.47,.548] : [.12,.49,.651];
  if (!robot) {
    g.dot(u,v,z,.064,.039,paintedSteel);
    g.bar([u,v,z],[u,v,z+.070],'#c3873b',.083);
  }
  const head = robot ? z+.010 : z+.078;
  g.dot(u,v,head,robot?.063:.055,robot?.035:.036,robot?'#437674':'#dea14c');
  const du=Math.cos(angle)*.058, dv=Math.sin(angle)*.058;
  g.bar([u-du*.3,v-dv*.3,head+.008],[u+du,v+dv,head+.008],
    !powered?'#9ca79b':robot?'#a8f2de':lampGold,.035);
  // An unpowered vehicle still has a real-world cue: its small safety ribbon
  // stirs on the canopy, robot aerial or tiller while the beacon stays dark.
  if (!powered) {
    const [ax,ay,az] = robot ? [.25,.38,.76] : [u,v,head+.02];
    const flutter = .052*Math.sin(s.time*3.6), side = ax<.18 ? 1 : -1;
    g.face([[ax,ay,az],[ax+side*.092,ay+.012+flutter,az+.016],
      [ax+side*.15,ay+flutter*.66,az-.026],[ax+side*.087,ay+.012+flutter,az-.035],[ax,ay,az-.025]],'#b6895d');
  }
  if(robot && active){
    // A narrow fan just above the pod follows the lidar, not the camera.
    g.face([[u,v,head+.016],[u+4*du-dv*.57,v+4*dv+du*.57,head+.020],
      [u+4*du+dv*.57,v+4*dv-du*.57,head+.020]],'#66d5c260');
  }
}

function depot(g, p, m, s) {
  // The dispatch pennant is on the canopy edge. Keep it clear of both the
  // loading gantry on advanced stations and the painted roof arrow.
  const x=.80, y=.24;
  g.bar([x,y,.616],[x,y,.99],paintedSteel,.029);
  const wave=Math.sin(s.time*3.3)*.049, tip=Math.sin(s.time*3.3-.70)*.055;
  const active=s.enabled!==false && s.traffic;
  const flagColor=active?'#dfaa50':'#679e97';
  g.face([[x,y,.985],[x-.09,y+.015+wave,.975],[x-.09,y+.015+wave,.868],[x,y,.868]],flagColor);
  g.face([[x-.09,y+.015+wave,.975],[x-.235,y+.025+tip,.919+tip*.22],
    [x-.09,y+.015+wave,.868]],active?'#f9d48a':'#a2c3ab');
  if(active && m.grade===2 && p.facing(0,1)){
    const u=.25+.18*Math.floor((s.time*2)%3);
    g.dot(u,.628,.931,.043,.042,'#ffd27b');
  }
}

export function drawUtilityMotion(p, b, model, motion) {
  const m=model||{};
  switch(b.type){
    case 'solar': solar(brush(p,b),m,motion); break;
    case 'wind': wind(brush(p,b),p,m,motion); break;
    case 'tower': tower(brush(p,b),p,m,motion); break;
    case 'silo': silo(brush(p,b),m,motion); break;
    case 'warehouse': warehouse(brush(p,b),p,motion); break;
    case 'tractor': vehicle(brush(p,b),m,motion); break;
    case 'depot': depot(brush(p,b),p,m,motion); break;
    default: return false;
  }
  return true;
}
