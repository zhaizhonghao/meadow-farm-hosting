import {canPlace, canPlaceRoad, layout, MAP_SIZE, RIVER_COLUMN} from './rules.mjs?v=8.6.0';

const labels = {
  occupied: ['位置已占用', 'Tile occupied'],
  border: ['地图边缘不可建造', 'Map edge · no building'],
  river: ['溪流上只能架桥', 'Only bridges cross the creek'],
  loading: ['货运通道需留空', 'Keep the loading bay clear'],
  truck: ['货车正在使用此路', 'Truck route in use'],
  connected: ['已接通货运站', 'Depot road connected'],
  roadNeeded: ['可建造 · 需另接道路', 'Buildable · needs depot road'],
  bridge: ['架桥 · 已接通货运站', 'Bridge · connected to depot'],
  bridgeNeeded: ['可架桥 · 需另接道路', 'Bridge · needs depot road'],
  free: ['可建造', 'Buildable']
};
export const placementLabel = (status, language) => labels[status][language === 'en' ? 1 : 0];

// Road access is advice only. Players may lay out disconnected infrastructure
// now and link it later; fields and trees do not need a road alongside them.
export function inspectPlacement(farm, type, point, network) {
  const {x, y} = point, road = type === 'road';
  if (!(road ? canPlaceRoad : canPlace)(farm, x, y)) {
    let status = 'occupied';
    if (x < 1 || y < 1 || x >= MAP_SIZE - 1 || y >= MAP_SIZE - 1) status = 'border';
    else if (!road && x === RIVER_COLUMN) status = 'river';
    else if (x === 9 && y === 8) status = 'loading';
    else if (farm.delivery?.route?.some(p => Math.floor(p.x) === x && Math.floor(p.y) === y)) status = 'truck';
    return {allowed: false, status, tone: 'blocked'};
  }
  if (type === 'tree' || type === 'wheat') return {allowed: true, status: 'free', tone: 'ready'};
  const served = (network || layout(farm)).connected(point) || road && farm.buildings.some(
    b => b.type === 'trade' && Math.abs(b.x - x) + Math.abs(b.y - y) === 1
  );
  const status = x === RIVER_COLUMN ? (served ? 'bridge' : 'bridgeNeeded') : (served ? 'connected' : 'roadNeeded');
  return {allowed: true, status, tone: served ? 'ready' : 'warning'};
}
