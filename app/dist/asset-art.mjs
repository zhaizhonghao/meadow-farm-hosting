import {createSolidPrimitives, facilityAccent, shade} from './facility-primitives.mjs?v=8.6.0';
import {drawUtility} from './map-utilities.mjs?v=8.6.0';
import {drawWorkshop} from './map-workshops.mjs?v=8.6.0';
import {drawTownBuilding} from './map-town-buildings.mjs?v=8.6.0';

import {drawWorkshopMotion} from './motion-workshops.mjs?v=8.6.0';
import {drawUtilityMotion} from './motion-utilities.mjs?v=8.6.0';
import {drawTownMotion} from './motion-town.mjs?v=8.6.0';

const svgNamespace = 'http://www.w3.org/2000/svg';
const previews = new Map();
let definitions;

// Record the same geometry used in the game at the unrotated camera angle.
// Bounds include rotor tips, roof overhangs, cargo and shadows, so every model
// can be displayed in both a narrow build button and a full detail view.
function thumbnailPainter() {
  const tile = 56;
  const parts = [];
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const precision = n => Number(n.toFixed(2));
  function include(x, y, rx = 0, ry = rx) {
    left = Math.min(left, x - rx); right = Math.max(right, x + rx);
    top = Math.min(top, y - ry); bottom = Math.max(bottom, y + ry);
  }
  const depth = (x, y) => x + y;
  const facing = (nx, ny) => nx + ny > 0;
  const iso = (x, y, z = 0) => ({x: (x - y) * tile, y: ((x + y) / 2 - z) * tile});
  function poly(points, fill, stroke) {
    const pairs = points.map(({x, y}) => {
      include(x, y, stroke ? .35 : 0);
      return precision(x) + ',' + precision(y);
    });
    parts.push(`<polygon points="${pairs.join(' ')}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width=".7"` : ''}/>`);
  }
  function line(a, b, stroke, width = 2) {
    include(a.x, a.y, width / 2); include(b.x, b.y, width / 2);
    parts.push(`<path d="M${precision(a.x)} ${precision(a.y)}L${precision(b.x)} ${precision(b.y)}" fill="none" stroke="${stroke}" stroke-width="${precision(width)}"/>`);
  }
  function ellipse({x, y}, rx, ry, fill) {
    include(x, y, rx, ry);
    const hasAlpha = /^#[\da-f]{8}$/i.test(fill);
    const paint = hasAlpha ? `fill="${fill.slice(0,7)}" fill-opacity="${precision(parseInt(fill.slice(7),16) / 255)}"` : `fill="${fill}"`;
    parts.push(`<ellipse cx="${precision(x)}" cy="${precision(y)}" rx="${precision(rx)}" ry="${precision(ry)}" ${paint}/>`);
  }
  const primitives = {iso, poly, line, ellipse, facing, depth, shade, tile};
  Object.assign(primitives, createSolidPrimitives(primitives));
  function picture() {
    const margin = 4;
    return {
      markup: parts.join(''),
      viewBox: [left - margin, top - margin, right - left + 2 * margin, bottom - top + 2 * margin].map(precision).join(' ')
    };
  }
  return {primitives, picture};
}

function drawRoad({quad, iso, line}) {
  quad(-.03, .23, 1.06, .61, .025, '#c2ac80');
  quad(-.03, .27, 1.06, .53, .033, '#dbc79e');
  for (const y of [.35, .68]) line(iso(-.02,y,.04), iso(1.02,y,.04), '#beac88', 1.2);
}

// Both the static poster and the single live shop preview use this pose and plinth.
export function paintFacilityIllustration(p, model, time, running) {
  const ordinary = !!model.ordinary;
  const building = {x: 0, y: 0, type: model.type, modelId: model.id, ordinary};
  if (!ordinary) building.assetId = model.id;
  const accent = facilityAccent(building, model);
  p.ellipse(p.iso(.55,.58,-.07), p.tile, p.tile * .47, '#41543820');
  p.box(-.035,-.035,1.07,1.07,.065, ordinary ? '#b9a885' : '#41867b', '#b2c78a', -.065);
  if (!ordinary) {
    p.quad(.015,.015,.97,.97,.004,'#a3cbb3');
    for (const [x,y] of [[.035,.035],[.91,.035],[.035,.91],[.91,.91]]) p.quad(x,y,.05,.05,.008,'#e2c16c');
  }
  if (model.type === 'road') drawRoad(p);
  else if (!drawTownBuilding(p, building) && !drawUtility(p, building, model, time*1000, accent)) {
    drawWorkshop(p, building, model, time*1000, accent, {growth:1, liveParts:running, hearthGlow:!running});
  }
  const motion={time,phase:(time/4)%1,enabled:true,working:running,traffic:running,preview:!running,night:false,growth:1};
  if (!drawWorkshopMotion(p,building,model,motion) && !drawUtilityMotion(p,building,model,motion)) {
    drawTownMotion(p,building,model,motion);
  }
}

export function facilityIllustration(model) {
  const {primitives,picture}=thumbnailPainter();
  paintFacilityIllustration(primitives,model,.78,false);
  return picture();
}

// A shared definition per model keeps filters, market listings, and the build
// toolbar light. Each visible card adds only a vector viewport and one <use>.
export function assetArt(model) {
  const key = model.id;
  let preview = previews.get(key);
  if (!preview) {
    if (!definitions) {
      const atlas = document.createElementNS(svgNamespace, 'svg');
      atlas.setAttribute('class', 'facility-art-atlas');
      atlas.setAttribute('width', '0'); atlas.setAttribute('height', '0');
      atlas.setAttribute('aria-hidden', 'true'); atlas.setAttribute('focusable', 'false');
      atlas.setAttribute('data-i18n-ignore', '');
      definitions = document.createElementNS(svgNamespace, 'defs');
      atlas.append(definitions); document.body.append(atlas);
    }
    const {markup, viewBox} = facilityIllustration(model);
    const group = document.createElementNS(svgNamespace, 'g');
    group.id = 'farm-preview-' + key;
    group.innerHTML = markup;
    definitions.append(group);
    preview = `<svg class="facility-thumbnail" data-model="${key}" viewBox="${viewBox}" aria-hidden="true" focusable="false"><use href="#${group.id}"/></svg>`;
    previews.set(key, preview);
  }
  return preview;
}
