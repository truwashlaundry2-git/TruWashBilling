import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fulfillmentLabel } from "../src/lib/defaults.js";
import { formatPhone, inr, padToken, rupeesInWords } from "../src/lib/format.js";
import { deliveryLabel, rs } from "./message.js";

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function handoff(bill) {
  if (bill.fulfillment) return fulfillmentLabel(bill.fulfillment);
  if (bill.pickupDelivery) return "Door pickup and delivery";
  return "";
}

export function invoiceHtml(bill, shop) {
  const lines = bill.lines || [];
  const rows = lines.map((line, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${esc(line.item)}<small> / ${esc(line.unit || "pc")}</small></td>
      <td>${esc(line.service || "")}</td>
      <td class="num">${esc(line.qty)}</td>
      <td class="num">${esc(inr(line.rate))}</td>
      <td class="num">${esc(inr(line.amount))}</td>
    </tr>`).join("");
  const paid = (bill.payments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const balance = Math.max(0, Math.round(((Number(bill.total) || 0) - paid) * 100) / 100);
  const payments = (bill.payments || []).map((payment) => `<li>${esc(payment.mode)} · ${esc(inr(payment.amount))}</li>`).join("");
  const drop = handoff(bill);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  :root { --navy:#0c2265; --ink:#12233f; --muted:#5d6d86; --line:#e3ebf5; --gold:#e6b95c; --green:#047857; --red:#9f1239; }
  * { box-sizing: border-box; }
  @page { size: A4; margin: 12mm; }
  body { margin: 0; color: var(--ink); font-family: "Segoe UI", sans-serif; font-size: 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  p { margin: 0; }
  .row { display: flex; justify-content: space-between; gap: 16px; }
  header.row { align-items: flex-start; border-bottom: 4px solid var(--navy); padding-bottom: 12px; }
  .name { font-weight: 800; font-style: italic; font-size: 40px; letter-spacing: -0.04em; line-height: 0.95; color: var(--navy); }
  .name span { color: #2f6fed; }
  .pill { display: inline-block; margin-top: 8px; padding: 4px 8px; border-radius: 999px; background: linear-gradient(#f6d98a, var(--gold)); color: var(--navy); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .slogan { margin-top: 8px; color: var(--navy); font-weight: 700; font-size: 13px; }
  .title { display: grid; justify-items: end; gap: 8px; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; font-weight: 800; color: var(--muted); }
  .token { width: 84px; height: 84px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(#f6d98a, var(--gold)); color: var(--navy); }
  .token small { font-size: 10px; letter-spacing: 0.14em; }
  .token strong { font-size: 30px; line-height: 1; }
  .shop, .meta, .customer { margin-top: 14px; }
  .shop p, .customer p { color: var(--muted); }
  .shop > div:last-child { text-align: right; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .meta div, .customer { background: #f6f8fc; border-radius: 12px; padding: 10px 12px; }
  .meta span, .customer span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: white; background: var(--navy); padding: 8px; }
  td { padding: 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  td small { display: block; color: var(--muted); }
  .num { text-align: right; }
  .bottom { align-items: flex-start; margin-top: 14px; }
  .words { font-weight: 700; text-transform: capitalize; }
  ul { list-style: none; margin: 10px 0 0; padding: 0; color: var(--muted); }
  .flag { display: inline-block; margin-top: 8px; padding: 4px 8px; border-radius: 999px; background: #fff6dc; color: #8a5a00; font-weight: 800; font-size: 12px; }
  .totals { min-width: 240px; display: grid; gap: 6px; }
  .totals div { display: flex; justify-content: space-between; gap: 12px; }
  .totals span { color: var(--muted); font-size: 13px; }
  .grand { font-size: 18px; }
  .due b { color: var(--red); }
  .settled b { color: var(--green); }
  .terms { margin-top: 16px; color: var(--muted); font-size: 12px; line-height: 1.45; }
  .sign { margin-top: 36px; }
  .sign div { width: 200px; border-top: 1px solid var(--ink); padding-top: 6px; font-size: 12px; color: var(--muted); }
  footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 18px; padding-top: 10px; border-top: 3px solid var(--gold); color: var(--navy); }
  footer span { text-align: right; }
</style></head><body>
<article>
  <header class="row">
    <div>
      <div class="name"><span>Tru</span>Wash</div>
      <div class="pill">${esc(shop.tagline || "Laundry & Dry Cleaning")}</div>
      <p class="slogan">${esc(shop.slogan || "Freshness You Can Trust...")}</p>
    </div>
    <div class="title">
      <span>${shop.gstin || bill.tax > 0 ? "Tax invoice" : "Bill"}</span>
      <div class="token"><small>TOKEN</small><strong>${esc(padToken(bill.token))}</strong></div>
    </div>
  </header>
  <div class="shop row">
    <div><b>${esc(shop.legalName || "TruWash Laundry")}</b><p>${esc(shop.address || "")}</p></div>
    <div><p>Phone ${esc(formatPhone(shop.phone))}</p>${shop.gstin ? `<p>GSTIN ${esc(shop.gstin)}</p>` : ""}</div>
  </div>
  <div class="meta">
    <div><span>Bill no.</span><b>${esc(bill.number || "")}</b></div>
    <div><span>Date</span><b>${esc(deliveryLabel(bill.createdAt))}</b></div>
    <div><span>Ready by</span><b>${esc(deliveryLabel(bill.deliveryDate))}${bill.deliverySlot ? ` · ${esc(bill.deliverySlot)}` : ""}</b></div>
    <div><span>Status</span><b>${esc(bill.status || "Received")}</b></div>
  </div>
  <div class="customer">
    <span>Customer</span>
    <b>${esc(bill.customer?.name || "")}</b>
    <p>${esc(bill.customer?.phone ? formatPhone(bill.customer.phone) : "Phone not given")}${bill.customer?.address ? ` · ${esc(bill.customer.address)}` : ""}</p>
  </div>
  <table>
    <thead><tr><th>#</th><th>Particular</th><th>Service</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="bottom row">
    <div>
      <p class="words">${esc(rupeesInWords(bill.total))}</p>
      ${payments ? `<ul>${payments}</ul>` : `<p class="terms">No payment received yet.</p>`}
      ${drop ? `<p class="flag">${esc(drop)}</p>` : ""}
    </div>
    <div class="totals">
      <div><span>Subtotal</span><b>${esc(inr(bill.subtotal))}</b></div>
      ${Number(bill.discount) > 0 ? `<div><span>Discount</span><b>− ${esc(inr(bill.discount))}</b></div>` : ""}
      ${Number(bill.tax) > 0 ? `<div><span>CGST</span><b>${esc(inr(bill.cgst))}</b></div><div><span>SGST</span><b>${esc(inr(bill.sgst))}</b></div>` : ""}
      <div class="grand"><span>Total</span><b>${esc(rs(bill.total))}</b></div>
      <div><span>Received</span><b>${esc(inr(paid))}</b></div>
      <div class="${balance > 0 ? "due" : "settled"}"><span>${balance > 0 ? "Balance due" : "Balance"}</span><b>${esc(inr(balance))}</b></div>
    </div>
  </div>
  ${shop.terms ? `<p class="terms">${esc(shop.terms)}</p>` : ""}
  <div class="sign row"><div>Customer</div><div>For ${esc(shop.legalName || "TruWash Laundry")}</div></div>
  <footer><strong>Thank you for choosing us!<br />${esc(shop.motto || "Clean | Fresh | Trusted")}</strong><span>${esc(shop.slogan || "Freshness You Can Trust...")}</span></footer>
</article></body></html>`;
}

export async function renderInvoicePdf(bill, shop) {
  const dir = await mkdtemp(path.join(tmpdir(), "truwash-invoice-"));
  const htmlPath = path.join(dir, "invoice.html");
  const pdfPath = path.join(dir, "invoice.pdf");
  try {
    await writeFile(htmlPath, invoiceHtml(bill, shop));
    await new Promise((resolve, reject) => {
      const child = spawn(CHROME, [
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        `--print-to-pdf=${pdfPath}`,
        htmlPath,
      ], { stdio: "ignore" });
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("The invoice PDF took too long to build."));
      }, 20000);
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("exit", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error("Could not build the invoice PDF."));
      });
    });
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
