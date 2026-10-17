import type {
  DurationUnit,
  LocalDate,
  PaymentStatus,
  SubscriptionLifecycleStatus,
} from "@/types";

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const EXPIRING_SOON_DAYS = 3;
const PAYMENT_EPSILON = 0.000001;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseLocalDate(value: string): LocalDate {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) throw new RangeError(`Invalid local date: ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`Invalid local date: ${value}`);
  }

  return value;
}

export function getLocalDate(date = new Date()): LocalDate {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateParts(value: LocalDate): [number, number, number] {
  const [year, month, day] = parseLocalDate(value).split("-").map(Number);
  return [year, month, day];
}

function formatParts(year: number, month: number, day: number): LocalDate {
  return parseLocalDate(
    `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
  );
}

function toOrdinal(value: LocalDate): number {
  const [year, month, day] = dateParts(value);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return Math.floor(date.getTime() / 86_400_000);
}

export function addDuration(
  startDate: LocalDate,
  durationValue: number,
  durationUnit: DurationUnit,
): LocalDate {
  if (!Number.isInteger(durationValue) || durationValue <= 0) {
    throw new RangeError("Duration must be a positive whole number.");
  }

  const [year, month, day] = dateParts(startDate);
  if (durationUnit === "month") {
    const targetMonthIndex = year * 12 + month - 1 + durationValue;
    const targetYear = Math.floor(targetMonthIndex / 12);
    const targetMonth = (targetMonthIndex % 12) + 1;
    return formatParts(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
  }

  const daysToAdd = durationUnit === "week" ? durationValue * 7 : durationValue;
  const ordinal = toOrdinal(startDate) + daysToAdd;
  const date = new Date(ordinal * 86_400_000);
  return formatParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function calculateExpirationDate(
  startDate: LocalDate,
  durationValue: number,
  durationUnit: DurationUnit,
): LocalDate {
  return addDuration(startDate, durationValue, durationUnit);
}

export function getSubscriptionLifecycleStatus(
  expirationDate: LocalDate,
  cancelledAt: string | null,
  asOfDate: LocalDate = getLocalDate(),
): SubscriptionLifecycleStatus {
  if (cancelledAt !== null) return "cancelled";

  const todayOrdinal = toOrdinal(asOfDate);
  const expirationOrdinal = toOrdinal(expirationDate);
  const daysUntilExpiration = expirationOrdinal - todayOrdinal;

  if (daysUntilExpiration <= 0) return "expired";
  if (daysUntilExpiration <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

export function getPaymentStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountPaid + PAYMENT_EPSILON >= amountDue) return "paid";
  if (amountPaid <= PAYMENT_EPSILON) return "unpaid";
  return "partially_paid";
}

export function getRemainingPaymentAmount(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid);
}

export function formatDateLocal(value: LocalDate, locale?: string): string {
  const [year, month, day] = dateParts(value);
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formats an amount in Malagasy ariary: dot thousands separator, comma decimals (only when
 * present), and the "Ar" suffix. Manual formatting avoids depending on locale data in Hermes.
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded < 0 ? "-" : "";
  const [integerPart, fractionPart = "00"] = Math.abs(rounded).toFixed(2).split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const trimmedFraction = fractionPart.replace(/0+$/, "");
  const decimals = trimmedFraction ? `,${trimmedFraction}` : "";
  return `${sign}${grouped}${decimals} Ar`;
}
