import { useEffect, useRef, useState } from "react";
import { defaultShop } from "../lib/defaults";
import { download, toInputDate } from "../lib/format";
import { useStore } from "../lib/store";
import { Field } from "../components/ui";

export default function Settings({ onNotify }) {
  const { shop, rates, bills, saveShop, replaceAll, resetAll } = useStore();
  const fileRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [whatsapp, setWhatsapp] = useState({ status: "starting", qr: null, error: "" });

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const response = await fetch("/api/whatsapp/status");
        const data = await response.json();
        if (!stop) setWhatsapp(data);
      } catch {
        if (!stop) setWhatsapp({ status: "offline", qr: null, error: "WhatsApp service is not running." });
      }
    }
    tick();
    const timer = setInterval(tick, 2000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);

  function exportBackup() {
    const payload = {
      app: "truwash-billing",
      version: 1,
      exportedAt: new Date().toISOString(),
      shop,
      rates,
      bills,
    };
    download(`truwash-backup-${toInputDate(new Date())}.json`, JSON.stringify(payload, null, 2));
    onNotify("Backup downloaded.");
  }

  function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ""));
        if (!data || data.app !== "truwash-billing" || !Array.isArray(data.bills) || !Array.isArray(data.rates)) {
          onNotify("That file is not a TruWash backup.");
          return;
        }
        if (!window.confirm("Replace bills, rates, and shop settings on this browser with the backup?")) return;
        replaceAll(data);
        onNotify("Backup restored.");
      } catch {
        onNotify("Could not read that file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="page settings">
      <section className="card form-grid">
        <h3>WhatsApp</h3>
        <p>
          {whatsapp.status === "ready"
            ? "WhatsApp is linked. Send on WhatsApp delivers the invoice PDF and the bill text from this account."
            : "On your phone, open WhatsApp, then Linked devices, then Link a device, and scan this QR. You only do this once."}
        </p>
        {whatsapp.qr ? <img className="wa-qr" alt="WhatsApp link QR code" src={whatsapp.qr} /> : null}
        {whatsapp.error ? <p className="form-error">{whatsapp.error}</p> : null}
        {whatsapp.status === "starting" ? <p className="muted">Waiting for the QR code...</p> : null}
        {whatsapp.status === "ready" ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={async () => {
              await fetch("/api/whatsapp/logout", { method: "POST" });
            }}
          >
            Unlink WhatsApp
          </button>
        ) : null}
        <Field label="WhatsApp tagline">
          <input value={shop.whatsappTagline || ""} onChange={(event) => saveShop({ whatsappTagline: event.target.value })} />
        </Field>
        <Field label="Shop hours">
          <input value={shop.hours || ""} onChange={(event) => saveShop({ hours: event.target.value })} />
        </Field>
        <Field label="Google review link">
          <input value={shop.reviewLink || ""} placeholder="https://g.page/..." onChange={(event) => saveShop({ reviewLink: event.target.value })} />
        </Field>
      </section>

      <section className="card form-grid">
        <h3>Shop</h3>
        <Field label="Display name">
          <input value={shop.name} onChange={(event) => saveShop({ name: event.target.value })} />
        </Field>
        <Field label="Legal name on the bill">
          <input value={shop.legalName} onChange={(event) => saveShop({ legalName: event.target.value })} />
        </Field>
        <Field label="Tagline">
          <input value={shop.tagline} onChange={(event) => saveShop({ tagline: event.target.value })} />
        </Field>
        <Field label="Slogan">
          <input value={shop.slogan} onChange={(event) => saveShop({ slogan: event.target.value })} />
        </Field>
        <Field label="Phone">
          <input value={shop.phone} onChange={(event) => saveShop({ phone: event.target.value })} />
        </Field>
        <Field label="Motto">
          <input value={shop.motto} onChange={(event) => saveShop({ motto: event.target.value })} />
        </Field>
        <Field label="Address">
          <textarea rows={3} value={shop.address} onChange={(event) => saveShop({ address: event.target.value })} />
        </Field>
      </section>

      <section className="card form-grid">
        <h3>Billing</h3>
        <Field label="Bill prefix">
          <input
            value={shop.billPrefix}
            maxLength={6}
            onChange={(event) => saveShop({ billPrefix: event.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="GST % (0 hides tax)">
          <input
            inputMode="decimal"
            value={shop.gstPercent}
            onChange={(event) => saveShop({ gstPercent: Math.min(28, Math.max(0, Number(event.target.value) || 0)) })}
          />
        </Field>
        <Field label="GSTIN">
          <input value={shop.gstin} onChange={(event) => saveShop({ gstin: event.target.value.toUpperCase() })} />
        </Field>
        <div className="format-pick">
          <span>Print format</span>
          <div>
            <button type="button" className={shop.printFormat === "a4" ? "btn btn-navy btn-sm" : "btn btn-ghost btn-sm"} onClick={() => saveShop({ printFormat: "a4" })}>
              A4 bill
            </button>
            <button type="button" className={shop.printFormat === "thermal" ? "btn btn-navy btn-sm" : "btn btn-ghost btn-sm"} onClick={() => saveShop({ printFormat: "thermal" })}>
              Thermal 80mm
            </button>
          </div>
        </div>
        <Field label="Terms printed on the bill">
          <textarea rows={4} value={shop.terms} onChange={(event) => saveShop({ terms: event.target.value })} />
        </Field>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            const fresh = defaultShop();
            saveShop({
              name: fresh.name,
              legalName: fresh.legalName,
              tagline: fresh.tagline,
              slogan: fresh.slogan,
              phone: fresh.phone,
              address: fresh.address,
              motto: fresh.motto,
              terms: fresh.terms,
            });
          }}
        >
          Reset shop text to TruWash banner
        </button>
      </section>

      <section className="card">
        <h3>Backup</h3>
        <p>Bills, customers, and rates stay in this browser. Export a backup before clearing the browser or moving computers.</p>
        <div className="row-actions">
          <button className="btn btn-gold" type="button" onClick={exportBackup}>
            Download backup
          </button>
          <button className="btn btn-navy" type="button" onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
          <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={onFile} />
        </div>
      </section>

      <section className="card danger-zone">
        <h3>Erase this browser</h3>
        <p>Deletes every bill and puts the TruWash rate card and shop details back. A downloaded backup is the only copy.</p>
        {armed ? (
          <div className="row-actions">
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                resetAll();
                setArmed(false);
                onNotify("All bills erased.");
              }}
            >
              Erase everything
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setArmed(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-danger" type="button" onClick={() => setArmed(true)}>
            Erase all data
          </button>
        )}
      </section>
    </div>
  );
}
