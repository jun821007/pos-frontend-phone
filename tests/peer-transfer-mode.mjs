import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.lastIndexOf('<script>');
const end = html.lastIndexOf('</script>');
const src = html.slice(start + '<script>'.length, end);

function grab(name) {
  const at = src.search(new RegExp('function ' + name + '\\s*\\('));
  if (at < 0) throw new Error('missing ' + name);
  let depth = 0;
  let started = false;
  for (let i = at; i < src.length; i++) {
    if (src[i] === '{') { depth += 1; started = true; }
    else if (src[i] === '}') {
      depth -= 1;
      if (started && depth === 0) return src.slice(at, i + 1);
    }
  }
  throw new Error('unclosed ' + name);
}

assert.equal(src.includes('modalServiceStockTransfer'), false);
assert.equal(src.includes('togglePeerTransferMode'), true);
assert.equal(src.includes('peerTransferMode'), true);

const context = {
  SERVICE_TRANSFER_BATTERY_CATS: ['成品大容量電池', '原廠拆機電池0循環', '已加工成品電池'],
  SERVICE_TRANSFER_PARTS_CATS: ['手機維修料件'],
  UI: { peerTransferMode: false }
};
vm.createContext(context);
vm.runInContext([
  'serviceTransferCat', 'isServiceTransferBatteryItem', 'isServiceTransferPartsItem',
  'cartItemAllowedInPeerTransfer', 'peerTransferKindOf', 'peerTransferInventoryName', 'applyPeerTransferToCartItem'
].map(grab).join('\n'), context);

assert.equal(context.cartItemAllowedInPeerTransfer({ type: 'accessory', name: '17pro/亮面' }), true);
assert.equal(context.cartItemAllowedInPeerTransfer({ type: 'phone', name: 'iPhone' }), false);
assert.equal(context.cartItemAllowedInPeerTransfer({ type: 'new_phone', name: '新機' }), false);
assert.equal(context.cartItemAllowedInPeerTransfer({ type: 'repair', name: '維修:14' }), false);
assert.equal(context.cartItemAllowedInPeerTransfer({ type: 'direct_transfer', name: '調貨:殼', isDirectTransfer: true }), false);
assert.equal(context.cartItemAllowedInPeerTransfer({ type: 'accessory', isDirectTransfer: true }), false);

const acc = context.applyPeerTransferToCartItem({ type: 'accessory', name: '17pro/亮面', price: 300, cost: 100, quantity: 2, itemId: 'A073', category: '三王玻17系列' }, '同行甲');
assert.equal(acc.isPeerStockTransfer, true);
assert.equal(acc.inventoryName, '17pro/亮面');
assert.equal(acc.name, '調貨 17pro/亮面');
assert.equal(acc.dealerName, '同行甲');
assert.equal(acc.transferKind, 'acc');

const parts = context.applyPeerTransferToCartItem({ type: 'accessory', name: '13pm感光排線', price: 0, cost: 230, isGift: true, category: '手機維修料件' }, '同行乙');
assert.equal(parts.transferKind, 'parts');
assert.match(parts.name, /\[維修料件調貨\]/);
assert.match(parts.name, /贈/);

const bat = context.applyPeerTransferToCartItem({ type: 'accessory', name: '13 電池', price: 500, cost: 400, category: '成品大容量電池' }, '同行丙');
assert.equal(bat.transferKind, 'battery');
assert.equal(bat.name, '調貨 13 電池');

console.log('peer transfer mode ok');
