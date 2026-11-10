import { useEffect, useState } from "react";
import Brand from "./components/Brand";
import Icon from "./components/Icons";
import Invoice from "./components/Invoice";
import { formatDate, formatPhone, formatTime, padToken } from "./lib/format";
import { useStore } from "./lib/store";
import BillView from "./pages/BillView";
import Billing from "./pages/Billing";
import Bills from "./pages/Bills";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import RateCard from "./pages/RateCard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const NAV = [
  ["dashboard", "Dashboard", "dashboard"],
  ["billing", "New bill", "plus"],
  ["bills", "Bills", "receipt"],
  ["customers", "Customers", "users"],
  ["rates", "Rate card", "tag"],
  ["reports", "Reports", "chart"],
  ["settings", "Settings", "gear"],
];

function readHash() {
  const raw = location.hash.replace(/^#/, "") || "dashboard";
  const [name, id] = raw.split("/");
  const allowed = new Set(["dashboard", "billing", "bills", "bill", "customers", "rates", "reports", "settings"]);
  if (!allowed.has(name)) return { name: "dashboard" };
  if (name === "bill") return { name, id };
  if (name === "billing") return { name, billId: id || null };
  return { name };
}

export default function App() {
  const { shop, bills, storageError, saveShop } = useStore();
  const [screen, setScreen] = useState(readHash);
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onHash = () => setScreen((current) => ({ ...readHash(), query: current.query, status: current.status, from: current.from, to: current.to }));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let hash = screen.name;
    if (screen.name === "billing" && screen.billId) hash = `billing/${screen.billId}`;
    if (screen.name === "bill" && screen.id) hash = `bill/${screen.id}`;
    if (location.hash !== `#${hash}`) location.hash = hash;
  }, [screen.name, screen.billId, screen.id]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(preview));
  }, [preview]);

  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  useEffect(() => {
    const onKey = (event) => {
      if (preview) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        setScreen({ name: "billing" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  function notify(message) {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 2600);
  }

  function go(next) {
    setScreen(typeof next === "string" ? { name: next } : next);
  }

  const navKey = screen.name === "bill" || (screen.name === "billing" && screen.billId) ? "bills" : screen.name;
  const titles = {
    dashboard: "Dashboard",
    billing: screen.billId ? "Edit bill" : "New bill",
    bills: "Bills",
    bill: "Bill",
    customers: "Customers",
    rates: "Rate card",
    reports: "Reports",
    settings: "Settings",
  };
  const previewBill = preview ? bills.find((bill) => bill.id === preview.id) || preview : null;

  return (
    <>
      <div className="app no-print">
        <aside className="sidebar">
          <Brand tone="dark" slogan={shop.slogan} />
          <nav className="nav">
            {NAV.map(([name, label, icon]) => (
              <button
                key={name}
                type="button"
                className={navKey === name ? "nav-btn active" : "nav-btn"}
                aria-current={navKey === name ? "page" : undefined}
                onClick={() => go(name)}
              >
                <Icon name={icon} />
                {label}
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <b>{formatPhone(shop.phone)}</b>
            <span>{shop.address}</span>
            <small>Saved in this browser. Take a backup from Settings.</small>
          </div>
        </aside>
        <div className="main">
          <header className="topbar">
            <div>
              <h1>{titles[screen.name] || "TruWash"}</h1>
              <p>
                {formatDate(now)} · {formatTime(now)}
              </p>
            </div>
            {screen.name !== "billing" ? (
              <button className="btn btn-gold" type="button" onClick={() => go("billing")}>
                New bill
              </button>
            ) : null}
          </header>
          {storageError ? (
            <div className="storage-error">This browser could not save the latest change. Export a backup from Settings.</div>
          ) : null}
          {screen.name === "dashboard" ? <Dashboard onNew={() => go("billing")} onOpen={go} /> : null}
          {screen.name === "billing" ? (
            <Billing
              key={screen.billId || screen.nonce || "new"}
              billId={screen.billId}
              prefill={screen.prefill}
              onSaved={(bill) => notify(`Saved ${bill.number} · Token ${padToken(bill.token)}`)}
              onPreview={setPreview}
              onCancel={() => go(screen.billId ? { name: "bill", id: screen.billId } : "dashboard")}
            />
          ) : null}
          {screen.name === "bills" ? (
            <Bills
              key={`${screen.query || ""}-${screen.status || ""}-${screen.from || ""}-${screen.to || ""}`}
              initialQuery={screen.query || ""}
              initialStatus={screen.status || "All"}
              initialFrom={screen.from || ""}
              initialTo={screen.to || ""}
              onOpen={(id) => go({ name: "bill", id })}
              onPreview={setPreview}
            />
          ) : null}
          {screen.name === "bill" ? (
            <BillView
              id={screen.id}
              onBack={() => go("bills")}
              onPreview={setPreview}
              onEdit={(bill) => go({ name: "billing", billId: bill.id })}
              onRepeat={(bill) =>
                go({
                  name: "billing",
                  nonce: crypto.randomUUID(),
                  prefill: {
                    customer: bill.customer,
                    lines: (bill.lines || []).map((line) => ({ ...line, id: crypto.randomUUID() })),
                    discount: bill.discount,
                    offerId: bill.offerId,
                    discountKind: bill.discountKind,
                    discountInput: bill.discountInput,
                    status: "Received",
                    deliveryDate: bill.deliveryDate,
                    deliverySlot: bill.deliverySlot,
                    fulfillment: bill.fulfillment,
                    payType: bill.payType,
                    payWhen: bill.payWhen,
                    pickupDelivery: bill.pickupDelivery,
                    notes: bill.notes,
                  },
                })
              }
            />
          ) : null}
          {screen.name === "customers" ? <Customers onSearch={(query) => go({ name: "bills", query })} /> : null}
          {screen.name === "rates" ? <RateCard onNotify={notify} /> : null}
          {screen.name === "reports" ? <Reports /> : null}
          {screen.name === "settings" ? <Settings onNotify={notify} /> : null}
        </div>
        {toast ? <div className="toast">{toast}</div> : null}
        {previewBill ? (
          <div className="modal-back" onClick={() => setPreview(null)}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-bar">
                <strong>Print preview</strong>
                <div className="row-actions">
                  <button className={shop.printFormat !== "thermal" ? "btn btn-navy btn-sm" : "btn btn-ghost btn-sm"} type="button" onClick={() => saveShop({ printFormat: "a4" })}>
                    A4
                  </button>
                  <button className={shop.printFormat === "thermal" ? "btn btn-navy btn-sm" : "btn btn-ghost btn-sm"} type="button" onClick={() => saveShop({ printFormat: "thermal" })}>
                    Thermal
                  </button>
                  <button className="btn btn-gold btn-sm" type="button" onClick={() => window.print()}>
                    Print
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPreview(null)}>
                    Close
                  </button>
                </div>
              </div>
              <div className="paper modal-paper">
                <Invoice bill={previewBill} shop={shop} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="print-root">
        {previewBill ? <Invoice bill={previewBill} shop={shop} /> : null}
        <style>{`@media print { @page { size: ${shop.printFormat === "thermal" ? "80mm auto" : "A4"}; margin: ${shop.printFormat === "thermal" ? "4mm" : "10mm"}; } }`}</style>
      </div>
    </>
  );
}
