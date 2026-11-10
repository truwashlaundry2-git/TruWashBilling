const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

export function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

export function inr(n) {
  const v = Number(n) || 0;
  const hasPaise = Math.round(Math.abs(v) * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(v);
}

export function qtyText(n) {
  const v = money(n);
  if (Number.isInteger(v)) return String(v);
  return String(v);
}

export function toInputDate(value = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toInputDate(d);
}

function asDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(value);
}

export function formatDate(value) {
  if (!value) return "—";
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function cleanPhone(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (!/^[\d\s+\-()]+$/.test(trimmed)) return trimmed;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function formatPhone(value) {
  const d = String(value || "").replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return value || "—";
}

export function padToken(n) {
  const v = Number(n) || 0;
  return v < 100 ? String(v).padStart(2, "0") : String(v);
}

export function calcBill({ lines = [], discount = 0, gstPercent = 0 }) {
  const subtotal = money(lines.reduce((sum, line) => sum + money((Number(line.qty) || 0) * (Number(line.rate) || 0)), 0));
  const disc = Math.min(subtotal, Math.max(0, money(discount)));
  const taxable = money(subtotal - disc);
  const tax = money((taxable * (Number(gstPercent) || 0)) / 100);
  const cgst = money(tax / 2);
  const sgst = money(tax - cgst);
  const total = money(taxable + tax);
  return { subtotal, discount: disc, taxable, tax, cgst, sgst, total };
}

export function paidOf(bill) {
  return money((bill?.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
}

export function billBalance(bill) {
  return money(Math.max(0, (bill?.total || 0) - paidOf(bill)));
}

export function changeDue(bill) {
  return money(Math.max(0, paidOf(bill) - (bill?.total || 0)));
}

export function paymentKind(bill) {
  const paid = paidOf(bill);
  if (paid <= 0) return "unpaid";
  if (paid + 0.001 >= (bill?.total || 0)) return "paid";
  return "partial";
}

export function paymentLabel(kind) {
  if (kind === "paid") return "Paid";
  if (kind === "partial") return "Partial";
  return "Unpaid";
}

export function isOverdue(bill, today = toInputDate(new Date())) {
  if (!bill?.deliveryDate || bill.status === "Delivered") return false;
  return bill.deliveryDate < today;
}

export function isDueToday(bill, today = toInputDate(new Date())) {
  return Boolean(bill?.deliveryDate) && bill.deliveryDate === today && bill.status !== "Delivered";
}

export function pieceCount(bill) {
  return money((bill?.lines || []).reduce((sum, line) => sum + Number(line.qty || 0), 0));
}

export function nextBillNo(bills, prefix = "TW") {
  let max = 1000;
  for (const bill of bills) {
    const match = String(bill.number || "").match(/(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  const safe = String(prefix || "TW").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "TW";
  return `${safe}-${String(max + 1).padStart(4, "0")}`;
}

export function nextToken(bills, date = new Date()) {
  const day = toInputDate(date);
  const count = bills.filter((bill) => (bill.tokenDate || toInputDate(bill.createdAt)) === day).length;
  return count + 1;
}

function two(n) {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return TENS[ten] + (one ? `-${ONES[one]}` : "");
}

function under1000(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const bits = [];
  if (hundred) bits.push(`${ONES[hundred]} hundred`);
  if (rest) bits.push(two(rest));
  return bits.join(" ");
}

export function rupeesInWords(amount) {
  const abs = Math.abs(Number(amount) || 0);
  let rupees = Math.floor(abs + 1e-6);
  const paise = Math.round((abs - rupees) * 100);
  if (rupees === 0 && paise === 0) return "Rupees zero only";
  const parts = [];
  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  if (crore) parts.push(`${under1000(crore)} crore`);
  if (lakh) parts.push(`${under1000(lakh)} lakh`);
  if (thousand) parts.push(`${under1000(thousand)} thousand`);
  if (rupees) parts.push(under1000(rupees));
  let text = parts.join(" ").replace(/\s+/g, " ").trim() || "zero";
  let out = `Rupees ${text}`;
  if (paise) out += ` and ${two(paise)} paise`;
  return `${out} only`;
}

export function getCustomers(bills) {
  const map = new Map();
  const ordered = [...bills].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  for (const bill of ordered) {
    const phone = (bill.customer?.phone || "").trim();
    const name = (bill.customer?.name || "").trim();
    const key = phone || name.toLowerCase();
    if (!key) continue;
    const prev = map.get(key) || {
      key,
      name,
      phone,
      address: "",
      bills: 0,
      total: 0,
      paid: 0,
      balance: 0,
      lastAt: bill.createdAt,
    };
    prev.name = name || prev.name;
    prev.phone = phone || prev.phone;
    prev.address = bill.customer?.address || prev.address;
    prev.bills += 1;
    prev.total = money(prev.total + (bill.total || 0));
    prev.paid = money(prev.paid + paidOf(bill));
    prev.balance = money(prev.balance + billBalance(bill));
    prev.lastAt = bill.createdAt;
    map.set(key, prev);
  }
  return [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

export function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function exportBillsCsv(bills) {
  const header = ["Bill No", "Token", "Date", "Customer", "Phone", "Status", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance", "Mode"];
  const rows = bills.map((bill) => {
    const modes = [...new Set((bill.payments || []).map((payment) => payment.mode))].join(" + ");
    return [
      bill.number,
      bill.token,
      formatDate(bill.createdAt),
      bill.customer?.name || "",
      bill.customer?.phone || "",
      bill.status,
      bill.subtotal,
      bill.discount,
      bill.tax,
      bill.total,
      paidOf(bill),
      billBalance(bill),
      modes,
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  download(`truwash-bills-${toInputDate(new Date())}.csv`, csv, "text/csv;charset=utf-8");
}

export async function sendWhatsApp(bill, shop) {
  let response;
  try {
    response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill, shop }),
    });
  } catch {
    throw new Error("WhatsApp service is not running. Start it with npm run server, then try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "WhatsApp could not send this bill.");
  return data;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return toInputDate(d);
}

export function startOfMonth(date = new Date()) {
  return toInputDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function inRange(value, from, to) {
  const day = toInputDate(value);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}
