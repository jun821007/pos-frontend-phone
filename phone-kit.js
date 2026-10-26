(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PhoneKit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function compact(value) {
    return String(value || '').replace(/[\s\u3000]+/g, '').toLowerCase();
  }

  // 14 與更早是 C to L。15 起，以及名稱含 Duo，是 C to C。
  function cableKindForModel(model) {
    const c = compact(model);
    if (!c || c.includes('ipad')) return null;
    if (c.includes('duo')) return 'cc';
    let series = null;
    const iphone = c.match(/iphone(\d+)/);
    if (iphone) series = Number(iphone[1]);
    else {
      const lead = c.match(/^(\d{1,2})/);
      if (lead) series = Number(lead[1]);
    }
    if (!series || series < 4 || series > 30) return null;
    return series >= 15 ? 'cc' : 'cl';
  }

  function phoneProfile(model) {
    const c = compact(model);
    const iphone = c.match(/iphone(\d{1,2})(pro|plus|mini|e)?/);
    const lead = !iphone && c.match(/^(\d{1,2})(pro|plus|mini|e)?/);
    const hit = iphone || lead;
    return {
      series: hit ? Number(hit[1]) : null,
      variant: hit && hit[2] ? hit[2] : '',
      label: String(model || '').trim()
    };
  }

  function modelFit(profile, blob) {
    if (!profile.series) return 0;
    const text = compact(blob);
    const tokens = [];
    const re = /(\d{1,2})(pro|plus|mini|e)?/g;
    let match;
    while ((match = re.exec(text))) {
      const series = Number(match[1]);
      if (series >= 4 && series <= 30) tokens.push({ series, variant: match[2] || '' });
    }
    const hits = tokens.filter((token) => token.series === profile.series);
    if (!hits.length) return 0;
    if (profile.variant) {
      if (hits.some((token) => token.variant === profile.variant)) return 3;
      if (hits.some((token) => !token.variant)) return 1;
      return 0;
    }
    return hits.some((token) => !token.variant) ? 2 : 0;
  }

  function isGlass(item) {
    const cat = String(item.category || '');
    const name = String(item.name || '');
    return (cat.includes('玻') || name.includes('玻')) && name.includes('亮面');
  }

  function isCase(item) {
    const cat = String(item.category || '');
    const name = String(item.name || '');
    return cat.includes('空壓') || name.includes('空壓');
  }

  function cableScore(item, kind) {
    const name = String(item.name || '');
    const folded = compact(name);
    const cl = /c\s*to\s*l|lightning|c轉l/i.test(name) || /ctol|lightning/.test(folded);
    const cc = /c\s*to\s*c|c轉c/i.test(name) || /ctoc/.test(folded);
    if (kind === 'cl' && cl && !cc) return folded.includes('快充') ? 2 : 1;
    if (kind === 'cc' && cc && !cl) return folded.includes('快充') ? 2 : 1;
    return 0;
  }

  function pickBest(list, scoreFn) {
    const ranked = [];
    (list || []).forEach((item) => {
      if (!item || item.type === 'phone' || item.type === 'new_stock' || item.type === 'peer_phone') return;
      const score = scoreFn(item);
      if (score > 0) ranked.push({ item, score, stock: Number(item.stock) || 0 });
    });
    if (!ranked.length) return null;
    ranked.sort((a, b) => {
      const stockRank = (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
      if (stockRank) return stockRank;
      return b.score - a.score;
    });
    const top = ranked[0];
    const same = ranked.filter((row) => (row.stock > 0) === (top.stock > 0) && row.score === top.score);
    return { item: top.item, out: top.stock <= 0, many: same.length > 1 };
  }

  function resolvePhoneKit(phone, accessories) {
    const model = String((phone && (phone.modelName || phone.name)) || '');
    const profile = phoneProfile(model);
    const kind = cableKindForModel(model);
    const warnings = [];
    const who = model || (phone && phone.stock_id) || '這台';
    if (!kind) warnings.push(who + ' 認不出充電線規格');
    const glass = pickBest(accessories, (item) => (isGlass(item) ? modelFit(profile, item.name + (item.category || '')) : 0));
    const shell = pickBest(accessories, (item) => (isCase(item) ? modelFit(profile, item.name + (item.category || '')) : 0));
    const cable = kind ? pickBest(accessories, (item) => cableScore(item, kind)) : null;
    const slots = [
      { label: '亮面玻璃貼', found: glass },
      { label: '空壓殼', found: shell },
      { label: kind === 'cc' ? 'C to C' : 'C to L', found: cable }
    ];
    const items = [];
    slots.forEach((slot) => {
      if (!slot.found || !slot.found.item) {
        if (slot.label === 'C to L' || slot.label === 'C to C') {
          if (kind) warnings.push(who + ' 找不到' + slot.label);
        } else warnings.push(who + ' 找不到' + slot.label);
        return;
      }
      if (slot.found.out) warnings.push(slot.found.item.name + ' 無庫存');
      else {
        items.push(slot.found.item);
        if (slot.found.many) warnings.push(slot.label + ' 對到多項，先帶「' + slot.found.item.name + '」');
      }
    });
    return { kind, warnings, items };
  }

  function buildPhoneKitAdds(phones, accessories, cartQty) {
    const warnings = [];
    const want = new Map();
    (phones || []).forEach((phone) => {
      const plan = resolvePhoneKit(phone, accessories);
      warnings.push(...plan.warnings);
      plan.items.forEach((item) => {
        const id = String(item.id);
        const row = want.get(id) || { item, count: 0 };
        row.count += 1;
        want.set(id, row);
      });
    });
    const adds = [];
    want.forEach((row) => {
      const stock = Number(row.item.stock) || 0;
      const used = Number(cartQty && cartQty[String(row.item.id)]) || 0;
      const room = Math.max(0, stock - used);
      const qty = Math.min(row.count, room);
      if (qty < row.count) warnings.push(row.item.name + ' 庫存 ' + stock + '，有 ' + (row.count - qty) + ' 組沒加到');
      if (qty > 0) adds.push({ item: row.item, qty });
    });
    return { adds, warnings };
  }

  function newPhoneSerialBlocks(phones) {
    const missing = [];
    const blocks = (phones || []).map((phone) => {
      const serial = String((phone && (phone.imei || phone.serialNumber)) || '').trim();
      const head = [phone && (phone.modelName || phone.model) || '', phone && phone.capacity || '', phone && phone.color || ''].filter(Boolean).join(' ');
      if (!serial) missing.push((phone && phone.stock_id) || head || '未編號');
      return head + '\n序號:' + serial;
    });
    return { text: blocks.join('\n'), missing };
  }

  return { compact, cableKindForModel, resolvePhoneKit, buildPhoneKitAdds, newPhoneSerialBlocks };
});
