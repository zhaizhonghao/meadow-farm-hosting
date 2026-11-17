import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarmAccount, startDailyChallenge, startDelivery, tick} from '../dist/rules.mjs';
import {buildStarter, startNewRound} from '../dist/round-layout.mjs';
import {freightPlan, preferences, runAutomation} from '../dist/farm-assistant.mjs';
import {acceptContract, contractOffers} from '../dist/village.mjs';
import {salesReport} from '../dist/sales.mjs';

const base = Date.parse('2030-05-12T10:00:00+08:00');
function stockedFarm() {
  const farm = newFarmAccount('A', base);
  assert.ok(buildStarter(farm));
  Object.assign(farm, {bread: 6, cake: 4, vegetables: 12, wood: 3});
  return farm;
}

test('old and unknown freight preferences use the manual selection; previews never dispatch', () => {
  const farm = stockedFarm();
  farm.preferences.automation = {enabled: false, reserve: 2};
  assert.equal(freightPlan(farm, base).order.id, 'bread');
  assert.equal(farm.preferences.automation.policy, 'selected');
  farm.preferences.automation.policy = 'unknown';
  assert.equal(freightPlan(farm, base).order.id, 'bread');
  farm.preferences.automation.policy = 'income';
  assert.equal(freightPlan(farm, base).order.id, 'cake');
  assert.equal(runAutomation(farm, base).dispatched, undefined);
  assert.equal(farm.cake, 4);
  assert.equal(farm.delivery, undefined);
  assert.equal(startNewRound(farm, false, base+1000).preferences.automation.policy, 'income');
});

test('one truck chooses income or warehouse space, preserves the selected manual product, and settles on return', () => {
  const farm = stockedFarm();
  const settings = preferences(farm).automation;
  settings.enabled = true;
  settings.policy = 'income';
  assert.equal(freightPlan(farm, base).order.id, 'cake');
  settings.policy = 'space';
  assert.equal(freightPlan(farm, base).order.id, 'vegetables');
  const coins = farm.cash;
  assert.ok(runAutomation(farm, base).dispatched);
  assert.equal(farm.delivery.resource, 'vegetables');
  assert.equal(farm.vegetables, 6);
  assert.equal(farm.cash, coins);
  assert.equal(farm.selectedOrder, 'bread');
  settings.policy = 'income';
  assert.equal(runAutomation(farm, base).dispatched, undefined);
  for (let i=1; i<=12; i++) tick(farm, base+i*1000);
  assert.equal(farm.cash, coins+60);
  assert.equal(salesReport(farm,'all').trips, 1);
  assert.ok(startDelivery(farm, base+12000));
  assert.equal(farm.delivery.resource,'bread');
});

test('both freight policies keep reserves and respect higher-priority challenge deliveries', () => {
  const farm = stockedFarm();
  const settings = preferences(farm).automation;
  const basket = contractOffers(farm)[0];
  assert.ok(acceptContract(farm,basket.id));
  farm.bread = 4;
  farm.cake = 0;
  farm.vegetables = 0;
  farm.wood = 0;
  settings.policy = 'income';
  assert.equal(freightPlan(farm,base).order, undefined);
  farm.wood = 3;
  assert.equal(freightPlan(farm,base).order.id, 'wood');
  settings.reserve = 1;
  assert.equal(freightPlan(farm,base).order, undefined);
  Object.assign(farm, {cake: 20, vegetables: 20, bread: 6});
  assert.ok(startDailyChallenge(farm,'bread-rush',base));
  for (const policy of ['income','space']) {
    settings.policy = policy;
    assert.equal(freightPlan(farm,base).order.id, 'bread');
    assert.equal(freightPlan(farm,base).priority, true);
  }
  settings.challengePriority = false;
  assert.equal(freightPlan(farm,base).order.id, 'vegetables');
  farm.roads = [];
  assert.equal(freightPlan(farm,base).order, undefined);
});
