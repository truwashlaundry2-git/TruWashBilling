import { useMemo, useState } from "react";
import { STATUSES } from "../lib/defaults";
import { billBalance, exportBillsCsv, formatDate, inr, isOverdue, paymentKind, toInputDate } from "../lib/format";
import { useStore } from "../lib/store";
import { Empty, PayChip, StatusChip, Token } from "../components/ui";

export default function Bills({ initialQuery = "", initialStatus = "All", initialFrom = "", initialTo = "", onOpen, onPreview }) {
  const { bills } = useStore();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus || "All");
  const [pay, setPay] = useState("All");
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...bills]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((bill) => {
        if (status !== "All" && bill.status !== status) return false;
        if (pay !== "All" && paymentKind(bill) !== pay) return false;
        const day = toInputDate(bill.createdAt);
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (!q) return true;
        const blob = `${bill.number} ${bill.token} ${bill.customer?.name || ""} ${bill.customer?.phone || ""}`.toLowerCase();
        return blob.includes(q);
      });
  }, [bills, query, status, pay, from, to]);

  return (
    <div className="page">
      <div className="card filters">
        <input className="search" placeholder="Search token, bill, name, phone" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All</option>
          {STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={pay} onChange={(event) => setPay(event.target.value)}>
          <option value="All">Any payment</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
        <button className="btn btn-ghost" type="button" onClick={() => exportBillsCsv(rows)} disabled={!rows.length}>
          Export CSV
        </button>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <Empty title="No bills match" text="Try another name, token, or date. New orders show up here as soon as you save them." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Bill</th>
                  <th>Customer</th>
                  <th>Ready by</th>
                  <th className="num">Total</th>
                  <th className="num">Balance</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((bill) => (
                  <tr key={bill.id} className="clickable" onClick={() => onOpen(bill.id)}>
                    <td>
                      <Token value={bill.token} />
                    </td>
                    <td>
                      <b>{bill.number}</b>
                      <small>{formatDate(bill.createdAt)}</small>
                    </td>
                    <td>
                      <b>{bill.customer?.name}</b>
                      <small>{bill.customer?.phone || "—"}</small>
                    </td>
                    <td>{bill.deliveryDate ? formatDate(bill.deliveryDate) : "—"}</td>
                    <td className="num">{inr(bill.total)}</td>
                    <td className="num">{inr(billBalance(bill))}</td>
                    <td>
                      <StatusChip status={bill.status} overdue={isOverdue(bill)} />
                      <PayChip bill={bill} />
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPreview(bill);
                        }}
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
