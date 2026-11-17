import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarmAccount,buildOrdinary,tick,haulerSnapshot,startDelivery} from '../dist/rules.mjs';
import {buildStarter} from '../dist/round-layout.mjs';
import {facilityActivity,motionFrame,phaseOffset} from '../dist/facility-motion.mjs';
const base=Date.parse('2030-05-12T10:00:00+08:00');
const sample=s=>facilityActivity(s,haulerSnapshot(s));
const ofType=(s,type)=>s.buildings.find(b=>b.type===type);

test('work effects follow a paid production job; a detached, stopped or hauling oven has no fire',()=>{
  const s=newFarmAccount('A',base);buildStarter(s);s.flour=20;s.water=20;
  tick(s,base+1000);
  const b=ofType(s,'bakery'), barn=ofType(s,'barn');
  assert.ok(b.job?.haul);
  const unchanged=JSON.stringify(s);
  assert.equal(sample(s).get(b).working,true);
  assert.equal(JSON.stringify(s),unchanged);
  b.enabled=false;
  assert.equal(sample(s).get(b).working,false);
  b.enabled=true;const oldRoads=s.roads;s.roads=[];
  assert.equal(sample(s).get(b).working,false);
  s.roads=oldRoads;
  b.job.remaining=b.job.haul.duration;
  let records=sample(s);
  assert.equal(records.get(b).working,false);
  assert.equal(records.get(barn).traffic,true);
  for (const facility of s.buildings) delete facility.job;
  s.haulArrivals=[{destination:{x:barn.x,y:barn.y},at:s.seconds}];
  assert.equal(sample(s).get(barn).traffic,true);
  s.seconds+=2;
  assert.equal(sample(s).get(barn).traffic,false);
});

test('night suspends solar power and a fast delivery drives the freight lights',()=>{
  const s=newFarmAccount('A',base);buildStarter(s);
  let add=(type)=>{
    for(let y=1;y<20;y++)for(let x=1;x<20;x++){
      if(s.roads.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)===1)&&buildOrdinary(s,type,x,y))return ofType(s,type);
    }
    assert.fail(type);
  };
  const solar=add('solar'), depot=add('depot'), trade=ofType(s,'trade');
  s.flour=4;s.energy=10;s.bread=5;tick(s,base+1000);
  assert.ok(solar.job);
  assert.equal(sample(s).get(solar).working,true);
  s.seconds=120;
  assert.equal(sample(s).get(solar).working,false);
  assert.equal(sample(s).get(depot).traffic,false);
  assert.equal(startDelivery(s,base+2000,'bread'),true);
  assert.equal(sample(s).get(trade).traffic,true);
  assert.equal(sample(s).get(depot).traffic,true);
  delete s.delivery;assert.equal(sample(s).get(trade).traffic,false);
});

test('the facility clock has reproducible offsets and holds a fixed pose with motion off',()=>{
  const b={x:7,y:5},entry={enabled:true,working:true},offset=phaseOffset(b);
  assert.equal(offset,phaseOffset({...b}));assert.notEqual(offset,phaseOffset({x:7,y:6}));
  const frame=(s,enabled,animated)=>motionFrame(s,{...entry,enabled},offset,false,.65,animated);
  assert.notEqual(frame(1,true,true).time,frame(2,true,true).time);
  assert.deepEqual(frame(1,true,false),frame(200,true,false));
  assert.deepEqual(frame(1,false,true),frame(200,false,true));
  const preview=motionFrame(15,undefined,offset,true,0,true,true);
  assert.equal(preview.working,false);assert.equal(preview.traffic,false);assert.equal(preview.growth,0);
});
