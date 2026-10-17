import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateExpirationDate,
  getRemainingPaymentAmount,
  getPaymentStatus,
  getSubscriptionLifecycleStatus,
} from "./index.ts";

test("monthly durations clamp at the target month's last day", () => {
  assert.equal(calculateExpirationDate("2024-01-31", 1, "month"), "2024-02-29");
  assert.equal(calculateExpirationDate("2025-01-31", 1, "month"), "2025-02-28");
  assert.equal(calculateExpirationDate("2024-02-29", 12, "month"), "2025-02-28");
});

test("day and week durations advance by local calendar days", () => {
  assert.equal(calculateExpirationDate("2026-03-07", 1, "week"), "2026-03-14");
  assert.equal(calculateExpirationDate("2026-10-17", 3, "day"), "2026-10-20");
});

test("lifecycle treats today as expired and uses the three-day boundary", () => {
  assert.equal(
    getSubscriptionLifecycleStatus("2026-10-17", null, "2026-10-17"),
    "expired",
  );
  const nearFutureExpiration = calculateExpirationDate("2026-10-19", 1, "day");
  assert.equal(getSubscriptionLifecycleStatus(nearFutureExpiration, null, "2026-10-17"), "expiring_soon");
  const laterFutureExpiration = calculateExpirationDate("2026-10-19", 1, "week");
  assert.equal(getSubscriptionLifecycleStatus(laterFutureExpiration, null, "2026-10-17"), "active");
  assert.equal(
    getSubscriptionLifecycleStatus("2026-10-21", null, "2026-10-17"),
    "active",
  );
  assert.equal(
    getSubscriptionLifecycleStatus(
      "2026-10-20",
      "2026-10-16T12:00:00.000Z",
      "2026-10-17",
    ),
    "cancelled",
  );
});

test("payment state is independent and supports partial totals", () => {
  assert.equal(getPaymentStatus(50, 0), "unpaid");
  assert.equal(getPaymentStatus(50, 20), "partially_paid");
  assert.equal(getPaymentStatus(50, 50), "paid");
  assert.equal(getPaymentStatus(0, 0), "paid");
});

test("remaining payment amount never becomes negative", () => {
  assert.equal(getRemainingPaymentAmount(50, 0), 50);
  assert.equal(getRemainingPaymentAmount(50, 20), 30);
  assert.equal(getRemainingPaymentAmount(50, 50), 0);
  assert.equal(getRemainingPaymentAmount(50, 60), 0);
});
