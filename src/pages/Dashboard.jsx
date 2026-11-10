import { STATUSES } from "../lib/defaults";
import {
  billBalance,
  formatDate,
  greeting,
  inr,
  isDueToday,
  isOverdue,
  paidOf,
  toInputDate,
} from "../lib/format";
import { useStore } from "../lib/store";
import { Empty, PayChip, StatusChip, Token } from "../components/ui";

export default function Dashboard({ onNew, onOpen }) {
  const { bills, shop } = useStore();
  const today = toInputDate(new Date());
  const todaysBills = bills.filter((bill) => toInputDate(bill.createdAt) === today);
  const todaysBilled = todaysBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
  const paymentsToday = bills.flatMap((bill) => bill.payments || []).filter((payment) => toInputDate(payment.at) === today);
  const collected = paymentsToday.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const byMode = ["Cash", "UPI", "Online", "Card"].map((mode) => ({
    mode,
    amount: paymentsToday.filter((payment) => payment.mode === mode).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  }));
  const outstandingBills = bills.filter((bill) => billBalance(bill) > 0);
  const outstanding = outstandingBills.reduce((sum, bill) => sum + billBalance(bill), 0);
  const ready = bills.filter((bill) => bill.status === "Ready");
  const open = bills.filter((bill) => bill.status !== "Delivered");
  const deliveredToday = bills.filter((bill) => {
    if (bill.status !== "Delivered") return false;
    const mark = [...(bill.statusLog || [])].reverse().find((entry) => entry.status === "Delivered");
    return toInputDate(mark?.at || bill.updatedAt || bill.createdAt) === today;
  });
  const due = [...bills]
    .filter((bill) => isOverdue(bill, today) || isDueToday(bill, today))
    .sort((a, b) => String(a.deliveryDate).localeCompare(String(b.deliveryDate)));
  const recent = [...bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const counts = {
    Received: open.filter((bill) => bill.status === "Received").length,
    Processing: open.filter((bill) => bill.status === "Processing").length,
    Ready: ready.length,
    Delivered: deliveredToday.length,
  };

  return (
    <div className="page">
      <section className="hero card">
        <img src="/banner.png" alt="TruWash Laundry banner" />
        <div className="hero-copy">
          <p className="eyebrow">Pathardi Phata, Nashik</p>
          <h2>{greeting()}</h2>
          <p>{shop.slogan}</p>
          <button className="btn btn-gold" onClick={onNew}>
            New bill
          </button>
        </div>
      </section>

      <section className="stats">
        <article className="stat">
          <span>Today’s bills</span>
          <strong>{todaysBills.length}</strong>
          <em>{inr(todaysBilled)} billed</em>
        </article>
        <article className="stat">
          <span>Today’s collection</span>
          <strong>{inr(collected)}</strong>
          <em>{byMode.filter((row) => row.amount).map((row) => `${row.mode} ${inr(row.amount)}`).join(" · ") || "No payment yet"}</em>
        </article>
        <article className="stat">
          <span>Outstanding</span>
          <strong>{inr(outstanding)}</strong>
          <em>{outstandingBills.length} open balance{outstandingBills.length === 1 ? "" : "s"}</em>
        </article>
        <article className="stat">
          <span>Ready for pickup</span>
          <strong>{ready.length}</strong>
          <em>{deliveredToday.length} delivered today</em>
        </article>
      </section>

      <section className="pipeline">
        {STATUSES.map((status) => (
          <button
            key={status}
            className="pipe"
            onClick={() => onOpen(status === "Delivered" ? { name: "bills", status, from: today, to: today } : { name: "bills", status })}
          >
            <span>{status === "Delivered" ? "Delivered today" : status}</span>
            <strong>{counts[status]}</strong>
          </button>
        ))}
      </section>

      <section className="split">
        <div className="card">
          <div className="card-head">
            <h3>Due today & overdue</h3>
          </div>
          {due.length === 0 ? (
            <Empty title="Counter is clear" text="No order is due today, and nothing is past its delivery date." />
          ) : (
            <div className="stack">
              {due.map((bill) => (
                <button key={bill.id} className="list-row" onClick={() => onOpen({ name: "bill", id: bill.id })}>
                  <Token value={bill.token} />
                  <span>
                    <b>{bill.customer?.name}</b>
                    <small>
                      {bill.number} · {formatDate(bill.deliveryDate)} · {inr(billBalance(bill))} due
                    </small>
                  </span>
                  <StatusChip status={bill.status} overdue={isOverdue(bill, today)} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Recent bills</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onOpen({ name: "bills" })}>
              View all
            </button>
          </div>
          {recent.length === 0 ? (
            <Empty title="No bills yet" text="The rate card is ready. Take the first order and give the customer a token." action={<button className="btn btn-gold" onClick={onNew}>Create a bill</button>} />
          ) : (
            <div className="stack">
              {recent.map((bill) => (
                <button key={bill.id} className="list-row" onClick={() => onOpen({ name: "bill", id: bill.id })}>
                  <Token value={bill.token} />
                  <span>
                    <b>{bill.customer?.name}</b>
                    <small>
                      {bill.number} · {inr(bill.total)} · paid {inr(paidOf(bill))}
                    </small>
                  </span>
                  <PayChip bill={bill} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
