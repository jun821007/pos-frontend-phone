// Run: node tests/ledger-and-gift.mjs
function mapCartItemLikeConfirmCheckout(item) {
  if (item._prebuilt) return item;
  let finalName = item.name.replace("(贈)", "").trim();
  const safePrice = Number(item.price) || 0;
  const safeCost = Number(item.cost) || 0;
  const safeQty = Number(item.quantity) || 1;
  return {
    itemName: finalName,
    type: item.type,
    itemId: item.itemId,
    salePrice: safePrice * safeQty,
    cost: safeCost * safeQty,
    profit: (safePrice - safeCost) * safeQty,
    quantity: safeQty,
    category: item.category || "",
  };
}
function aggregateTodayStats(salesRows) {
  const stats = { cash: 0, pending: 0, profit: 0, pot: 0, exp: 0, gift: 0 };
  for (const i of salesRows) {
    if (i.status === "Returned" || i.status === "Deleted") continue;
    if (i.category === "調整入庫") continue;
    if (i.type === "expense" || i.type === "restock" || i.type === "salary") {
      const cost = Number(i.cost) || 0;
      stats.exp += Math.abs(cost);
      stats.cash -= Math.abs(cost);
      continue;
    }
    const sale = Number(i.salePrice) || 0;
    const cost = Number(i.cost) || 0;
    const isMultiExtra =
      i.type === "phone" && sale === 0 && (i.itemName || "").includes(" + ");
    const iProfit =
      i.profit !== undefined && i.profit !== null && i.profit !== ""
        ? Number(i.profit)
        : sale - cost;
    if (!isMultiExtra) {
      if (i.status === "Completed") {
        stats.cash += sale;
        if (i.type !== "wrap") stats.profit += iProfit;
      } else if (i.status === "Pending") {
        stats.pending += sale;
        if (i.type !== "wrap") stats.pot += iProfit;
      }
      if (sale === 0 && cost > 0 && !isMultiExtra) stats.gift += cost;
    }
  }
  return stats;
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
const gift5 = mapCartItemLikeConfirmCheckout({
  type: "accessory",
  name: "測試線 (贈)",
  price: 0,
  cost: 25,
  quantity: 5,
  itemId: "ACC-1",
  category: "線材",
});
assert(gift5.salePrice === 0, "gift salePrice");
assert(gift5.cost === 125, "gift cost");
assert(gift5.profit === -125, "gift profit");
assert(gift5.quantity === 5, "gift qty");
const paid3 = mapCartItemLikeConfirmCheckout({
  type: "accessory",
  name: "充電頭",
  price: 100,
  cost: 40,
  quantity: 3,
  itemId: "ACC-2",
});
assert(paid3.salePrice === 300 && paid3.profit === 180, "paid3");
const statsGift = aggregateTodayStats([
  {
    orderId: "O1",
    type: "accessory",
    itemName: "測試線 (贈) x5",
    salePrice: 0,
    cost: 125,
    profit: -125,
    status: "Completed",
  },
]);
assert(statsGift.cash === 0 && statsGift.gift === 125 && statsGift.profit === -125, "statsGift");
const statsMix = aggregateTodayStats([
  {
    orderId: "O2",
    type: "accessory",
    itemName: "充電頭",
    salePrice: 300,
    cost: 120,
    profit: 180,
    status: "Completed",
  },
  {
    orderId: "O2",
    type: "accessory",
    itemName: "測試線 (贈) x5",
    salePrice: 0,
    cost: 125,
    profit: -125,
    status: "Completed",
  },
]);
assert(statsMix.cash === 300 && statsMix.gift === 125 && statsMix.profit === 55, "statsMix");
const statsPending = aggregateTodayStats([
  {
    orderId: "O3",
    type: "accessory",
    itemName: "贈線 x3",
    salePrice: 0,
    cost: 60,
    profit: -60,
    status: "Pending",
  },
]);
assert(
  statsPending.cash === 0 &&
    statsPending.pending === 0 &&
    statsPending.pot === -60 &&
    statsPending.gift === 60,
  "statsPending",
);
function displayName(itemName, qty) {
  return itemName + (qty > 1 ? " x" + qty : "");
}
assert(displayName("線", 1) === "線", "dn1");
assert(displayName("線 (贈)", 5) === "線 (贈) x5", "dn5");

function calcCopyProfit(it) {
  const sale = Number(it.salePrice) || 0;
  const cost = Number(it.cost) || 0;
  return it.profit !== undefined && it.profit !== null && it.profit !== ""
    ? Number(it.profit)
    : sale - cost;
}
function isGiftAccessory(it) {
  const sale = Number(it.salePrice) || 0;
  const cost = Number(it.cost) || 0;
  return it.type === "accessory" && sale === 0 && cost > 0;
}
function isCardCopyItem(it) {
  const n = (it.itemName || it.name || "").toLowerCase();
  return n.includes("泰國註冊卡") || n.includes("網卡") || n.includes("esim");
}
function calcGiftAllocation(normalized) {
  const G = normalized.reduce(
    (s, it) => (isGiftAccessory(it) ? s + (Number(it.cost) || 0) : s),
    0,
  );
  const alloc = { used: 0, new: 0, repair: 0, acc: 0, card: 0 };
  if (G <= 0) return alloc;
  const hasUsed = normalized.some(
    (it) => it.type === "phone" || it.type === "peer_phone",
  );
  const hasNew = normalized.some((it) => it.type === "new_phone");
  if (hasUsed || hasNew) {
    let remaining = G;
    if (hasUsed) {
      const usedProfit = normalized
        .filter((it) => it.type === "phone" || it.type === "peer_phone")
        .reduce((s, it) => s + calcCopyProfit(it), 0);
      alloc.used = hasNew ? Math.min(remaining, Math.max(0, usedProfit)) : remaining;
      remaining -= alloc.used;
    }
    if (hasNew && remaining > 0) alloc.new = remaining;
    return alloc;
  }
  if (
    normalized.some(
      (it) =>
        it.type === "accessory" && !isGiftAccessory(it) && !isCardCopyItem(it),
    )
  ) {
    alloc.acc = G;
    return alloc;
  }
  if (normalized.some((it) => isCardCopyItem(it) && !isGiftAccessory(it))) {
    alloc.card = G;
    return alloc;
  }
  if (normalized.some((it) => it.type === "repair")) {
    alloc.repair = G;
    return alloc;
  }
  return alloc;
}
function copyPure(normalized, kind) {
  const giftAlloc = calcGiftAllocation(normalized);
  if (kind === "used") {
    const usedProfit = normalized
      .filter((it) => it.type === "phone" || it.type === "peer_phone")
      .reduce((s, it) => s + calcCopyProfit(it), 0);
    return usedProfit - giftAlloc.used;
  }
  if (kind === "new") {
    const newProfit = normalized
      .filter((it) => it.type === "new_phone")
      .reduce((s, it) => s + calcCopyProfit(it), 0);
    return newProfit - giftAlloc.new;
  }
  if (kind === "acc") {
    const nonGiftAcc = normalized.filter(
      (it) => it.type === "accessory" && !isGiftAccessory(it),
    );
    return (
      nonGiftAcc.reduce((s, it) => s + calcCopyProfit(it), 0) - giftAlloc.acc
    );
  }
  if (kind === "repair") {
    const repairProfit = normalized
      .filter((it) => it.type === "repair")
      .reduce((s, it) => s + calcCopyProfit(it), 0);
    return repairProfit - giftAlloc.repair;
  }
  return 0;
}

const gift = {
  type: "accessory",
  itemName: "測試線 (贈)",
  salePrice: 0,
  cost: 200,
  profit: -200,
};
const usedPhone = {
  type: "phone",
  itemName: "(二) iPhone 13",
  salePrice: 8000,
  cost: 6000,
  profit: 2000,
};
const newPhone = {
  type: "new_phone",
  itemName: "(新) iPhone 16",
  salePrice: 25000,
  cost: 22000,
  profit: 3000,
};
const paidAcc = {
  type: "accessory",
  itemName: "充電頭",
  salePrice: 300,
  cost: 120,
  profit: 180,
};
const repair = {
  type: "repair",
  itemName: "換螢幕",
  salePrice: 2000,
  cost: 800,
  profit: 1200,
};

assert(
  JSON.stringify(calcGiftAllocation([usedPhone, gift])) ===
    JSON.stringify({ used: 200, new: 0, repair: 0, acc: 0, card: 0 }),
  "gift on used only",
);
assert(copyPure([usedPhone, gift], "used") === 1800, "used copy pure");
assert(copyPure([usedPhone, gift], "acc") === 0, "acc copy no gift when used");

assert(
  JSON.stringify(calcGiftAllocation([usedPhone, newPhone, gift])) ===
    JSON.stringify({ used: 200, new: 0, repair: 0, acc: 0, card: 0 }),
  "gift fits in used first",
);
const bigGift = { ...gift, cost: 3500, profit: -3500 };
assert(
  JSON.stringify(calcGiftAllocation([usedPhone, newPhone, bigGift])) ===
    JSON.stringify({ used: 2000, new: 1500, repair: 0, acc: 0, card: 0 }),
  "gift overflow to new",
);
assert(copyPure([usedPhone, newPhone, bigGift], "used") === 0, "used drained");
assert(copyPure([usedPhone, newPhone, bigGift], "new") === 1500, "new gets remainder");

assert(
  JSON.stringify(calcGiftAllocation([paidAcc, gift])) ===
    JSON.stringify({ used: 0, new: 0, repair: 0, acc: 200, card: 0 }),
  "gift on acc when no phones",
);
assert(copyPure([paidAcc, gift], "acc") === -20, "acc bears gift");

assert(
  JSON.stringify(calcGiftAllocation([repair, gift])) ===
    JSON.stringify({ used: 0, new: 0, repair: 200, acc: 0, card: 0 }),
  "gift on repair fallback",
);
assert(copyPure([repair, gift], "repair") === 1000, "repair copy pure");

assert(
  JSON.stringify(calcGiftAllocation([usedPhone, repair, gift])) ===
    JSON.stringify({ used: 200, new: 0, repair: 0, acc: 0, card: 0 }),
  "repair does not share gift when used exists",
);
assert(copyPure([usedPhone, repair, gift], "repair") === 1200, "repair full when used bears gift");

console.log("ledger-and-gift.mjs: all assertions passed.");
