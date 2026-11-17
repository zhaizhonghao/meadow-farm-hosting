import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPlacement,placementLabel} from '../dist/map-placement.mjs';
import {baseTileSize,farmFraming} from '../dist/map-camera.mjs';
import {createMeadowArtwork} from '../dist/meadow-art.mjs';
import {canPlace,canPlaceRoad,MAP_SIZE} from '../dist/rules.mjs';

const town = () => ({
  roads: [{x:7,y:8},{x:6,y:8},{x:5,y:5}],
  buildings: [{type:'trade',x:8,y:8},{type:'house',x:10,y:9}],
  delivery: {route:[{x:6.5,y:7.5}]}
});
test('placement previews match actual legality and distinguish service from a merely adjacent road',()=>{
  const s=town(),before=JSON.stringify(s);
  for(const type of ['well','road','barn','tree','wheat'])for(let x=-1;x<=MAP_SIZE;x++)for(let y=-1;y<=MAP_SIZE;y++){
    assert.equal(inspectPlacement(s,type,{x,y}).allowed,(type==='road'?canPlaceRoad:canPlace)(s,x,y));
  }
  const status=(type,x,y)=>inspectPlacement(s,type,{x,y}).status;
  assert.equal(status('well',6,9),'connected');
  assert.equal(status('mill',5,6),'roadNeeded');
  assert.equal(status('road',8,9),'connected'); // First road built next to the depot.
  assert.equal(status('wheat',5,6),'free');
  assert.equal(status('tree',5,6),'free');
  assert.equal(status('well',6,7),'truck');
  assert.equal(status('barn',9,8),'loading');
  assert.equal(status('road',0,12),'border');
  assert.equal(status('well',10,9),'occupied');
  assert.equal(status('barn',16,14),'river');
  assert.equal(status('road',16,14),'bridgeNeeded');
  assert.equal(placementLabel('bridgeNeeded','en'),'Bridge · needs depot road');
  assert.equal(JSON.stringify(s),before);
  for(let x=8;x<16;x++)s.roads.push({x,y:9});
  assert.equal(status('road',16,9),'bridge');
});
test('farm framing includes roofs and keeps starter facilities visible on desktop and phone',()=>{
  const buildings=[...town().buildings,{type:'mill',x:4,y:5},{type:'barn',x:7,y:3}];
  for(const [width,height] of [[945,486],[360,312]]){
    const frame=farmFraming(buildings,width,height),tile=baseTileSize(width,height)*frame.zoom;
    for(const b of buildings){
      const dx=b.x+.5-frame.x,dy=b.y+.5-frame.y;
      const x=width*.5+(dx-dy)*tile,y=height*.54+(dx+dy)*tile*.5;
      assert.ok(x-tile>=0&&x+tile<=width&&y-2*tile>=0&&y+.5*tile<=height);
    }
  }
  assert.deepEqual(farmFraming([],0,0),{x:12,y:12,zoom:1});
});
test('grass and creek textures are reused through camera changes and repaint only for a new light phase',()=>{
  let fills=0,boards=0,projections=0;
  const brush=new Proxy({fillRect(){fills++;}}, {get:(target,key)=>target[key]??(()=>{})});
  const art=createMeadowArtwork(24,16,()=>{boards++;return {getContext:()=>brush};});
  const surface={save(){},restore(){},transform(){},drawImage(){projections++;}};
  const iso=(x,y)=>({x:x-y,y:(x+y)/2});
  art(surface,iso,true);const onePass=fills;
  art(surface,(x,y)=>({x:x*2,y:y*2}),true);
  assert.equal(fills,onePass);assert.equal(boards,1);assert.equal(projections,2);
  art(surface,iso,false);assert.equal(fills,onePass*2);assert.equal(boards,1);
});
