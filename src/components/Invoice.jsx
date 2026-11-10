import Brand from "./Brand";
import { fulfillmentLabel } from "../lib/defaults";
import {
  billBalance,
  changeDue,
  formatDate,
  formatDateTime,
  formatPhone,
  inr,
  paidOf,
  padToken,
  paymentKind,
  paymentLabel,
  qtyText,
  rupeesInWords,
} from "../lib/format";

function handoff(bill) {
  if (bill.fulfillment) return fulfillmentLabel(bill.fulfillment);
  if (bill.pickupDelivery) return "Door pickup and delivery";
  return "";
}

function Items({ bill }) {
  return (
    <table className="inv-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Particular</th>
          <th>Service</th>
          <th className="num">Qty</th>
          <th className="num">Rate</th>
          <th className="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        {bill.lines.map((line, index) => (
          <tr key={line.id || index}>
            <td>{index + 1}</td>
            <td>
              {line.item}
              <small> / {line.unit || "pc"}</small>
            </td>
            <td>{line.service}</td>
            <td className="num">{qtyText(line.qty)}</td>
            <td className="num">{inr(line.rate)}</td>
            <td className="num">{inr(line.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ bill }) {
  const paid = paidOf(bill);
  const balance = billBalance(bill);
  const change = changeDue(bill);
  return (
    <div className="inv-totals">
      <div>
        <span>Subtotal</span>
        <b>{inr(bill.subtotal)}</b>
      </div>
      {bill.discount > 0 ? (
        <div>
          <span>Discount</span>
          <b>− {inr(bill.discount)}</b>
        </div>
      ) : null}
      {bill.tax > 0 ? (
        <>
          <div>
            <span>CGST</span>
            <b>{inr(bill.cgst)}</b>
          </div>
          <div>
            <span>SGST</span>
            <b>{inr(bill.sgst)}</b>
          </div>
        </>
      ) : null}
      <div className="grand">
        <span>Total</span>
        <b>{inr(bill.total)}</b>
      </div>
      <div>
        <span>Received</span>
        <b>{inr(paid)}</b>
      </div>
      <div className={balance > 0 ? "due" : "settled"}>
        <span>{balance > 0 ? "Balance due" : "Balance"}</span>
        <b>{inr(balance)}</b>
      </div>
      {change > 0 ? (
        <div>
          <span>Change</span>
          <b>{inr(change)}</b>
        </div>
      ) : null}
    </div>
  );
}

function Thermal({ bill, shop }) {
  const paid = paidOf(bill);
  const balance = billBalance(bill);
  return (
    <article className="invoice invoice-thermal">
      <header>
        <Brand tone="light" />
        <p className="inv-slogan">{shop.slogan}</p>
        <p>{formatPhone(shop.phone)}</p>
        <p className="inv-address">{shop.address}</p>
      </header>
      <div className="thermal-token">TOKEN {padToken(bill.token)}</div>
      <p className="thermal-meta">
        {bill.number}
        <br />
        {formatDateTime(bill.createdAt)}
        <br />
        {bill.deliveryDate ? `Ready by ${formatDate(bill.deliveryDate)}${bill.deliverySlot ? `, ${bill.deliverySlot}` : ""}` : ""}
        {handoff(bill) ? <><br />{handoff(bill)}</> : null}
        <br />
        {bill.status} · {paymentLabel(paymentKind(bill))}
      </p>
      <p>
        <b>{bill.customer?.name}</b>
        {bill.customer?.phone ? <><br />{formatPhone(bill.customer.phone)}</> : null}
      </p>
      <table className="inv-table">
        <tbody>
          {bill.lines.map((line, index) => (
            <tr key={line.id || index}>
              <td>
                {line.item}
                <small>
                  {line.service} · {qtyText(line.qty)} × {inr(line.rate)}
                </small>
              </td>
              <td className="num">{inr(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Totals bill={bill} />
      <p className="inv-words">{rupeesInWords(bill.total)}</p>
      {(bill.payments || []).length ? (
        <p className="thermal-pay">
          {bill.payments.map((payment) => `${payment.mode} ${inr(payment.amount)}`).join(" · ")}
          {balance > 0 ? ` · Due ${inr(balance)}` : ""}
          {paid > bill.total ? "" : ""}
        </p>
      ) : null}
      {handoff(bill) ? <p className="pickup-flag">{handoff(bill)}</p> : null}
      {bill.notes ? <p className="inv-notes">Note: {bill.notes}</p> : null}
      <footer>
        <strong>{shop.motto}</strong>
        <span>Thank you. Please carry this token.</span>
      </footer>
    </article>
  );
}

function A4({ bill, shop }) {
  const title = shop.gstin || bill.tax > 0 ? "Tax invoice" : "Bill";
  return (
    <article className="invoice invoice-a4">
      <header className="a4-head">
        <Brand tone="light" slogan={shop.slogan} />
        <div className="a4-title">
          <span>{title}</span>
          <div className="token token-lg">
            <small>TOKEN</small>
            <strong>{padToken(bill.token)}</strong>
          </div>
        </div>
      </header>
      <div className="a4-shop">
        <div>
          <b>{shop.legalName}</b>
          <p>{shop.address}</p>
        </div>
        <div>
          <p>Phone {formatPhone(shop.phone)}</p>
          {shop.gstin ? <p>GSTIN {shop.gstin}</p> : null}
        </div>
      </div>
      <div className="a4-meta">
        <div>
          <span>Bill no.</span>
          <b>{bill.number}</b>
        </div>
        <div>
          <span>Date</span>
          <b>{formatDateTime(bill.createdAt)}</b>
        </div>
        <div>
          <span>Ready by</span>
          <b>
            {bill.deliveryDate ? formatDate(bill.deliveryDate) : "—"}
            {bill.deliverySlot ? ` · ${bill.deliverySlot}` : ""}
          </b>
        </div>
        <div>
          <span>Status</span>
          <b>
            {bill.status} · {paymentLabel(paymentKind(bill))}
          </b>
        </div>
      </div>
      <div className="a4-customer">
        <span>Customer</span>
        <b>{bill.customer?.name}</b>
        <p>
          {bill.customer?.phone ? formatPhone(bill.customer.phone) : "Phone not given"}
          {bill.customer?.address ? ` · ${bill.customer.address}` : ""}
        </p>
      </div>
      <Items bill={bill} />
      <div className="a4-bottom">
        <div>
          <p className="inv-words">{rupeesInWords(bill.total)}</p>
          {(bill.payments || []).length ? (
            <ul className="pay-list">
              {bill.payments.map((payment) => (
                <li key={payment.id}>
                  {payment.mode} · {inr(payment.amount)}
                  <small>{formatDateTime(payment.at)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No payment received yet.</p>
          )}
          {handoff(bill) ? <p className="pickup-flag">{handoff(bill)}</p> : null}
          {bill.payWhen ? <p className="inv-notes">{bill.payWhen === "pre" ? "Pre payment" : "Post payment"}{bill.payType ? ` · ${bill.payType}` : ""}</p> : null}
          {bill.notes ? <p className="inv-notes">Instructions: {bill.notes}</p> : null}
        </div>
        <Totals bill={bill} />
      </div>
      {shop.terms ? <p className="inv-terms">{shop.terms}</p> : null}
      <div className="sign-row">
        <div>
          <span>Customer</span>
        </div>
        <div>
          <span>For {shop.legalName}</span>
        </div>
      </div>
      <footer>
        <strong>{shop.motto}</strong>
        <span>Freshness you can trust.</span>
      </footer>
    </article>
  );
}

export default function Invoice({ bill, shop }) {
  if (!bill || !shop) return null;
  return shop.printFormat === "thermal" ? <Thermal bill={bill} shop={shop} /> : <A4 bill={bill} shop={shop} />;
}
