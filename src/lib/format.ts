import type { Order, StockByCompany } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

// Gate pass and dispatch dates are stored as UTC midnight, so format them in
// UTC to show the same calendar day everywhere. Pass local for timestamps.
export function formatDate(value: string, { local = false } = {}) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: local ? undefined : "UTC",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayInputValue() {
  return new Date().toLocaleDateString("en-CA");
}

export function daysSince(value: string) {
  return Math.max(0, Math.floor((Date.now() - Date.parse(value)) / DAY_MS));
}

export function isThisMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getFullYear() &&
    date.getUTCMonth() === now.getMonth()
  );
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function totalStock(stock: StockByCompany) {
  return sum(Object.values(stock).flatMap((byType) => Object.values(byType)));
}

export function plural(count: number, word: string) {
  if (count === 1) return `${count} ${word}`;
  if (/[^aeiou]y$/.test(word)) return `${count} ${word.slice(0, -1)}ies`;
  return `${count} ${word}${/(s|x|ch|sh)$/.test(word) ? "es" : "s"}`;
}

export type OrderStage = "open" | "partial" | "completed";

export function orderStage(order: Order): OrderStage {
  if (order.effectiveDue <= 0) return "completed";
  return order.totalDispatched > 0 ? "partial" : "open";
}

export const stageLabel: Record<OrderStage, string> = {
  open: "Open",
  partial: "Part dispatched",
  completed: "Completed",
};

type CsvValue = string | number | null | undefined;

export function downloadCsv(filename: string, header: string[], rows: CsvValue[][]) {
  const escape = (value: CsvValue) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return String(value);
    // Stop spreadsheet apps from treating text as a formula.
    const text = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  // The BOM makes Excel open the file as UTF-8.
  const url = URL.createObjectURL(
    new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
