import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG, ORDINARY_CATALOG} from '../dist/rules.mjs';
import {drawUtilityMotion} from '../dist/motion-utilities.mjs';

const supported = new Set(['solar','wind','tower','silo','warehouse','tractor','depot']);
const models=[...ORDINARY_CATALOG,...CATALOG].filter(m=>supported.has(m.type));

function frame(model, time, angle=0, overrides={}) {
  const parts=[],x=8,y=5,tile=32;
  const motion=Object.freeze({time,working:true,enabled:true,night:false,traffic:false,...overrides});
  const c=Math.cos(angle),s=Math.sin(angle);
  const p={tile,facing:(dx,dy)=>(c+s)*dx+(c-s)*dy>0,
    iso:(u,v,z)=>{
      assert.ok(u>=x && u<=x+1.12 && v>=y && v<=y+1.12 && z>=0 && z<=2.3,model.id);
      return {x:((c-s)*(u-x)-(s+c)*(v-y))*tile,y:(((c+s)*(u-x)+(c-s)*(v-y))*.5-z)*tile};
    },
    line:(a,b,color,width)=>{assert.ok(width>0);parts.push([a,b,color,width]);},
    poly:(points,color)=>parts.push([points,color]),
    ellipse:(a,w,h,color)=>{assert.ok(w>0 && h>0);parts.push([a,w,h,color]);}
  };
  assert.ok(drawUtilityMotion(p,{x,y,type:model.type},model,motion));
  return parts;
}

test('30 utility models have deterministic tile-local motion across camera rotations and light phases',()=>{
  assert.equal(models.length,30);
  for(const m of models) {
    const t=.57;
    for(let i=0;i<8;i++)for(const night of [true,false]){
      const a=i*Math.PI/4;
      const frameA=frame(m,t,a,{night}),frameB=frame(m,t+.43,a,{night});
      assert.deepEqual(frameA,frame(m,t,a,{night}));
      frame(m,t,a,{night,working:false,enabled:false});
      frame(m,t,a,{night,traffic:true});
      if(m.type==='wind' && frameA.length===0)continue; // The existing rotor moves on the front.
      assert.notDeepEqual(frameA,frameB,m.id);
      assert.ok(frameA.length<=15,m.id);
    }
  }
  assert.equal(drawUtilityMotion({}, {type:'house'}, null, {}),false);
});

test('utility motion distinguishes natural idle movement, powered standby, hauling and irrigation',()=>{
  const model=id=>models.find(m=>m.id===id);
  const robot=model('tractor-ranger'), active=(m,overrides={})=>frame(m,.75,0,overrides);
  const offline={working:false,enabled:false};
  const parked=active(robot,offline),later=frame(robot,4,0,offline);
  assert.deepEqual(parked.slice(0,-1),later.slice(0,-1)); // Dark, stationary lidar.
  assert.notDeepEqual(parked.at(-1),later.at(-1)); // Wind still moves the safety ribbon.
  assert.deepEqual(active(robot,offline),active(robot,{...offline,traffic:true}));
  assert.notDeepEqual(active(robot,{traffic:false}),active(robot,{traffic:true}));
  const tower=model('advanced-tower');
  assert.ok(active(tower).length>active(tower,{working:false}).length);
  assert.deepEqual(active(tower,{working:false}),active(tower,{enabled:false}));
  const warehouse=model('standard-warehouse');
  assert.notDeepEqual(active(warehouse),active(warehouse,{traffic:true}));
  assert.deepEqual(active(warehouse),active(warehouse,{traffic:true,enabled:false}));
  const solar=model('solar-array');
  assert.notDeepEqual(active(solar),active(solar,{night:true}));
});
