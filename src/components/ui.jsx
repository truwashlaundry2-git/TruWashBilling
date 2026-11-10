import { padToken, paymentKind, paymentLabel } from "../lib/format";

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-mark">
        <span>Tru</span>Wash
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Token({ value, large = false }) {
  return (
    <span className={large ? "token token-lg" : "token"} title="Token number">
      {large ? <small>TOKEN</small> : null}
      <strong>{padToken(value)}</strong>
    </span>
  );
}

export function StatusChip({ status, overdue = false }) {
  return (
    <span className="chip-row">
      <span className={`chip chip-${String(status || "").toLowerCase()}`}>{status}</span>
      {overdue ? <span className="chip chip-overdue">Overdue</span> : null}
    </span>
  );
}

export function PayChip({ bill }) {
  const kind = paymentKind(bill);
  return <span className={`chip chip-${kind}`}>{paymentLabel(kind)}</span>;
}
