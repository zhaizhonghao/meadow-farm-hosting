// Draw these details immediately after the corresponding solid model so a
// nearer building or passing truck still covers them. Coordinates are tile units.
import {RIVER_COLUMN} from './geography.mjs?v=8.6.0';

const TAU = 2 * Math.PI;

function farmhouse(p, x, y, {time, night}) {
  // The chimney cap on the farmhouse ends at (0.64, 0.42, 1.065).
  for (let i = 0; i < 3; i++) {
    const age = (time * .37 + i / 3) % 1;
    const fade = Math.sin(age * Math.PI);
    const curl = .043 * Math.sin(age * TAU + time * .8);
    const center = p.iso(x + .64 + age * .19, y + .42 + curl, 1.075 + age * .56);
    const radius = p.tile * (.035 + .071 * age);
    p.ellipse(center, radius * 1.18, radius * .76, 'rgba(250,246,232,' + (.55 * fade).toFixed(2) + ')');
  }
  if (night) {
    const faceY = y + (p.facing(0, 1) ? .823 : .147);
    const glass = (u, z) => p.iso(x + u, faceY, z);
    // Each pane sits inside the painted frame, leaving the mullion visible.
    for (const u of [.23, .316]) p.poly([
      glass(u,.254), glass(u+.067,.254), glass(u+.067,.397), glass(u,.397)
    ], '#f4ce8b');
  }
}

function barn(p, x, y, {time, traffic}) {
  // A wheat-shaped vane pivots about the hayloft ridge. Its two sides are
  // actual world coordinates, so the mast and the arm turn with the camera.
  const u = x + .385, v = y + .49;
  const bearing = -.34 + .7 * Math.sin(time * .88) + .14 * Math.sin(time * 1.7);
  const dx = Math.cos(bearing), dy = Math.sin(bearing);
  const arm = (length, z) => p.iso(u + length * dx, v + length * dy, z);
  p.line(arm(0,1.10), arm(0,1.43), '#655c44', Math.max(.8, p.tile * .032));
  p.line(arm(-.23,1.38), arm(.23,1.38), '#6e5a38', Math.max(.8, p.tile * .03));
  p.poly([arm(.255,1.38), arm(.145,1.45), arm(.145,1.32)], '#9a6332');
  p.poly([arm(-.085,1.38), arm(-.155,1.475), arm(-.25,1.48), arm(-.219,1.4), arm(-.16,1.36)], '#cc9e45');
  p.ellipse(arm(0,1.38), p.tile * .03, p.tile * .03, '#e7ba61');
  if (traffic) {
    // A warm loft opening signals a real arrival or unloading at this barn.
    const faceY = y + (p.facing(0, 1) ? .946 : .064);
    const face = (offset, height) => p.iso(x + offset, faceY, height);
    p.poly([face(.316,.676), face(.447,.676), face(.447,.786)], '#e5b265');
  }
}

function freightStation(p, x, y, {time, traffic, night}) {
  // The low freight station already has a rooftop exhaust plinth. A small
  // turbine spins directly on that plinth while the loading dock is idle.
  const u = x + .31, v = y + .31;
  const cap = p.iso(u, v, .84), base = p.iso(u, v, .754);
  const width = p.tile * .16;
  p.ellipse(base, width, width * .5, '#687c74');
  p.ellipse(cap, width, width * .53, '#afbdad');
  for (let i = 0; i < 3; i++) {
    const angle = time * 1.7 + i * TAU / 3;
    const tip = p.iso(u + .105 * Math.cos(angle), v + .105 * Math.sin(angle), .841);
    p.line(cap, tip, '#627c75', Math.max(.65, p.tile * .025));
  }
  if (traffic || night) {
    // Amber only during a shipment. At night the parked station has a steady
    // work light; the blinking dispatch signal stays tied to actual traffic.
    const foot = p.iso(x + .735, y + .34, .672), lamp = p.iso(x + .735, y + .34, .865);
    p.line(foot, lamp, '#53675f', Math.max(.9, p.tile * .035));
    const color = traffic ? Math.sin(time * 4.8) > 0 ? '#ffd581' : '#c68b46' : '#ead9ae';
    p.ellipse(lamp, p.tile * .048, p.tile * .055, color);
  }
}

// Draw the verge before buildings and moving entities. Keep it inexpensive on
// long roads: a whole tuft uses one silhouette, with one optional seed head.
export function drawRoadMotion(p, road, motion) {
  const {x, y} = road, {time} = motion;
  if (x === RIVER_COLUMN) {
    // A short safety streamer hangs from an existing corner rail post.
    const u = x + .104, v = y + .071, flutter = Math.sin(time * 3.2);
    p.poly([p.iso(u,v,.262), p.iso(u+.115,v+.018,.255+flutter*.018),
      p.iso(u+.19,v+.048+flutter*.027,.195+flutter*.049),
      p.iso(u+.072,v+.013,.193),p.iso(u,v,.224)], '#c78056');
    return true;
  }
  const side = ((x + 3 * y) % 2 === 0) ? .085 : .915;
  const u = x + side, v = y + ((3 * x + y) % 3 + 1) * .20;
  const gust = Math.sin(time * 1.8) * .057;
  p.poly([p.iso(u-.022,v,.022), p.iso(u-.045+gust*.63,v,.118),
    p.iso(u+.005,v,.073), p.iso(u+.043+gust,v-.015,.163),
    p.iso(u+.025,v,.070),p.iso(u+.082+gust*.52,v+.018,.104),
    p.iso(u+.034,v+.015,.022)], '#93a26e');
  return true;
}

export function drawTownMotion(p, building, model, motion) {
  const {type, x, y} = building;
  switch (type) {
    case 'house': farmhouse(p, x, y, motion); break;
    case 'barn': barn(p, x, y, motion); break;
    case 'trade': freightStation(p, x, y, motion); break;
    case 'road': return drawRoadMotion(p, building, motion);
    default: return false;
  }
  return true;
}
