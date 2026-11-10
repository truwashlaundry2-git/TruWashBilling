import { useMemo, useState } from "react";
import { formatDate, formatPhone, getCustomers, inr } from "../lib/format";
import { useStore } from "../lib/store";
import { Empty } from "../components/ui";

export default function Customers({ onSearch }) {
  const { bills } = useStore();
  const [query, setQuery] = useState("");
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getCustomers(bills).filter((person) => {
      if (!q) return true;
      return `${person.name} ${person.phone} ${person.address}`.toLowerCase().includes(q);
    });
  }, [bills, query]);

  return (
    <div className="page">
      <div className="card filters">
        <input className="search" placeholder="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="card">
        {people.length === 0 ? (
          <Empty title="No customers yet" text="Customers are saved from the bills you create, matched by phone number." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th className="num">Bills</th>
                  <th className="num">Billed</th>
                  <th className="num">Due</th>
                  <th>Last visit</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.key} className="clickable" onClick={() => onSearch(person.phone || person.name)}>
                    <td>
                      <b>{person.name}</b>
                      <small>{person.address || "—"}</small>
                    </td>
                    <td>{person.phone ? formatPhone(person.phone) : "—"}</td>
                    <td className="num">{person.bills}</td>
                    <td className="num">{inr(person.total)}</td>
                    <td className="num">{inr(person.balance)}</td>
                    <td>{formatDate(person.lastAt)}</td>
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
