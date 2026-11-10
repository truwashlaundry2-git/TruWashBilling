import { useMemo, useState } from "react";
import { billBalance, inRange, inr, startOfMonth, startOfWeek, toInputDate } from "../lib/format";
import { useStore } from "../lib/store";

export default function Reports() {
  const { bills } = useStore();
  const today = toInputDate(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const report = useMemo(() => {
    const inBills = bills.filter((bill) => inRange(bill.createdAt, from, to));
    const payments = bills.flatMap((bill) => (bill.payments || []).map((payment) => ({ ...payment, bill })));
    const inPayments = payments.filter((payment) => inRange(payment.at, from, to));
    const billed = inBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const collected = inPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const outstanding = bills.reduce((sum, bill) => sum + billBalance(bill), 0);
    const modes = ["Cash", "UPI", "Online", "Card"].map((mode) => ({
      mode,
      amount: inPayments.filter((payment) => payment.mode === mode).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    }));
    const serviceMap = new Map();
    for (const bill of inBills) {
      for (const line of bill.lines || []) {
        serviceMap.set(line.service, (serviceMap.get(line.service) || 0) + Number(line.amount || 0));
      }
    }
    const services = [...serviceMap.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
    const maxService = Math.max(1, ...services.map((row) => row.amount));
    const dayMap = new Map();
    for (const bill of inBills) {
      const day = toInputDate(bill.createdAt);
      const row = dayMap.get(day) || { day, bills: 0, billed: 0, collected: 0 };
      row.bills += 1;
      row.billed += bill.total || 0;
      dayMap.set(day, row);
    }
    for (const payment of inPayments) {
      const day = toInputDate(payment.at);
      const row = dayMap.get(day) || { day, bills: 0, billed: 0, collected: 0 };
      row.collected += Number(payment.amount || 0);
      dayMap.set(day, row);
    }
    const days = [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day));
    return { count: inBills.length, billed, collected, outstanding, modes, services, maxService, days, dueCount: bills.filter((bill) => billBalance(bill) > 0).length };
  }, [bills, from, to]);

  return (
    <div className="page">
      <div className="card filters">
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setFrom(today); setTo(today); }}>Today</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setFrom(startOfWeek()); setTo(today); }}>This week</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setFrom(startOfMonth()); setTo(today); }}>This month</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setFrom(""); setTo(""); }}>All</button>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
      </div>

      <section className="stats">
        <article className="stat">
          <span>Bills</span>
          <strong>{report.count}</strong>
          <em>Created in this range</em>
        </article>
        <article className="stat">
          <span>Billed</span>
          <strong>{inr(report.billed)}</strong>
          <em>Invoice totals</em>
        </article>
        <article className="stat">
          <span>Collected</span>
          <strong>{inr(report.collected)}</strong>
          <em>{report.modes.filter((row) => row.amount).map((row) => `${row.mode} ${inr(row.amount)}`).join(" · ") || "No collection"}</em>
        </article>
        <article className="stat">
          <span>Still due</span>
          <strong>{inr(report.outstanding)}</strong>
          <em>{report.dueCount} bills, all dates</em>
        </article>
      </section>

      <section className="split">
        <div className="card">
          <div className="card-head">
            <h3>Service sales</h3>
          </div>
          {report.services.length === 0 ? <p className="muted pad">No items in this range.</p> : (
            <div className="bars">
              {report.services.map((row) => (
                <div className="bar-row" key={row.name}>
                  <span>{row.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(6, (row.amount / report.maxService) * 100)}%` }} />
                  </div>
                  <b>{inr(row.amount)}</b>
                </div>
              ))}
            </div>
          )}
          <p className="page-note">Item value before bill discount and GST.</p>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Day by day</h3>
          </div>
          {report.days.length === 0 ? <p className="muted pad">Nothing in this range.</p> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="num">Bills</th>
                    <th className="num">Billed</th>
                    <th className="num">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.map((day) => (
                    <tr key={day.day}>
                      <td>{day.day.split("-").reverse().join("/")}</td>
                      <td className="num">{day.bills}</td>
                      <td className="num">{inr(day.billed)}</td>
                      <td className="num">{inr(day.collected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <p className="page-note">Collected follows the payment date, so an old balance paid today counts in today’s collection.</p>
    </div>
  );
}
