import { useState } from "react";
import Invoice from "../components/Invoice";
import { Empty, StatusChip } from "../components/ui";
import { fulfillmentLabel, PAYMENT_MODES, STATUSES } from "../lib/defaults";
import {
  billBalance,
  formatDateTime,
  formatPhone,
  inr,
  isOverdue,
  money,
  paidOf,
  sendWhatsApp,
} from "../lib/format";
import { useStore } from "../lib/store";

export default function BillView({ id, onEdit, onRepeat, onBack, onPreview }) {
  const { bills, shop, updateBill, deleteBill } = useStore();
  const bill = bills.find((item) => item.id === id);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [waNote, setWaNote] = useState("");
  const [payError, setPayError] = useState("");

  if (!bill) {
    return (
      <div className="page">
        <Empty title="Bill not found" text="It may have been deleted from this browser." action={<button className="btn btn-navy" onClick={onBack}>Back to bills</button>} />
      </div>
    );
  }

  const balance = billBalance(bill);
  const paid = paidOf(bill);

  function setStatus(status) {
    if (bill.status === status) return;
    updateBill(bill.id, {
      status,
      statusLog: [...(bill.statusLog || []), { status, at: new Date().toISOString() }],
    });
  }

  function addPayment(event) {
    event.preventDefault();
    const value = money(amount);
    if (value <= 0) {
      setPayError("Enter an amount.");
      return;
    }
    updateBill(bill.id, {
      payments: [...(bill.payments || []), { id: crypto.randomUUID(), amount: value, mode, at: new Date().toISOString() }],
    });
    setAmount("");
    setPayError("");
  }

  function remove() {
    deleteBill(bill.id);
    onBack();
  }

  return (
    <div className="page detail">
      <section className="card ops">
        <button className="text-btn" type="button" onClick={onBack}>
          ← All bills
        </button>
        <div className="ops-head">
          <div>
            <p className="eyebrow">{bill.number}</p>
            <h2>{bill.customer?.name}</h2>
            <p>
              {bill.customer?.phone ? <a href={`tel:${bill.customer.phone}`}>{formatPhone(bill.customer.phone)}</a> : "No phone"}
              {bill.customer?.address ? ` · ${bill.customer.address}` : ""}
            </p>
            {bill.fulfillment ? <p>{fulfillmentLabel(bill.fulfillment)}{bill.deliverySlot ? ` · ${bill.deliverySlot}` : ""}</p> : null}
          </div>
          <StatusChip status={bill.status} overdue={isOverdue(bill)} />
        </div>

        <div className="status-steps">
          {STATUSES.map((status) => (
            <button key={status} type="button" aria-pressed={bill.status === status} onClick={() => setStatus(status)}>
              {status}
            </button>
          ))}
        </div>

        <div className="mini-stats">
          <div>
            <span>Total</span>
            <b>{inr(bill.total)}</b>
          </div>
          <div>
            <span>Paid</span>
            <b>{inr(paid)}</b>
          </div>
          <div>
            <span>Balance</span>
            <b className={balance > 0 ? "due-text" : "ok-text"}>{inr(balance)}</b>
          </div>
        </div>

        {balance > 0 ? (
          <form className="pay-box" onSubmit={addPayment}>
            <h3>Receive payment</h3>
            <div className="pay-now">
              <label>
                <span>Amount</span>
                <input inputMode="decimal" placeholder={String(balance)} value={amount} onChange={(event) => setAmount(event.target.value)} />
              </label>
              <label>
                <span>Mode</span>
                <select value={mode} onChange={(event) => setMode(event.target.value)}>
                  {PAYMENT_MODES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
            {payError ? <p className="form-error">{payError}</p> : null}
            <div className="row-actions">
              <button className="btn btn-navy btn-sm" type="submit">
                Add payment
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAmount(String(balance))}>
                Full balance
              </button>
            </div>
          </form>
        ) : (
          <p className="paid-banner">Paid in full.</p>
        )}

        {(bill.payments || []).length ? (
          <ul className="pay-list">
            {bill.payments.map((payment) => (
              <li key={payment.id}>
                {payment.mode} · {inr(payment.amount)}
                <small>{formatDateTime(payment.at)}</small>
              </li>
            ))}
          </ul>
        ) : null}

        {(bill.statusLog || []).length ? (
          <ol className="log">
            {bill.statusLog.map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                {entry.status}
                <small>{formatDateTime(entry.at)}</small>
              </li>
            ))}
          </ol>
        ) : null}

        {bill.notes ? <p className="note-box">{bill.notes}</p> : null}

        <div className="row-actions wrap">
          <button className="btn btn-gold" type="button" onClick={() => onPreview(bill)}>
            Print bill
          </button>
          <button
            className="btn btn-navy"
            type="button"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              setWaNote("");
              try {
                const result = await sendWhatsApp(bill, shop);
                setWaNote(`Sent ${result.fileName} on WhatsApp.`);
              } catch (sendError) {
                setWaNote(sendError.message);
              } finally {
                setSending(false);
              }
            }}
          >
            {sending ? "Sending..." : "WhatsApp"}
          </button>
          {waNote ? <p className={waNote.startsWith("Sent ") ? "ok-text" : "form-error"}>{waNote}</p> : null}
          <button className="btn btn-ghost" type="button" onClick={() => onEdit(bill)}>
            Edit
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => onRepeat(bill)}>
            Repeat order
          </button>
          {confirm ? (
            <>
              <button className="btn btn-danger btn-sm" type="button" onClick={remove}>
                Delete bill
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirm(false)}>
                Keep
              </button>
            </>
          ) : (
            <button className="text-btn danger" type="button" onClick={() => setConfirm(true)}>
              Delete
            </button>
          )}
        </div>
      </section>
      <section className="paper">
        <Invoice bill={bill} shop={shop} />
      </section>
    </div>
  );
}
