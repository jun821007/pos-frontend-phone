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
assert.equal(serial.text, 'iPhone 15 128 黑\n序號:SN1');

console.log('phone kit checks ok');
