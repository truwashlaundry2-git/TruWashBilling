import express from "express";
import { logoutWhatsApp, sendBill, startWhatsApp, whatsAppStatus } from "./whatsapp.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/whatsapp/status", (_req, res) => {
  res.json(whatsAppStatus());
});

app.post("/api/whatsapp/logout", async (_req, res) => {
  await logoutWhatsApp();
  res.json(whatsAppStatus());
});

app.post("/api/whatsapp/send", async (req, res) => {
  try {
    const { bill, shop } = req.body || {};
    if (!bill || !shop) {
      res.status(400).json({ error: "Missing bill.", code: "BAD_REQUEST" });
      return;
    }
    const result = await sendBill(bill, shop);
    res.json(result);
  } catch (error) {
    const code = error.code || "SEND_FAILED";
    const status = code === "NOT_LINKED" || code === "BAD_PHONE" || code === "NOT_ON_WHATSAPP" ? 400 : 500;
    res.status(status).json({ error: error.message || "WhatsApp could not send this bill.", code });
  }
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, "127.0.0.1", () => {
  console.log(`TruWash WhatsApp listening on ${port}`);
  startWhatsApp();
});
