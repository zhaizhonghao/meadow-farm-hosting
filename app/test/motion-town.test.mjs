import test from 'node:test';
import assert from 'node:assert/strict';
import {drawTownMotion, drawRoadMotion} from '../dist/motion-town.mjs';
import {RIVER_COLUMN} from '../dist/geography.mjs';

function painted(building, motion, angle = 0, tile = 48) {
  const marks = [], a = Math.cos(angle), b = Math.sin(angle);
  const iso = (x, y, z = 0) => {
    const u = x * a - y * b, v = x * b + y * a;
    return {x: (u-v)*tile, y: ((u+v)*.5-z)*tile};
  };
  const p = {tile, iso, facing: (x, y) => x * (a+b) + y * (a-b) > 0};
  for (const op of ['line','poly','ellipse']) p[op] = (...args) => marks.push([op,...args]);
  const drawn = building.type === 'road'
    ? drawRoadMotion(p, building, motion)
    : drawTownMotion(p, building, null, motion);
  return {marks, drawn};
}

test('town details move even while idle, freeze at a fixed time, and survive changes of view', () => {
  const buildings = ['barn','house','trade','road'].map(type => Object.freeze({x:7,y:8,type}));
  buildings.push(Object.freeze({x:RIVER_COLUMN,y:12,type:'road'}));
  for (const building of buildings) for (const angle of [0,.73,1.9,3.14,4.5]) for (const tile of [12,94]) {
    const idle = Object.freeze({time:2.6,traffic:false,night:false});
    const still = painted(building,idle,angle,tile);
    assert.ok(still.drawn && still.marks.length > 0, building.type);
    assert.deepEqual(still, painted(building,idle,angle,tile));
    assert.notDeepEqual(still, painted(building,{...idle,time:3.27},angle,tile));
    assert.doesNotMatch(JSON.stringify(still),/NaN|Infinity|null/);
  }
});

test('activity lamps follow real local traffic; only the occupied house lights its windows at night', () => {
  const t = {time:1.3,traffic:false,night:false};
  const render = (type, extra) => painted({x:8,y:8,type},{...t,...extra}).marks;
  for (const type of ['barn','trade']) {
    assert.ok(render(type,{traffic:true}).length > render(type,{}).length);
  }
  assert.equal(render('house',{night:true}).length, render('house',{}).length+2);
  assert.deepEqual(render('house',{traffic:true}), render('house',{}));
  assert.equal(painted({type:'well',x:2,y:2},t).drawn,false);
});
