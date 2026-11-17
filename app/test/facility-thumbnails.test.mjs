import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG, ordinaryShopItems} from '../dist/rules.mjs';
import {facilityIllustration} from '../dist/asset-art.mjs';

test('every current shop and collectible model has distinct, finite, deterministic artwork', () => {
  const models = [...ordinaryShopItems(), ...CATALOG];
  const seen = new Map();
  for (const model of models) {
    const picture = facilityIllustration(model);
    const [x,y,w,h] = picture.viewBox.split(' ').map(Number);
    assert.ok([x,y,w,h].every(Number.isFinite) && w > 0 && h > 0, model.id);
    assert.doesNotMatch(picture.markup, /NaN|Infinity|undefined|currentColor/, model.id);
    assert.match(picture.markup, /<polygon /, model.id);
    assert.deepEqual(facilityIllustration({...model}), picture, model.id);
    assert.equal(seen.has(picture.markup), false, `${model.id} looks identical to ${seen.get(picture.markup)}`);
    seen.set(picture.markup, model.id);
  }
});
