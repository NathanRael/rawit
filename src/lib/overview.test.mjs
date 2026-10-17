import assert from "node:assert/strict";
import test from "node:test";

import { summarizeOverview } from "./overview.ts";

function period(id, lifecycleStatus, paymentStatus, amount, amountPaid, expirationDate) {
  return {
    id,
    subscriberId: `subscriber-${id}`,
    wifiNetworkId: `network-${id}`,
    startDate: "2026-10-01",
    durationValue: 1,
    durationUnit: "month",
    amount,
    cancelledAt: lifecycleStatus === "cancelled" ? "2026-10-02T00:00:00.000Z" : null,
    notes: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    expirationDate,
    lifecycleStatus,
    amountPaid,
    paymentCount: amountPaid > 0 ? 1 : 0,
    paymentStatus,
    subscriberName: `Subscriber ${id}`,
    wifiNetworkName: `Network ${id}`,
  };
}

test("overview totals balances and counts date-based lifecycle independently", () => {
  const summary = summarizeOverview([
    period("active-paid", "active", "paid", 100, 100, "2026-11-30"),
    period("active-unpaid", "active", "unpaid", 50, 0, "2026-11-01"),
    period("soon-partial", "expiring_soon", "partially_paid", 80, 30, "2026-10-19"),
    period("expired-paid", "expired", "paid", 30, 30, "2026-10-12"),
    period("expired-unpaid", "expired", "unpaid", 25, 0, "2026-10-10"),
    period("cancelled-unpaid", "cancelled", "unpaid", 10, 0, "2026-10-08"),
  ]);

  assert.equal(summary.activeCount, 2);
  assert.equal(summary.expiringSoonCount, 1);
  assert.equal(summary.expiredCount, 2);
  assert.equal(summary.unpaidPeriodCount, 4);
  assert.equal(summary.totalUnpaid, 135);
  assert.deepEqual(
    summary.attentionPeriods.map(({ id }) => id),
    ["cancelled-unpaid", "expired-unpaid", "expired-paid", "soon-partial", "active-unpaid"],
  );
});

test("overview returns zero balances and no attention items for paid active periods", () => {
  const summary = summarizeOverview([
    period("current", "active", "paid", 25, 25, "2026-11-30"),
  ]);

  assert.equal(summary.totalUnpaid, 0);
  assert.equal(summary.unpaidPeriodCount, 0);
  assert.deepEqual(summary.attentionPeriods, []);
});
