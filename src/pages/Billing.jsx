import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_ORDER, SERVICE_ORDER, fulfillmentLabel } from "../lib/defaults";
import { calcBill, cleanPhone, formatDate, getCustomers, inr, money, paidOf, sendWhatsApp, tomorrow } from "../lib/format";
import { useStore } from "../lib/store";

const HOME_OPTIONS = [
  { id: "door-pickup", label: "Door pickup" },
  { id: "door-delivery", label: "Door delivery" },
  { id: "door-both", label: "Both" },
];
const SHOP_OPTIONS = [
  { id: "shop-pickup", label: "Shop pickup" },
  { id: "shop-delivery", label: "Shop delivery" },
  { id: "shop-both", label: "Both" },
];
const SLOTS = ["Morning", "Afternoon", "Evening"];
const PAY_TYPES = ["Cash", "UPI", "Online"];
const OFFERS = [
  { id: "none", label: "No offer", type: "none", value: 0 },
  { id: "p10", label: "10% off", type: "percent", value: 10 },
  { id: "f50", label: "₹50 off", type: "flat", value: 50 },
  { id: "f100", label: "₹100 off", type: "flat", value: 100 },
];

function ServiceGlyph({ service }) {
  const props = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  if (service === "Wash & Iron") {
    return <svg {...props}><path d="M6 8h12l-1 11H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M9 13h6" /></svg>;
  }
  if (service === "Dry Cleaning") {
    return <svg {...props}><path d="M8 4c2 3 2 5 0 8 3 0 5-2 6-4 1 4 2 7 5 9" /><path d="M7 20h10" /></svg>;
  }
  if (service === "Steam Iron") {
    return <svg {...props}><path d="M5 14h12a3 3 0 0 0 0-6H9" /><path d="M8 8V5" /><path d="M7 18c.6 1 1.4 1.5 2.4 1.5S11.2 19 11.8 18" /></svg>;
  }
  if (service === "Premium Laundry") {
    return <svg {...props}><path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3z" /><path d="M6 16l.8 2 2 .8-2 .8L6 22l-.8-2.2L3 19l2.2-.8L6 16z" /></svg>;
  }
  if (service === "Shoe Cleaning") {
    return <svg {...props}><path d="M4 15c2-1 3-4 4-4h3l2 2h5v3H6a3 3 0 0 1-2-1z" /><path d="M8 11V8" /></svg>;
  }
  return <svg {...props}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M4 10h16" /><path d="M8 14h3" /></svg>;
}

export default function Billing({ billId, prefill, onSaved, onPreview, onCancel }) {
  const { bills, rates, shop, saveBill } = useStore();
  const [savedId, setSavedId] = useState(billId || null);
  const savedRef = useRef(billId || null);
  const existing = bills.find((bill) => bill.id === savedId) || null;
  const seed = existing || prefill || null;

  const [customer, setCustomer] = useState(seed?.customer || { name: "", phone: "", address: "" });
  const [lines, setLines] = useState(seed?.lines || []);
  const [offerId, setOfferId] = useState(seed?.offerId || "none");
  const [discountKind, setDiscountKind] = useState(seed?.discountKind || "flat");
  const [discountInput, setDiscountInput] = useState(seed?.discountInput ?? (seed?.offerId ? "" : seed?.discount || ""));
  const [fulfillment, setFulfillment] = useState(seed?.fulfillment || (seed?.pickupDelivery ? "door-both" : "door-pickup"));
  const [deliveryDate, setDeliveryDate] = useState(seed?.deliveryDate || tomorrow());
  const [deliverySlot, setDeliverySlot] = useState(seed?.deliverySlot || "Morning");
  const [payType, setPayType] = useState(seed?.payType || seed?.payments?.[0]?.mode || "Cash");
  const [payWhen, setPayWhen] = useState(seed?.payWhen || (seed?.payments?.length ? "pre" : "pre"));
  const [notes, setNotes] = useState(seed?.notes || "");
  const [service, setService] = useState("Wash & Fold");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNote, setSentNote] = useState("");

  const customers = useMemo(() => getCustomers(bills), [bills]);
  const categories = useMemo(() => {
    const found = new Set(rates.filter((rate) => rate.service === service).map((rate) => rate.category || "All"));
    return CATEGORY_ORDER.filter((name) => found.has(name));
  }, [rates, service]);

  const subtotal = useMemo(() => calcBill({ lines, discount: 0, gstPercent: 0 }).subtotal, [lines]);
  const offer = OFFERS.find((item) => item.id === offerId) || OFFERS[0];
  const offerValue = offer.type === "percent" ? money((subtotal * offer.value) / 100) : offer.type === "flat" ? Math.min(subtotal, offer.value) : 0;
  const afterOffer = money(subtotal - offerValue);
  const manualDiscount = discountKind === "percent"
    ? money((afterOffer * (Number(discountInput) || 0)) / 100)
    : Math.min(afterOffer, money(discountInput));
  const totals = calcBill({ lines, discount: money(offerValue + manualDiscount), gstPercent: shop.gstPercent });

  const visibleRates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!category && !q) return [];
    return rates.filter((rate) => {
      if (rate.service !== service) return false;
      if (category && (rate.category || "All") !== category) return false;
      if (q && !rate.item.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rates, service, category, query]);

  function chooseService(next) {
    const found = new Set(rates.filter((rate) => rate.service === next).map((rate) => rate.category || "All"));
    const list = CATEGORY_ORDER.filter((name) => found.has(name));
    setService(next);
    setCategory(list.length === 1 ? list[0] : "");
    setQuery("");
  }

  const suggestions = useMemo(() => {
    const phone = customer.phone.replace(/\D/g, "");
    const name = customer.name.trim().toLowerCase();
    if (phone.length < 3 && name.length < 2) return [];
    return customers
      .filter((person) => (phone && person.phone.includes(phone)) || (name && person.name.toLowerCase().includes(name)))
      .slice(0, 5);
  }, [customer.name, customer.phone, customers]);

  function addRate(rate) {
    setLines((current) => {
      const index = current.findIndex((line) => line.rateId && line.rateId === rate.id);
      if (index >= 0) {
        const next = [...current];
        const qty = money(next[index].qty + 1);
        next[index] = { ...next[index], qty, amount: money(qty * next[index].rate) };
        return next;
      }
      return [...current, {
        id: crypto.randomUUID(),
        rateId: rate.id,
        service: rate.service,
        item: rate.item,
        unit: rate.unit || "pc",
        qty: 1,
        rate: rate.rate,
        amount: money(rate.rate),
      }];
    });
    setError("");
  }

  function updateLine(id, patch) {
    setLines((current) => current.flatMap((line) => {
      if (line.id !== id) return [line];
      if (patch.qty === "") return [{ ...line, qty: "" }];
      const qty = patch.qty === undefined ? line.qty : money(patch.qty);
      if (patch.qty !== undefined && qty <= 0) return [];
      const rate = patch.rate === undefined ? line.rate : money(patch.rate);
      return [{ ...line, ...patch, qty, rate, amount: money(qty * rate) }];
    }));
  }

  function persist() {
    const name = customer.name.trim();
    const phone = cleanPhone(customer.phone);
    if (!name) {
      setError("Enter the customer name.");
      return null;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a 10-digit mobile number.");
      return null;
    }
    if (!lines.length || lines.some((line) => money(line.qty) <= 0)) {
      setError("Add at least one item with a quantity.");
      return null;
    }
    const door = fulfillment.startsWith("door");
    if (door && !customer.address.trim()) {
      setError("Enter the address for door pickup or delivery.");
      return null;
    }
    const now = new Date().toISOString();
    const previous = bills.find((bill) => bill.id === savedRef.current);
    let payments = previous ? [...(previous.payments || [])] : [];
    if (payWhen === "pre") {
      const due = money(totals.total - paidOf({ payments }));
      if (due > 0) payments.push({ id: crypto.randomUUID(), amount: due, mode: payType, at: now });
    }
    const bill = saveBill({
      id: savedRef.current || undefined,
      customer: { name, phone, address: customer.address.trim() },
      lines: lines.map((line) => ({ ...line, qty: money(line.qty), rate: money(line.rate), amount: money(line.qty * line.rate) })),
      ...totals,
      offerId,
      offerLabel: offer.label,
      discountKind,
      discountInput: discountInput === "" ? 0 : discountInput,
      gstPercent: Number(shop.gstPercent) || 0,
      payments,
      status: previous?.status || "Received",
      statusLog: previous?.statusLog || [{ status: "Received", at: now }],
      deliveryDate,
      deliverySlot,
      fulfillment,
      payType,
      payWhen,
      pickupDelivery: door,
      notes: notes.trim(),
    });
    savedRef.current = bill.id;
    setSavedId(bill.id);
    setError("");
    onSaved(bill);
    return bill;
  }

  function clearBill() {
    savedRef.current = null;
    setSavedId(null);
    setCustomer({ name: "", phone: "", address: "" });
    setLines([]);
    setOfferId("none");
    setDiscountKind("flat");
    setDiscountInput("");
    setNotes("");
    setFulfillment("door-pickup");
    setPayType("Cash");
    setPayWhen("pre");
    setDeliverySlot("Morning");
    setDeliveryDate(tomorrow());
    setError("");
  }

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persist();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const savedBill = bills.find((bill) => bill.id === savedId);

  return (
    <form
      className="page billing"
      onSubmit={(event) => {
        event.preventDefault();
        persist();
      }}
    >
      <div className="counter">
        <div className="counter-left">
          <section className="panel">
            <header className="panel-head">
              <span>Customer details</span>
            </header>
            <div className="panel-body">
              <div className="pair">
                <label className="field">
                  <span>Customer name *</span>
                  <input
                    value={customer.name}
                    placeholder="Enter customer name"
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 160)}
                    onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                  />
                </label>
                <div className="suggest-wrap">
                  <label className="field">
                    <span>Phone number *</span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      value={customer.phone}
                      placeholder="10-digit mobile"
                      onFocus={() => setShowSuggest(true)}
                      onBlur={() => setTimeout(() => setShowSuggest(false), 160)}
                      onChange={(event) => setCustomer({ ...customer, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })}
                    />
                  </label>
                  {showSuggest && suggestions.length ? (
                    <div className="suggest">
                      {suggestions.map((person) => (
                        <button
                          type="button"
                          key={person.key}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setCustomer({ name: person.name, phone: person.phone, address: person.address || "" });
                            setShowSuggest(false);
                          }}
                        >
                          <b>{person.name}</b>
                          <small>{person.phone}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="handoff">
                <article className={fulfillment.startsWith("door") ? "handoff-card on" : "handoff-card"}>
                  <b>Home delivery</b>
                  <p>Door pickup and shop pickup cannot both be selected.</p>
                  <div className="seg">
                    {HOME_OPTIONS.map((option) => (
                      <button key={option.id} type="button" aria-pressed={fulfillment === option.id} onClick={() => setFulfillment(option.id)}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </article>
                <article className={fulfillment.startsWith("shop") ? "handoff-card on" : "handoff-card"}>
                  <b>Customer will come to shop</b>
                  <p>Only one side can be selected. Both means pickup and delivery.</p>
                  <div className="seg">
                    {SHOP_OPTIONS.map((option) => (
                      <button key={option.id} type="button" aria-pressed={fulfillment === option.id} onClick={() => setFulfillment(option.id)}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </article>
              </div>

              {fulfillment.startsWith("door") ? (
                <label className="field">
                  <span>Address *</span>
                  <input
                    value={customer.address}
                    placeholder="House, area, landmark"
                    onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                  />
                </label>
              ) : null}

              <div className="pair">
                <label className="field">
                  <span>Delivery date</span>
                  <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
                </label>
                <label className="field">
                  <span>Time</span>
                  <select value={deliverySlot} onChange={(event) => setDeliverySlot(event.target.value)}>
                    {SLOTS.map((slot) => <option key={slot}>{slot}</option>)}
                  </select>
                </label>
              </div>

              <div className="pair">
                <div className="choice">
                  <span>Payment type</span>
                  <div className="seg">
                    {PAY_TYPES.map((type) => (
                      <button key={type} type="button" aria-pressed={payType === type} onClick={() => setPayType(type)}>{type}</button>
                    ))}
                  </div>
                </div>
                <div className="choice">
                  <span>Payment info</span>
                  <div className="seg">
                    <button type="button" aria-pressed={payWhen === "pre"} onClick={() => setPayWhen("pre")}>Pre payment</button>
                    <button type="button" aria-pressed={payWhen === "post"} onClick={() => setPayWhen("post")}>Post payment</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <header className="panel-head">
              <span>Select service</span>
            </header>
            <div className="panel-body">
              <div className="service-picks">
                {SERVICE_ORDER.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={service === name ? "service-pick on" : "service-pick"}
                    onClick={() => chooseService(name)}
                  >
                    <ServiceGlyph service={name} />
                    {name}
                  </button>
                ))}
              </div>
              <div className="triple">
                <label className="field">
                  <span>Service</span>
                  <select value={service} onChange={(event) => chooseService(event.target.value)}>
                    {SERVICE_ORDER.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="">Select category...</option>
                    {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Search item</span>
                  <input
                    value={query}
                    placeholder="Type to search..."
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && visibleRates[0]) {
                        event.preventDefault();
                        addRate(visibleRates[0]);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="item-chips">
                {visibleRates.map((rate) => (
                  <button type="button" key={rate.id} onClick={() => addRate(rate)}>
                    {rate.item} ({inr(rate.rate)})
                  </button>
                ))}
                {!category && !query ? (
                  <p className="muted">{categories.length ? "Select a category to see items." : "No items in this service yet."}</p>
                ) : null}
                {(category || query) && visibleRates.length === 0 ? <p className="muted">No items in this category yet.</p> : null}
              </div>
            </div>
          </section>
        </div>

        <section className="panel bill-panel">
          <header className="panel-head">
            <span>Current bill{savedBill ? ` · ${savedBill.number}` : ""}</span>
            <strong>Delivery {deliveryDate ? formatDate(deliveryDate) : "—"}</strong>
          </header>
          <div className="bill-scroll">
            <table className="data bill-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Service</th>
                  <th>Qty / kg</th>
                  <th>Rate</th>
                  <th className="num">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="bill-empty">No items added yet</td>
                  </tr>
                ) : lines.map((line, index) => (
                  <tr key={line.id}>
                    <td>{index + 1}</td>
                    <td><b>{line.item}</b></td>
                    <td>{line.service}</td>
                    <td>
                      <div className="stepper">
                        <button type="button" onClick={() => updateLine(line.id, { qty: money(line.qty - (line.unit === "kg" ? 0.5 : 1)) })}>−</button>
                        <input inputMode="decimal" value={line.qty} onChange={(event) => updateLine(line.id, { qty: event.target.value })} />
                        <button type="button" onClick={() => updateLine(line.id, { qty: money(Number(line.qty) + (line.unit === "kg" ? 0.5 : 1)) })}>+</button>
                      </div>
                    </td>
                    <td>
                      <input className="rate-input" inputMode="decimal" value={line.rate} onChange={(event) => updateLine(line.id, { rate: event.target.value })} />
                    </td>
                    <td className="num">{inr(line.amount)}</td>
                    <td>
                      <button type="button" className="icon-btn" aria-label={`Remove ${line.item}`} onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="bill-foot">
            <label className="field slim-field">
              <span>Note</span>
              <input value={notes} placeholder="Stain, no starch, handle with care" onChange={(event) => setNotes(event.target.value)} />
            </label>
            <div className="sum-row"><span>Subtotal</span><b>{inr(totals.subtotal)}</b></div>
            <label className="sum-row">
              <span>Offer</span>
              <select value={offerId} onChange={(event) => setOfferId(event.target.value)}>
                {OFFERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            {offerValue > 0 ? <div className="sum-row"><span>Offer amount</span><b>− {inr(offerValue)}</b></div> : null}
            <div className="sum-row">
              <span>Discount</span>
              <div className="discount-box">
                <div className="seg tiny">
                  <button type="button" aria-pressed={discountKind === "percent"} onClick={() => setDiscountKind("percent")}>%</button>
                  <button type="button" aria-pressed={discountKind === "flat"} onClick={() => setDiscountKind("flat")}>₹</button>
                </div>
                <input inputMode="decimal" value={discountInput} placeholder="0" onChange={(event) => setDiscountInput(event.target.value)} />
                <em>{inr(manualDiscount)}</em>
              </div>
            </div>
            {totals.tax > 0 ? <div className="sum-row"><span>GST {shop.gstPercent}%</span><b>{inr(totals.tax)}</b></div> : null}
            <div className="sum-row total-row">
              <span>Total amount</span>
              <b>{inr(totals.total)}</b>
            </div>
            <p className="muted handoff-line">{fulfillmentLabel(fulfillment)} · {deliverySlot} · {payWhen === "pre" ? "Pre payment" : "Post payment"} · {payType}</p>
            {error ? <p className="form-error">{error}</p> : null}
            {sentNote ? <p className="ok-text">{sentNote}</p> : null}
            <div className="bill-actions">
              <button className="btn btn-clear" type="button" onClick={clearBill}>Clear bill</button>
              <button className="btn btn-save" type="submit">Save bill</button>
              <button
                className="btn btn-wa"
                type="button"
                disabled={sending}
                onClick={async () => {
                  const bill = persist();
                  if (!bill) return;
                  setSending(true);
                  setSentNote("");
                  try {
                    const result = await sendWhatsApp(bill, shop);
                    setSentNote(`Sent ${result.fileName} on WhatsApp.`);
                  } catch (sendError) {
                    setError(sendError.message);
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? "Sending..." : "Send on WhatsApp"}
              </button>
              <button
                className="btn btn-print"
                type="button"
                onClick={() => {
                  const bill = persist();
                  if (bill) onPreview(bill);
                }}
              >
                Print receipt
              </button>
              <button className="text-btn" type="button" onClick={onCancel}>Back</button>
            </div>
          </footer>
        </section>
      </div>
    </form>
  );
}
