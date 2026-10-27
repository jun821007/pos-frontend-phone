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

  function parseKeyword(key) {
    const raw = compact(key);
    if (!raw) return null;
    if (raw.includes('duo')) return { type: 'duo', raw };
    const model = raw.match(/^(\d{1,2})(pro|plus|mini|e)?$/);
    if (model && Number(model[1]) >= 4 && Number(model[1]) <= 30) {
      return { type: 'model', series: Number(model[1]), variant: model[2] || '', raw };
    }
    return { type: 'text', raw };
  }

  function keywordMatches(phone, keyword) {
    const model = String((phone && (phone.modelName || phone.name)) || '');
    const folded = compact(model);
    if (keyword.type === 'duo') return folded.includes('duo');
    if (folded.includes('duo')) return false;
    if (keyword.type === 'model') {
      const profile = phoneProfile(model);
      if (profile.series !== keyword.series) return false;
      if (keyword.variant) return profile.variant === keyword.variant;
      return !profile.variant;
    }
    return folded.includes(keyword.raw);
  }

  function findKitRow(phone, map) {
    let best = null;
    ((map && map.rows) || []).forEach((row) => {
      const keyword = parseKeyword(row && row.key);
      if (!keyword || !keywordMatches(phone, keyword)) return;
      const score = keyword.raw.length + (keyword.type === 'duo' ? 20 : 0);
      if (!best || score > best.score) best = { row, score };
    });
    return best ? best.row : null;
  }

  function findAccessory(accessories, id) {
    const wanted = String(id || '').trim();
    if (!wanted) return null;
    return (accessories || []).find((item) => item && String(item.id) === wanted) || null;
  }

  function takeMapped(accessories, id, label, who, warnings) {
    if (!String(id || '').trim()) {
      warnings.push(who + ' 沒有設定' + label);
      return null;
    }
    const item = findAccessory(accessories, id);
    if (!item) {
      warnings.push(who + ' 的' + label + '已不在庫存');
      return null;
    }
    if ((Number(item.stock) || 0) <= 0) {
      warnings.push(item.name + ' 無庫存');
      return null;
    }
    return item;
  }

  function resolvePhoneKit(phone, accessories, map) {
    const model = String((phone && (phone.modelName || phone.name)) || '');
    const kind = cableKindForModel(model);
    const warnings = [];
    const who = model || (phone && phone.stock_id) || '這台';
    const cfg = map || {};
    const items = [];
    const row = findKitRow(phone, cfg);
    if (!row) warnings.push(who + ' 缺對照，沒有加入玻璃貼與空壓殼');
    else {
      const glass = takeMapped(accessories, row.glassId, '亮面玻璃貼', who, warnings);
      const shell = takeMapped(accessories, row.caseId, '空壓殼', who, warnings);
      if (glass) items.push(glass);
      if (shell) items.push(shell);
    }
    if (!kind) warnings.push(who + ' 認不出充電線規格');
    else {
      const cableId = kind === 'cc' ? cfg.cableCCId : cfg.cableCLId;
      if (String(cableId || '').trim()) {
        const cable = takeMapped(accessories, cableId, kind === 'cc' ? 'C to C' : 'C to L', who, warnings);
        if (cable) items.push(cable);
      } else {
        const cable = pickBest(accessories, (item) => cableScore(item, kind));
        if (!cable || !cable.item) warnings.push(who + ' 找不到' + (kind === 'cc' ? 'C to C' : 'C to L'));
        else if (cable.out) warnings.push(cable.item.name + ' 無庫存');
        else items.push(cable.item);
      }
    }
    if (String(cfg.chargerId || '').trim()) {
      const charger = takeMapped(accessories, cfg.chargerId, '快充頭', who, warnings);
      if (charger) items.push(charger);
    }
    return { kind, warnings, items };
  }

  function buildPhoneKitAdds(phones, accessories, cartQty, map) {
    const warnings = [];
    const want = new Map();
    (phones || []).forEach((phone) => {
      const plan = resolvePhoneKit(phone, accessories, map);
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

  return { compact, cableKindForModel, parseKeyword, findKitRow, resolvePhoneKit, buildPhoneKitAdds, newPhoneSerialBlocks };
});
