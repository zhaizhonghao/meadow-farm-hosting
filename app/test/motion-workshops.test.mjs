import test from 'node:test';
import assert from 'node:assert/strict';
import {drawWorkshopMotion} from '../dist/motion-workshops.mjs';
import {drawWorkshop} from '../dist/map-workshops.mjs';
import {createSolidPrimitives,shade} from '../dist/facility-primitives.mjs';
import {ordinaryShopItems,CATALOG} from '../dist/rules.mjs';

const types=['well','mill','bakery','dairy','cakery','vegetable','lumber','wheat','tree'];
const models=[...ordinaryShopItems(),...CATALOG].filter(m=>types.includes(m.type));
const frozenModel=Object.freeze({type:'tree',grade:0});
function frame(model, angle, motion, includeBody=false) {
  const c=Math.cos(angle),s=Math.sin(angle), geometry=[];
  const mesh={
    tile:47, shade,
    iso(x,y,z=0){return {x:((c+s)*x+(s-c)*y)*47,y:((c-s)*x+(c+s)*y)*23.5-z*47};},
    depth:(x,y)=>(c-s)*x+(c+s)*y,
    facing:(x,y)=>(c-s)*x+(c+s)*y>0,
    poly(points,color){geometry.push([color,...points]);},
    line(a,b,color,width){assert.ok(width>0);geometry.push([color,a,b,width]);},
    ellipse(center,rx,ry,color){assert.ok(rx>0 && ry>0);geometry.push([color,center,rx,ry]);}
  };
  Object.assign(mesh,createSolidPrimitives(mesh));
  const b=Object.freeze({x:4,y:7,type:model.type,ordinary:model.ordinary,scenery:motion.scenery});
  if(includeBody)drawWorkshop(mesh,b,model,motion.time*1000,'#849968',{growth:motion.growth,liveParts:motion.enabled});
  assert.ok(drawWorkshopMotion(mesh,b,model,motion));
  for(const primitive of geometry){
    for(const pt of primitive){
      if(pt && typeof pt==='object')assert.ok(Number.isFinite(pt.x) && Number.isFinite(pt.y),model.id);
    }
  }
  return geometry;
}
test('all farm models animate in use and at rest from eight headings; dynamic layers stay small',()=>{
  for(const model of models)for(let i=0;i<8;i++)for(const working of [true,false]){
    const m={time:.31,working,enabled:true,night:false,growth:.7,preview:false};
    const angle=i*Math.PI/4, existingMotion=['wheat','mill'].includes(model.type);
    const a=frame(model,angle,m,existingMotion);
    const b=frame(model,angle,{...m,time:.84},existingMotion);
    assert.notDeepEqual(a,b,model.id+' '+angle+' '+working);
    if(!existingMotion)assert.ok(a.length<=28,model.id);
  }
  assert.equal(drawWorkshopMotion({}, {type:'house'}),false);
});
test('paused assets and building previews suppress job effects and have stable poses',()=>{
  for(const model of models)for(const mode of [{enabled:false},{enabled:true,preview:true}]){
    const m={time:.2,growth:.7,working:true,...mode};
    assert.deepEqual(frame(model,.8,m),frame(model,.8,{...m,time:2.1,working:false}),model.id);
  }
});
test('a cut orchard tree only moves grass beside the stump; scenery and mature fruit retain different canopies',()=>{
  const m={time:.31,working:false,enabled:true,growth:0};
  const stump=frame(frozenModel,0,m);
  assert.equal(stump.length,1);
  assert.notDeepEqual(stump,frame(frozenModel,0,{...m,time:.84}));
  const foliage=frame(frozenModel,0,{...m,growth:1});
  assert.notDeepEqual(foliage,frame(frozenModel,0,{...m,growth:1,scenery:true}));
});
