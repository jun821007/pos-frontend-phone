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
console.log("ledger-and-gift.mjs: all assertions passed.");
