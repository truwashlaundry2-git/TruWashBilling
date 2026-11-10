import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { defaultRates, defaultShop } from "./defaults";
import { nextBillNo, nextToken, toInputDate } from "./format";

const KEY = "truwash.billing.v1";
const RATES_VERSION = 3;

export function freshState() {
  return { shop: defaultShop(), rates: defaultRates(), bills: [], ratesVersion: RATES_VERSION };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return freshState();
    const keepRates = parsed.ratesVersion === RATES_VERSION && Array.isArray(parsed.rates) && parsed.rates.length;
    return {
      shop: { ...defaultShop(), ...(parsed.shop || {}) },
      rates: keepRates ? parsed.rates : defaultRates(),
      bills: Array.isArray(parsed.bills) ? parsed.bills : [],
      ratesVersion: RATES_VERSION,
    };
  } catch {
    return freshState();
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "shop":
      return { ...state, shop: { ...state.shop, ...action.patch } };
    case "add-bill":
      return { ...state, bills: [action.bill, ...state.bills] };
    case "update-bill":
      return {
        ...state,
        bills: state.bills.map((bill) => (bill.id === action.id ? { ...bill, ...action.patch } : bill)),
      };
    case "delete-bill":
      return { ...state, bills: state.bills.filter((bill) => bill.id !== action.id) };
    case "save-rate": {
      const rate = { unit: "pc", popular: false, ...action.rate };
      const exists = state.rates.some((item) => item.id === rate.id);
      return {
        ...state,
        rates: exists ? state.rates.map((item) => (item.id === rate.id ? { ...item, ...rate } : item)) : [...state.rates, rate],
      };
    }
    case "delete-rate":
      return { ...state, rates: state.rates.filter((item) => item.id !== action.id) };
    case "set-rates":
      return { ...state, rates: action.rates };
    case "replace":
      return action.state;
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const ref = useRef(state);
  ref.current = state;
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  function commit(action) {
    const next = reducer(ref.current, action);
    ref.current = next;
    dispatch(action);
    return next;
  }

  const api = {
    shop: state.shop,
    rates: state.rates,
    bills: state.bills,
    storageError,
    saveShop(patch) {
      commit({ type: "shop", patch });
    },
    saveBill(draft) {
      const now = new Date().toISOString();
      if (draft.id) {
        const prev = ref.current.bills.find((bill) => bill.id === draft.id);
        const patch = {
          ...draft,
          number: prev?.number || draft.number,
          token: prev?.token ?? draft.token,
          tokenDate: prev?.tokenDate || draft.tokenDate,
          createdAt: prev?.createdAt || now,
          updatedAt: now,
        };
        commit({ type: "update-bill", id: draft.id, patch });
        return { ...prev, ...patch };
      }
      const bill = {
        ...draft,
        id: crypto.randomUUID(),
        number: nextBillNo(ref.current.bills, ref.current.shop.billPrefix),
        token: nextToken(ref.current.bills),
        tokenDate: toInputDate(new Date()),
        createdAt: now,
        updatedAt: now,
      };
      commit({ type: "add-bill", bill });
      return bill;
    },
    updateBill(id, patch) {
      commit({ type: "update-bill", id, patch: { ...patch, updatedAt: new Date().toISOString() } });
    },
    deleteBill(id) {
      commit({ type: "delete-bill", id });
    },
    saveRate(rate) {
      const next = { unit: "pc", popular: false, ...rate, id: rate.id || crypto.randomUUID() };
      commit({ type: "save-rate", rate: next });
      return next;
    },
    deleteRate(id) {
      commit({ type: "delete-rate", id });
    },
    restoreRates() {
      commit({ type: "set-rates", rates: defaultRates() });
    },
    replaceAll(data) {
      commit({
        type: "replace",
        state: {
          shop: { ...defaultShop(), ...(data.shop || {}) },
          rates: Array.isArray(data.rates) && data.rates.length ? data.rates : defaultRates(),
          bills: Array.isArray(data.bills) ? data.bills : [],
          ratesVersion: RATES_VERSION,
        },
      });
    },
    resetAll() {
      commit({ type: "replace", state: freshState() });
    },
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}
