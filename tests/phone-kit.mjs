import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { cableKindForModel, buildPhoneKitAdds, newPhoneSerialBlocks } = require('../phone-kit.js');

assert.equal(cableKindForModel('iphone 13 pro'), 'cl');
assert.equal(cableKindForModel('iPhone 14'), 'cl');
assert.equal(cableKindForModel('iphone 15'), 'cc');
assert.equal(cableKindForModel('iPhone 16 Pro'), 'cc');
assert.equal(cableKindForModel('iPhone Duo'), 'cc');

const acc = [
  { id: 'g13', type: 'accessory', category: '玻璃貼', name: '13 亮面', cost: 30, defaultPrice: 150, stock: 4 },
  { id: 'gmist', type: 'accessory', category: '玻璃貼', name: '13 霧面', cost: 30, defaultPrice: 150, stock: 4 },
  { id: 'c1314', type: 'accessory', category: '空壓殼', name: '13/14', cost: 40, defaultPrice: 200, stock: 2 },
  { id: 'g15', type: 'accessory', category: '玻璃貼', name: '15 亮面', cost: 30, defaultPrice: 150, stock: 1 },
  { id: 'c15', type: 'accessory', category: '空壓殼', name: '15', cost: 40, defaultPrice: 200, stock: 0 },
  { id: 'cl', type: 'accessory', category: '充電線頭', name: '快充 C to L', cost: 50, defaultPrice: 250, stock: 3 },
  { id: 'cc', type: 'accessory', category: '充電線頭', name: '快充 C to C', cost: 55, defaultPrice: 280, stock: 1 }
];

const one13 = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 13' }], acc, {});
assert.deepEqual(one13.adds.map((row) => [row.item.id, row.qty]), [['g13', 1], ['c1314', 1], ['cl', 1]]);

const one14 = buildPhoneKitAdds([{ type: 'phone', modelName: 'iPhone 14' }], acc, {});
assert.equal(one14.adds.find((row) => row.item.id === 'c1314').qty, 1);
assert.equal(one14.adds.some((row) => row.item.id === 'c15'), false);

const one15 = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 15' }], acc, {});
assert.equal(one15.adds.some((row) => row.item.id === 'cc'), true);
assert.equal(one15.adds.some((row) => row.item.id === 'c15'), false);
assert.match(one15.warnings.join(' '), /無庫存/);

const duo = buildPhoneKitAdds([{ type: 'phone', modelName: 'iPhone Duo' }], acc, {});
assert.equal(duo.adds.some((row) => row.item.id === 'cc'), true);
assert.equal(duo.adds.some((row) => row.item.id === 'cl'), false);

const mixed = buildPhoneKitAdds([
  { type: 'phone', modelName: 'iphone 13' },
  { type: 'phone', modelName: 'iphone 15' }
], acc, {});
assert.equal(mixed.adds.find((row) => row.item.id === 'cl').qty, 1);
assert.equal(mixed.adds.find((row) => row.item.id === 'cc').qty, 1);
assert.equal(mixed.adds.find((row) => row.item.id === 'g13').qty, 1);
assert.equal(mixed.adds.find((row) => row.item.id === 'g15').qty, 1);

const tight = buildPhoneKitAdds([
  { type: 'phone', modelName: 'iphone 13' },
  { type: 'phone', modelName: 'iphone 13' }
], acc.map((item) => item.id === 'g13' ? { ...item, stock: 1 } : item), { g13: 0 });
assert.equal(tight.adds.find((row) => row.item.id === 'g13').qty, 1);
assert.match(tight.warnings.join(' '), /13 亮面 庫存 1/);

const serial = newPhoneSerialBlocks([
  { modelName: 'iPhone 15', capacity: '128', color: '黑', imei: 'SN1', stock_id: 'A' },
  { modelName: 'iPhone 14', capacity: '256', color: '白', imei: '', stock_id: 'B' }
]);
assert.equal(serial.text, 'iPhone 15 128 黑\n序號:SN1\niPhone 14 256 白\n序號:');
assert.deepEqual(serial.missing, ['B']);

console.log('phone kit checks ok');
