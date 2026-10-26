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

  function modelKeys(model) {
    const c = compact(model);
    const keys = [];
    const iphone = c.match(/iphone(\d+)(pro|plus|mini|e)?/);
    const lead = !iphone && c.match(/^(\d{1,2})(pro|plus|mini|e)?/);
    const hit = iphone || lead;
    if (!hit) return keys;
    if (hit[2]) keys.push(hit[1] + hit[2]);
    keys.push(hit[1]);
    return keys;
  }

  function defaultPhoneKit() {
    return {
      glassName: '亮面',
      glassCategory: '玻',
      caseName: '',
      caseCategory: '空壓',
      cableCL: '',
      cableCC: '',
      models: []
    };
  }

  function pickAcc(list, pred) {
    const hits = (list || []).filter((item) => item && item.type !== 'new_stock' && item.type !== 'phone' && pred(item));
    const inStock = hits.filter((item) => Number(item.stock) > 0);
    return { item: inStock[0] || hits[0] || null, count: hits.length, out: hits.length > 0 && inStock.length === 0 };
  }

  function byHint(list, hint) {
    const raw = String(hint || '').trim();
    if (!raw) return null;
    const key = compact(raw);
    return pickAcc(list, (item) => String(item.id) === raw || compact(item.name) === key || compact(item.name).includes(key));
  }

  function autoSlot(list, keys, categoryIncludes, nameIncludes) {
    return pickAcc(list, (item) => {
      const cat = String(item.category || '');
      const name = String(item.name || '');
      if (categoryIncludes && !cat.includes(categoryIncludes) && !name.includes(categoryIncludes)) return false;
      if (nameIncludes && !name.includes(nameIncludes)) return false;
      if (!keys.length) return false;
      const blob = compact(name + cat);
      return keys.some((key) => blob.includes(key));
    });
  }

  function resolvePhoneKit(phone, accessories, kit) {
    const cfg = Object.assign(defaultPhoneKit(), kit || {});
    const model = String((phone && (phone.modelName || phone.name)) || '');
    const kind = cableKindForModel(model);
    const keys = modelKeys(model);
    const warnings = [];
    if (!kind) warnings.push((model || (phone && phone.stock_id) || '這台') + ' 認不出充電線規格');
    const override = (cfg.models || []).slice().sort((a, b) => compact(b.key).length - compact(a.key).length)
      .find((row) => row && row.key && compact(model).includes(compact(row.key)));
    const glass = override && override.glass ? byHint(accessories, override.glass) : autoSlot(accessories, keys, cfg.glassCategory, cfg.glassName);
    const shell = override && override.shell ? byHint(accessories, override.shell) : autoSlot(accessories, keys, cfg.caseCategory, cfg.caseName);
    let cable = null;
    if (kind === 'cl') {
      cable = cfg.cableCL
        ? byHint(accessories, cfg.cableCL)
        : pickAcc(accessories, (item) => /ctol|cto\s*l|c\s*to\s*l|lightning|c轉l/i.test(String(item.name || '')));
    } else if (kind === 'cc') {
      cable = cfg.cableCC
        ? byHint(accessories, cfg.cableCC)
        : pickAcc(accessories, (item) => /ctoc|c\s*to\s*c|type-c\s*to\s*type-c|c轉c|雙頭/i.test(String(item.name || '')));
    }
    const slots = [
      { label: '亮面玻璃貼', found: glass, explicit: !!(override && override.glass) },
      { label: '空壓殼', found: shell, explicit: !!(override && override.shell) },
      { label: kind === 'cc' ? 'C to C' : 'C to L', found: cable, explicit: kind === 'cc' ? !!cfg.cableCC : !!cfg.cableCL }
    ];
    const items = [];
    slots.forEach((slot) => {
      if (!slot.found || !slot.found.item) {
        warnings.push(model + ' 找不到' + slot.label);
        return;
      }
      if (slot.found.out) warnings.push(slot.found.item.name + ' 無庫存');
      else {
        items.push(slot.found.item);
        if (!slot.explicit && slot.found.count > 1) warnings.push(slot.label + ' 對到多項，先帶「' + slot.found.item.name + '」');
      }
    });
    return { kind, warnings, items };
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

  return { compact, cableKindForModel, modelKeys, defaultPhoneKit, resolvePhoneKit, newPhoneSerialBlocks };
});
