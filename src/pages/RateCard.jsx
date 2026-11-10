import { useMemo, useState } from "react";
import { groupRates } from "../lib/defaults";
import { inr } from "../lib/format";
import { useStore } from "../lib/store";
import { Field } from "../components/ui";

const UNITS = ["pc", "kg", "pair", "set", "panel", "sq"];

export default function RateCard({ onNotify }) {
  const { rates, saveRate, deleteRate, restoreRates } = useStore();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ service: "Wash & Iron", item: "", rate: "", unit: "pc" });
  const [confirm, setConfirm] = useState(false);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rates.filter((rate) => `${rate.service} ${rate.item}`.toLowerCase().includes(q)) : rates;
    return groupRates(filtered);
  }, [rates, query]);

  function add(event) {
    event.preventDefault();
    if (!draft.service.trim() || !draft.item.trim()) return;
    saveRate({
      service: draft.service.trim(),
      item: draft.item.trim(),
      rate: Number(draft.rate) || 0,
      unit: draft.unit,
    });
    setDraft({ ...draft, item: "", rate: "" });
    onNotify("Rate added.");
  }

  return (
    <div className="page">
      <div className="card filters">
        <input className="search" placeholder="Search the rate card" value={query} onChange={(event) => setQuery(event.target.value)} />
        {confirm ? (
          <>
            <button
              className="btn btn-danger btn-sm"
              type="button"
              onClick={() => {
                restoreRates();
                setConfirm(false);
                onNotify("Suggested rates restored.");
              }}
            >
              Restore suggested rates
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={() => setConfirm(true)}>
            Restore suggested rates
          </button>
        )}
      </div>

      <form className="card add-rate" onSubmit={add}>
        <Field label="Service">
          <input list="services" value={draft.service} onChange={(event) => setDraft({ ...draft, service: event.target.value })} />
          <datalist id="services">
            {groupRates(rates).map((group) => (
              <option key={group.service} value={group.service} />
            ))}
          </datalist>
        </Field>
        <Field label="Garment">
          <input value={draft.item} onChange={(event) => setDraft({ ...draft, item: event.target.value })} />
        </Field>
        <Field label="Rate">
          <input inputMode="decimal" value={draft.rate} onChange={(event) => setDraft({ ...draft, rate: event.target.value })} />
        </Field>
        <Field label="Unit">
          <select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })}>
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </Field>
        <button className="btn btn-gold" type="submit">
          Add rate
        </button>
      </form>
      <p className="page-note">Wash & fold is ₹60 per kg and wash & iron is ₹110 per kg. Dry cleaning, steam iron, and shoes use the category list. Old bills keep the price they were saved with.</p>

      {groups.map((group) => (
        <section className="card" key={group.service}>
          <div className="card-head">
            <h3>{group.service}</h3>
            <span className="muted">{group.items.length}</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Garment</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th>Quick</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {group.items.map((rate) => (
                  <tr key={rate.id}>
                    <td>
                      <input
                        value={rate.item}
                        onChange={(event) => saveRate({ ...rate, item: event.target.value })}
                      />
                    </td>
                    <td>
                      <select value={rate.unit || "pc"} onChange={(event) => saveRate({ ...rate, unit: event.target.value })}>
                        {UNITS.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="rate-input"
                        inputMode="decimal"
                        value={rate.rate}
                        onChange={(event) => saveRate({ ...rate, rate: Number(event.target.value) })}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={rate.popular ? "chip chip-paid" : "chip chip-slate"}
                        onClick={() => saveRate({ ...rate, popular: !rate.popular })}
                      >
                        {rate.popular ? "Popular" : "Mark"}
                      </button>
                    </td>
                    <td>
                      <button className="icon-btn" type="button" aria-label={`Delete ${rate.item}`} onClick={() => deleteRate(rate.id)}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {groups.length === 0 ? <p className="muted">No rates yet. Add the first garment above. A shirt is often {inr(30)}.</p> : null}
    </div>
  );
}
