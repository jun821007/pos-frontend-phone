import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { cableKindForModel, buildPhoneKitAdds, newPhoneSerialBlocks } = require('../phone-kit.js');

assert.equal(cableKindForModel('iphone 13'), 'cl');
assert.equal(cableKindForModel('iPhone 14'), 'cl');
assert.equal(cableKindForModel('iphone 15'), 'cc');
assert.equal(cableKindForModel('iPhone Duo'), 'cc');

const acc = [
  { id: 'g13', type: 'accessory', category: '玻璃貼', name: '指定13亮面', cost: 30, defaultPrice: 150, stock: 4 },
  { id: 'g13b', type: 'accessory', category: '玻璃貼', name: '另一張13亮面', cost: 30, defaultPrice: 150, stock: 4 },
  { id: 'c13', type: 'accessory', category: '空壓殼', name: '指定13空壓', cost: 40, defaultPrice: 200, stock: 2 },
  { id: 'g15', type: 'accessory', category: '玻璃貼', name: '15 亮面', cost: 30, defaultPrice: 150, stock: 4 },
  { id: 'cl', type: 'accessory', category: '充電線頭', name: '快充 C to L', cost: 50, defaultPrice: 250, stock: 3 },
  { id: 'cc', type: 'accessory', category: '充電線頭', name: '快充 C to C', cost: 55, defaultPrice: 280, stock: 3 },
  { id: 'wire', type: 'accessory', category: '充電線頭', name: '指定線', cost: 10, defaultPrice: 20, stock: 2 },
  { id: 'head', type: 'accessory', category: '充電頭', name: '20W頭', cost: 40, defaultPrice: 100, stock: 1 }
];

const map13 = { rows: [{ key: '13', glassId: 'g13', caseId: 'c13' }], cableCLId: '', cableCCId: '', chargerId: '' };
const one13 = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 13' }], acc, {}, map13);
assert.deepEqual(one13.adds.map((row) => row.item.id), ['g13', 'c13', 'cl']);

const changed = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 13' }], acc, {}, {
  rows: [{ key: '13', glassId: 'g13b', caseId: 'c13' }]
});
assert.equal(changed.adds[0].item.id, 'g13b');

const pro = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 13 pro' }], acc, {}, map13);
assert.equal(pro.adds.some((row) => row.item.id === 'g13' || row.item.id === 'c13'), false);
assert.match(pro.warnings.join(' '), /缺對照/);
assert.equal(pro.adds.some((row) => row.item.id === 'cl'), true);

const unset = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 14' }], acc, {}, map13);
assert.match(unset.warnings.join(' '), /缺對照/);
assert.equal(unset.adds.some((row) => row.item.id === 'g15' || row.item.id === 'g13'), false);
assert.equal(unset.adds.some((row) => row.item.id === 'cl'), true);

const fifteen = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 15' }], acc, {}, { rows: [] });
assert.equal(fifteen.adds.some((row) => row.item.id === 'cc'), true);
assert.equal(fifteen.adds.some((row) => row.item.id === 'g15'), false);

const duo = buildPhoneKitAdds([{ type: 'phone', modelName: 'iPhone Duo' }], acc, {}, { rows: [] });
assert.equal(duo.adds.some((row) => row.item.id === 'cc'), true);
assert.equal(duo.adds.some((row) => row.item.id === 'cl'), false);

const wired = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 13' }], acc, {}, {
  rows: [{ key: '13', glassId: 'g13', caseId: 'c13' }],
  cableCLId: 'wire',
  chargerId: 'head'
});
assert.equal(wired.adds.some((row) => row.item.id === 'wire'), true);
assert.equal(wired.adds.some((row) => row.item.id === 'cl'), false);
assert.equal(wired.adds.some((row) => row.item.id === 'head'), true);

const dry = buildPhoneKitAdds([{ type: 'phone', modelName: 'iphone 13' }], acc.map((item) => item.id === 'g13' ? { ...item, stock: 0 } : item), {}, map13);
assert.equal(dry.adds.some((row) => row.item.id === 'g13' || row.item.id === 'g13b'), false);
assert.equal(dry.adds.some((row) => row.item.id === 'c13'), true);
assert.match(dry.warnings.join(' '), /無庫存/);

const tight = buildPhoneKitAdds([
  { type: 'phone', modelName: 'iphone 13' },
  { type: 'phone', modelName: 'iphone 13' }
], acc.map((item) => item.id === 'g13' ? { ...item, stock: 1 } : item), {}, map13);
assert.equal(tight.adds.find((row) => row.item.id === 'g13').qty, 1);
assert.match(tight.warnings.join(' '), /庫存 1/);

const serial = newPhoneSerialBlocks([
  { modelName: 'iPhone 15', capacity: '128', color: '黑', imei: 'SN1', stock_id: 'A' }
]);
assert.equal(serial.text, '黑1\niPhone 15 128 黑\n序號:SN1');

const grouped = newPhoneSerialBlocks([
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '銀', imei: 'SFLKFX21K2D' },
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '藍', imei: 'SK4G1CC4R07' },
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '黃', imei: 'SK9KV4V6517' },
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '黃', imei: 'SJ3MQXHL95T' },
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '藍', imei: 'SFHQKQVJF7P' }
]);
assert.equal(grouped.text, [
  '銀1 藍2 黃2',
  'iPad 11 Wifi 128g 銀',
  '序號:SFLKFX21K2D',
  '',
  'iPad 11 Wifi 128g 藍',
  '序號:SK4G1CC4R07',
  'iPad 11 Wifi 128g 藍',
  '序號:SFHQKQVJF7P',
  '',
  'iPad 11 Wifi 128g 黃',
  '序號:SK9KV4V6517',
  'iPad 11 Wifi 128g 黃',
  '序號:SJ3MQXHL95T'
].join('\n'));

const multiModel = newPhoneSerialBlocks([
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '銀', imei: 'AAA' },
  { modelName: 'iPhone 15', capacity: '256', color: '黑', imei: 'BBB' },
  { modelName: 'iPad 11 Wifi', capacity: '128g', color: '藍', imei: 'CCC' },
  { modelName: 'iPhone 15', capacity: '256', color: '白', imei: 'DDD' }
]);
assert.equal(multiModel.text, [
  '銀1 藍1',
  'iPad 11 Wifi 128g 銀',
  '序號:AAA',
  '',
  'iPad 11 Wifi 128g 藍',
  '序號:CCC',
  '',
  '黑1 白1',
  'iPhone 15 256 黑',
  '序號:BBB',
  '',
  'iPhone 15 256 白',
  '序號:DDD'
].join('\n'));

console.log('phone kit checks ok');
