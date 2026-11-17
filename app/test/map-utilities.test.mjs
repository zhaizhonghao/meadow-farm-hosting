import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG, ORDINARY_CATALOG} from '../dist/rules.mjs';
import {createSolidPrimitives, shade} from '../dist/facility-primitives.mjs';
import {drawUtility} from '../dist/map-utilities.mjs';

const types = ['solar','wind','tower','silo','warehouse','tractor','depot'];
const models = [...ORDINARY_CATALOG,...CATALOG].filter(m => types.includes(m.type));
function paint(model, angle, time = 0) {
  const geometry = [], c = Math.cos(angle), s = Math.sin(angle);
  function point(x,y,z = 0) {
    assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z));
    assert.ok(x >= -.4 && x <= 1.4 && y >= -.4 && y <= 1.4 && z >= 0 && z <= 2.2, model.id);
    return {x:(c-s)*x-(s+c)*y, y:((c+s)*x+(c-s)*y)/2-z};
  }
  function poly(points) {geometry.push(points);}
  function line(a,b,_color,width) {assert.ok(width>0);geometry.push([a,b]);}
  function ellipse(center,rx,ry) {assert.ok(rx>0 && ry>0);geometry.push([center,rx,ry]);}
  const p = {iso:point,tile:24,depth:(x,y)=>(c+s)*x+(c-s)*y,
    facing:(x,y)=>(c+s)*x+(c-s)*y>0, poly,line,ellipse,shade};
  Object.assign(p,createSolidPrimitives(p));
  assert.ok(drawUtility(p,{type:model.type,x:0,y:0},model,time));
  // Ignore paint colors to distinguish genuine shape changes from recoloring.
  return JSON.stringify(geometry);
}

test('utility geometry fits its tile during an entire camera orbit for all catalogue grades',()=>{
  for (const model of models) for(let angle=0;angle<2*Math.PI;angle+=Math.PI/4){
    assert.ok(paint(model,angle).length>100, model.id);
  }
  assert.equal(drawUtility({}, {type:'wheat'}),false);
});
test('vehicle mechanisms, rooftop and double solar racks, tanks, grain bins and cargo bays have distinct geometry',()=>{
  for (const type of types) {
    const ordinary=ORDINARY_CATALOG.filter(m=>m.type===type);
    assert.equal(new Set(ordinary.map(m=>paint(m,0))).size,3,type);
  }
  const tractors=models.filter(m=>m.type==='tractor');
  const field=tractors.find(m=>m.id==='tractor-field'), robot=tractors.find(m=>m.id==='tractor-ranger');
  assert.notEqual(paint(field,0),paint(robot,0));
  assert.notEqual(paint(field,0),paint(tractors.find(m=>m.grade===1),0));
});
test('only the wind rotor needs time-dependent drawing among utility facilities',()=>{
  for(const model of models) assert.equal(paint(model,.37,0)!==paint(model,.37,1600), model.type==='wind', model.id);
});
