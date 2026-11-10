import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { renderInvoicePdf } from "./invoicePdf.js";
import { customerPhone, invoiceFileName, whatsappCaption } from "./message.js";

const sessionDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "session");
const logger = pino({ level: "silent" });

let sock = null;
let status = "starting";
let qrDataUrl = null;
let lastError = "";
let connectPromise = null;

export function whatsAppStatus() {
  return { status, qr: status === "qr" ? qrDataUrl : null, error: lastError };
}

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const socket = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.macOS("Desktop"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });
  sock = socket;
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;
    if (qr) {
      try {
        qrDataUrl = await QRCode.toDataURL(qr);
        status = "qr";
        lastError = "";
      } catch (error) {
        lastError = error.message;
      }
    }
    if (connection === "open") {
      status = "ready";
      qrDataUrl = null;
      lastError = "";
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      sock = null;
      qrDataUrl = null;
      status = loggedOut ? "disconnected" : "starting";
      lastError = loggedOut ? "" : "WhatsApp disconnected. Reconnecting.";
      connectPromise = null;
      if (!loggedOut) setTimeout(() => startWhatsApp(), 1500);
    }
  });
}

export function startWhatsApp() {
  if (sock || connectPromise) return connectPromise;
  status = status === "ready" ? status : "starting";
  connectPromise = connect().catch((error) => {
    status = "disconnected";
    lastError = error.message || "WhatsApp could not start.";
    connectPromise = null;
  });
  return connectPromise;
}

export async function logoutWhatsApp() {
  const current = sock;
  sock = null;
  qrDataUrl = null;
  status = "disconnected";
  connectPromise = null;
  if (current) {
    try {
      await current.logout();
    } catch {
      /* session is cleared next */
    }
  }
  await rm(sessionDir, { recursive: true, force: true });
  startWhatsApp();
}

export async function sendBill(bill, shop) {
  if (!sock || status !== "ready") {
    throw fail("Link WhatsApp in Settings. Scan the QR once, then send again.", "NOT_LINKED");
  }
  const digits = customerPhone(bill);
  if (!/^\d{10}$/.test(digits)) {
    throw fail("The bill needs a 10-digit customer mobile number.", "BAD_PHONE");
  }
  const phone = `91${digits}`;
  const found = await sock.onWhatsApp(phone);
  const match = (found || []).find((item) => item.exists && item.jid);
  if (!match) {
    throw fail("That mobile number is not on WhatsApp.", "NOT_ON_WHATSAPP");
  }
  const pdf = await renderInvoicePdf(bill, shop || {});
  const fileName = invoiceFileName(bill);
  await sock.sendMessage(match.jid, {
    document: pdf,
    mimetype: "application/pdf",
    fileName,
    caption: whatsappCaption(bill, shop || {}),
  });
  return { ok: true, fileName, phone: digits };
}
