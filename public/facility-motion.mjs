import {layout, modelFor, ownerFor, productionInfo, withFarmRead} from './rules.mjs?v=8.6.0';

// Neighbouring wells, rotors and flags should not all move in lockstep.
// Coordinates survive a save/reload and work for the fractional scenery cells.
export function phaseOffset(b) {
  const x = Math.round(b.x * 10), y = Math.round(b.y * 10);
  return ((Math.imul(x, 73) ^ Math.imul(y, 151)) >>> 0) % 997 / 997 * 9;
}

const cellKey = b => b.x + ',' + b.y;
const near = (a, b, radius) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y) <= radius;

// Sample gameplay once per update. Drawing another frame, rotating the camera
// or displaying a preview must never run production, consume stock, or save.
export function facilityActivity(state, hauling) {
  return withFarmRead(state, () => {
    const network = layout(state), records = new Map();
    const paidCargo = new Set(hauling.map(entry => entry.job));
    const unloading = new Set(), movingFrom = [], growing = [];
    for (const {job} of hauling) {
      if (job.remaining <= 0 || job.remaining > job.haul.duration) continue;
      if(job.haul.destination)unloading.add(cellKey(job.haul.destination));
      if(job.haul.source)movingFrom.push(job.haul.source);
    }
    for (const arrival of state.haulArrivals || []) {
      const age = state.seconds - arrival.at;
      if (arrival.destination && age >= 0 && age < 2) unloading.add(cellKey(arrival.destination));
    }
    for (const b of state.buildings) {
      const model = modelFor(state,b), owner = ownerFor(state,b), job = owner?.job;
      const enabled = owner?.enabled !== false;
      const activeBatch = enabled && job && job.remaining > (job.haul?.duration || 0);
      const working = !!activeBatch && (job.haul ? paidCargo.has(job) : !productionInfo(state,b,network).blocked);
      if (working && (b.type === 'wheat' || b.type === 'vegetable')) growing.push(b);
      records.set(b, {model, enabled, working, traffic:false, offset:phaseOffset(b)});
    }
    for (const [b,entry] of records) {
      if (!entry.enabled) continue;
      switch (b.type) {
        case 'silo': case 'barn': case 'warehouse':
          entry.working = entry.traffic = unloading.has(cellKey(b)) && network.connected(b);
          break;
        case 'tower':
          entry.working = state.water > 0 && network.connected(b) && growing.some(c => near(b,c,entry.model?.radius || 0));
          break;
        case 'tractor':
          entry.working = (ownerFor(state,b)?.chargeRemaining || 0) > 0 && network.connected(b);
          entry.traffic = entry.working && movingFrom.some(source => near(b,source,entry.model?.radius || 0));
          break;
        case 'depot':
          entry.working = entry.traffic = !!state.delivery?.fast && network.connected(b);
          break;
        case 'trade':
          entry.working = entry.traffic = !!state.delivery;
          break;
      }
    }
    return records;
  });
}

export function motionFrame(seconds, entry, offset, night, growth, animated, preview = false) {
  const time = (animated && entry?.enabled !== false ? seconds : 0) + offset;
  return {time, phase:(time / 4) % 1, enabled:entry?.enabled !== false,
    working:entry?.working === true, traffic:entry?.traffic === true,
    night, growth:growth ?? 1, preview};
}
