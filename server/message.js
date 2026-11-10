const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function asDate(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function deliveryLabel(value) {
  const date = asDate(value);
  if (!date) return "—";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function rs(amount) {
  const value = Number(amount) || 0;
  const hasPaise = Math.round(Math.abs(value) * 100) % 100 !== 0;
  const text = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `Rs. ${text}`;
}

export function customerPhone(bill) {
  let digits = String(bill.customer?.phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function whatsappCaption(bill, shop) {
  const name = bill.customer?.name?.trim() || "there";
  const shopName = shop.legalName || "TruWash Laundry";
  const number = String(bill.number || "").replace(/^#/, "");
  const items = (bill.lines || []).map((line) => `${line.item} - ${rs(line.amount)}`);
  const phone = String(shop.phone || "").replace(/\D/g, "");
  const hours = shop.hours || "9 AM - 9 PM";
  const tagline = shop.whatsappTagline || "TruWash - Wash - Repeat";
  const lines = [
    `Hi ${name},`,
    "",
    `Invoice from ${shopName} is attached.`,
    "",
    `Bill No: #${number}`,
    `Delivery: ${deliveryLabel(bill.deliveryDate)}`,
    "",
    "Items:",
    ...items,
    "",
    `Total: ${rs(bill.total)}`,
    "",
    "Thank you for choosing us!",
    tagline,
    phone ? `Call: ${phone} | ${hours}` : hours,
  ];
  const review = String(shop.reviewLink || "").trim();
  if (review) {
    lines.push("", "Leave us a Google Review:", review);
  }
  return lines.join("\n");
}

export function invoiceFileName(bill) {
  const number = String(bill.number || "bill").replace(/[^\w.-]+/g, "-");
  return `TruWash-Invoice-${number}.pdf`;
}
