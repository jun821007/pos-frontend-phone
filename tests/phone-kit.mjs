import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { cableKindForModel, resolvePhoneKit, newPhoneSerialBlocks } = require('../phone-kit.js');

assert.equal(cableKindForModel('iphone 13 pro'), 'cl');
assert.equal(cableKindForModel('iPhone 14'), 'cl');
assert.equal(cableKindForModel('iphone 15'), 'cc');
assert.equal(cableKindForModel('iPhone 16 Pro'), 'cc');
assert.equal(cableKindForModel('iPhone Duo'), 'cc');
assert.equal(cableKindForModel('iPad'), null);

const acc = [
  { id: 'g13', type: 'accessory', category: '玻璃貼', name: '13 亮面', cost: 30, defaultPrice: 150, stock: 4 },
  { id: 'c13', type: 'accessory', category: '空壓殼', name: '13 空壓', cost: 40, defaultPrice: 200, stock: 2 },
  { id: 'g15', type: 'accessory', category: '玻璃貼', name: '15 亮面', cost: 30, defaultPrice: 150, stock: 1 },
  { id: 'c15', type: 'accessory', category: '空壓殼', name: '15 空壓', cost: 40, defaultPrice: 200, stock: 0 },
  { id: 'cl', type: 'accessory', category: '充電線頭', name: '快充 C to L', cost: 50, defaultPrice: 250, stock: 3 },
  { id: 'cc', type: 'accessory', category: '充電線頭', name: '快充 C to C', cost: 55, defaultPrice: 280, stock: 3 }
];
const kit13 = resolvePhoneKit({ type: 'phone', modelName: 'iphone 13', stock_id: '1' }, acc, {});
assert.deepEqual(kit13.items.map((item) => item.id), ['g13', 'c13', 'cl']);
const kit15 = resolvePhoneKit({ type: 'phone', modelName: 'iphone 15', stock_id: '2' }, acc, {});
assert.equal(kit15.kind, 'cc');
assert.equal(kit15.items.some((item) => item.id === 'c15'), false);
assert.match(kit15.warnings.join(' '), /無庫存/);
assert.equal(kit15.items.some((item) => item.id === 'cc'), true);

const serial = newPhoneSerialBlocks([
  { modelName: 'iPhone 15', capacity: '128', color: '黑', imei: 'SN1', stock_id: 'A' },
  { modelName: 'iPhone 14', capacity: '256', color: '白', imei: '', stock_id: 'B' }
]);
assert.equal(serial.text, 'iPhone 15 128 黑\n序號:SN1\niPhone 14 256 白\n序號:');
assert.deepEqual(serial.missing, ['B']);

console.log('phone kit checks ok');
