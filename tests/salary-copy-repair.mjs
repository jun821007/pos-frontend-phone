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

const context = {
  UI: { salaryMonthRows: [] },
  getOrderGroupForSalary(orderId) {
    if (orderId === 'ORD840321') {
      return { items: [{ type: 'repair', itemName: '(維) 維修:14｜換後玻璃' }] };
    }
    if (orderId === 'ORD111') {
      return { items: [{ type: 'phone', itemName: '(二) iPhone 13 128 黑' }] };
    }
    return null;
  },
  ymdTaipei() { return '2026-10-30'; }
};
vm.createContext(context);
vm.runInContext([
  'stripLedgerName', 'parseRepairLedgerParts', 'salaryRepairFact', 'salaryOrderItems',
  'salaryRepairFacts', 'isSalaryRepairCopy', 'salaryCopyBlock', 'buildSalaryCopyText'
].map(grab).join('\n'), context);

const repair = context.buildSalaryCopyText([{
  orderId: 'ORD840321', customer: '王先生', label: '維修', kind: 'repair', amount: 2000, formula: '手填 $2,000', detail: '維修'
}]);
assert.match(repair, /維修　王先生　\$2,000/);
assert.match(repair, /14　換後玻璃/);
assert.match(repair, /ORD840321/);
assert.doesNotMatch(repair, /\[薪資\]/);

const slash = context.buildSalaryCopyText([{
  orderId: 'ORD999', customer: '小明', label: '維修', kind: 'repair', amount: 800, detail: '維修:15／換電池'
}]);
assert.match(slash, /15　換電池/);
assert.match(slash, /ORD999/);

const used = context.buildSalaryCopyText([{
  orderId: 'ORD111', customer: '阿明', label: '二手機', kind: 'used', amount: 500, formula: '手填 $500', detail: '(二) iPhone 13 128 黑'
}]);
assert.match(used, /1\. ORD111　阿明　二手機　\$500/);
assert.match(used, /手填 \$500/);
assert.doesNotMatch(used, /換後玻璃/);

const card = context.buildSalaryCopyText([{
  orderId: 'ORD222', customer: '阿華', label: '網卡', kind: 'card', amount: 100, formula: '手填 $100'
}]);
assert.match(card, /1\. ORD222　阿華　網卡　\$100/);
assert.match(card, /手填 \$100/);

console.log(repair);
console.log('---');
console.log(used);
console.log('salary copy repair ok');
