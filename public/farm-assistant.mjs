import {activeContract} from './village.mjs?v=8.6.0';
import {RESOURCE_NAMES, RESOURCE_ICONS, ORDERS, capacity, layout, ownerFor, modelFor,
  challengeView, startDelivery, withFarmRead, WAREHOUSE_GOODS, warehouseStock} from './rules.mjs?v=8.6.0';
import {searchMatches} from './i18n.mjs?v=8.6.0';

export const DEFAULT_THRESHOLDS = {water: 6, wheat: 6, flour: 4, bread: 3, milk: 3, cake: 2, energy: 2, vegetables: 6, wood: 3};
export function preferences(s) {
  s.preferences ??= {};
  const p = s.preferences;
  p.thresholds ??= {};
  for(const [key,value] of Object.entries(DEFAULT_THRESHOLDS))p.thresholds[key] ??= value;
  p.automation ??= {enabled: false, reserve: 0, challengePriority: true, balanceProduction: true};
  if (!['selected', 'income', 'space'].includes(p.automation.policy)) p.automation.policy = 'selected';
  p.alerts ??= true;
  p.particles ??= true;
  p.facilityMotion ??= true;
  p.music ??= false;
  p.effects ??= true;
  p.volume ??= .35;
  return p;
}
export function setThreshold(s, resource, value) {
  if (!(resource in DEFAULT_THRESHOLDS) || !Number.isInteger(value) || value < 0 || value > 999) return false;
  preferences(s).thresholds[resource] = value;
  return true;
}
export function inventoryRows(s,query='',filter='all'){return withFarmRead(s,()=>filterInventoryRows(stockRows(s),query,filter))}
function stockRows(s) {
  const network = layout(s), relevant = new Set(), incoming = {}, working = {};
  for (const b of s.buildings) {
    const owner = ownerFor(s, b), m = modelFor(s, b);
    const enabled = owner?.enabled !== false;
    const inputs = m?.inputs || (b.type === 'wheat' ? {water: 1} : {});
    if (enabled && (network.connected(b) || b.type === 'wheat')) {
      Object.keys(inputs).forEach(k => relevant.add(k));
      Object.keys(m?.outputs || (b.type === 'wheat' ? {wheat: 2} : {})).forEach(k => relevant.add(k));
    }
    const job = owner?.job;
    for (const [k, amount] of Object.entries(job?.outputs || {})) {
      working[k] = (working[k] || 0) + amount;
      if (enabled && job.haul && job.remaining <= job.haul.duration) incoming[k] = (incoming[k] || 0) + amount;
    }
  }
  const thresholds = preferences(s).thresholds;
  const processed = warehouseStock(s);
  return Object.keys(RESOURCE_NAMES).map(resource => {
    const amount = s[resource] || 0, limit = capacity(s, resource, network);
    const used = WAREHOUSE_GOODS.includes(resource) ? processed : amount;
    const threshold = thresholds[resource] ?? DEFAULT_THRESHOLDS[resource];
    const low = relevant.has(resource) && threshold > 0 && amount < threshold;
    const storageGroup = WAREHOUSE_GOODS.includes(resource) ? 'processed' : resource;
    const full = amount > 0 && used >= limit && limit > 0;
    const tight = amount > 0 && used >= limit * .8 && limit > 0;
    return {resource, name: RESOURCE_NAMES[resource], icon: RESOURCE_ICONS[resource], amount,
      limit, used, incoming: incoming[resource] || 0, working: working[resource] || 0, threshold,
      relevant: relevant.has(resource), storageGroup, low, full, tight,
      status: !limit ? 'no-store' : low ? 'low' : full ? 'full' : !relevant.has(resource) && !amount ? 'inactive' : tight ? 'tight' : 'healthy'};
  });
}
export function filterInventoryRows(rows,query='',filter='all'){
  return rows.filter(row => (filter === 'all' || filter === 'low' && row.low || filter === 'incoming' && row.incoming > 0)
    && query.trim().split(/\s+/).every(word => searchMatches(word, row.name, row.resource, row.resource==='wood'?'木头 原木 lumber logs timber wood':'',
      row.low ? '低库存 low stock shortage' : '', row.full ? '满仓 full' : '',
      row.incoming ? '在途 incoming transit' : '')));
}
// A state transition, rather than a once-per-second toast, is a notification.
// Initial shortages remain visible in the inventory without interrupting play.
export function stockAlerts(rows) {
  const fullGroups = new Set(rows.filter(row => row.full).map(row => row.storageGroup || row.resource));
  const orderedGroups = [...new Set(['processed','wheat',...fullGroups])].filter(group => fullGroups.has(group));
  return orderedGroups.map(group => `${group}:full`)
    .concat(rows.filter(row => row.low).map(row => `${row.resource}:low`));
}
export function alertTransitions(previous, rows) {
  const next = new Set(stockAlerts(rows));
  return {next, added: previous ? [...next].filter(key => !previous.has(key)) : []};
}
export function freightPlan(s, now = Date.now()) {
  const settings = preferences(s).automation;
  const view = challengeView(s, now);
  const goals = view.status === 'active' ? view.goals.filter(g => g.kind === 'shipped' && g.value < g.target) : [];
  const priority = settings.challengePriority && goals.length > 0;
  let orders = ORDERS;
  if (priority) orders = goals.map(g => ORDERS.find(o => o.resource === g.resource)).filter(Boolean);
  else if (settings.policy === 'selected') orders = ORDERS.filter(o => o.id === s.selectedOrder);

  const network = layout(s);
  const visitor = view.status === 'active' ? null : activeContract(s);
  const ingredients = {};
  for (const b of s.buildings) {
    if (!network.connected(b) || ownerFor(s, b)?.enabled === false) continue;
    const m = modelFor(s, b);
    if (!m?.inputs) continue;
    const outputsDone = view.status === 'active' && Object.keys(m.outputs).every(k =>
      view.goals.some(g => g.kind === 'produced' && g.resource === k && g.value >= g.target));
    if (!outputsDone) for (const [key, amount] of Object.entries(m.inputs)) {
      ingredients[key] = Math.max(ingredients[key] || 0, amount);
    }
  }
  const loads = [];
  for (const order of orders) {
    const reserve = Math.max(ingredients[order.resource] || 0, Number(settings.reserve) || 0, visitor?.goods[order.resource] || 0);
    const available = (s[order.resource] || 0) - reserve;
    if (available >= order.amount) loads.push({order, reserve, available});
  }
  if (!loads.length) return {reason: priority ? '等待任务产品，保留加工原料' : '等待库存超过保留数量'};
  if (!s.buildings.some(b => ['barn','warehouse'].includes(b.type) && network.connected(b) && ownerFor(s,b)?.enabled !== false)) {
    return {reason: '请接通仓库与货运站道路'};
  }
  // All products share the same truck. Optimize a single trip; challenge
  // targets retain their existing order whenever challenge priority is on.
  if (!priority && settings.policy === 'income') loads.sort((a,b) => b.order.cash - a.order.cash);
  if (!priority && settings.policy === 'space') loads.sort((a,b) => b.order.amount - a.order.amount || b.available - a.available);
  return {...loads[0], priority, reason: '库存充足，等待装车'};
}
// A truck first reduces any excess left after a warehouse has been removed.
export function spaceAfterShipment(s, order) {
  const used = warehouseStock(s), limit = capacity(s, order.resource);
  const after = used - order.amount;
  return {released:Math.max(0,limit-after)-Math.max(0,limit-used), overflow:Math.max(0,after-limit)};
}
export function automationDecision(s, now = Date.now()) {
  if (!preferences(s).automation.enabled) return {reason: '自动出售已关闭'};
  if (s.delivery) return {reason: '等待货车回站'};
  return freightPlan(s, now);
}
export function runAutomation(s, now = Date.now()) {
  const decision = automationDecision(s, now);
  if (!decision.order) return decision;
  const dispatched = startDelivery(s, now, decision.order.id);
  if (!dispatched) return {...decision, reason: '请接通仓库与货运站道路'};
  s.delivery.automatic = true;
  return {...decision, dispatched: true, reason: '自动货车已出发'};
}
