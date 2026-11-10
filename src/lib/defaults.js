export const PAYMENT_MODES = ["Cash", "UPI", "Online", "Card"];

export const FULFILLMENT_LABELS = {
  "door-pickup": "Door pickup",
  "door-delivery": "Door delivery",
  "door-both": "Door pickup and delivery",
  "shop-pickup": "Shop pickup",
  "shop-delivery": "Shop delivery",
  "shop-both": "Shop pickup and delivery",
};

export function fulfillmentLabel(id) {
  return FULFILLMENT_LABELS[id] || "";
}

export const STATUSES = ["Received", "Processing", "Ready", "Delivered"];

export const SERVICE_ORDER = [
  "Wash & Fold",
  "Wash & Iron",
  "Premium Laundry",
  "Dry Cleaning",
  "Steam Iron",
  "Shoe Cleaning",
];

export const CATEGORY_ORDER = ["Men", "Women", "Kids", "Household", "Other", "Shoes", "All"];

function catalog(service, category, unit, items) {
  return items.map(([item, rate]) => [service, category, item, rate, unit]);
}

const RATE_ROWS = [
  ["Wash & Fold", "All", "Clothes", 60, "kg"],
  ["Wash & Iron", "All", "Clothes", 110, "kg"],
  ...catalog("Dry Cleaning", "Men", "pc", [
    ["Shirt", 50],
    ["Short silk", 160],
    ["Short woollen", 140],
    ["T Shirt", 50],
    ["Pant", 110],
    ["Jeans", 110],
    ["Coat", 250],
    ["Waist Coat", 150],
    ["Long Coat", 250],
    ["Jacket (half sleeves)", 140],
    ["Jacket (full sleeves)", 140],
    ["Jacket (with hood)", 140],
  ]),
  ...catalog("Dry Cleaning", "Women", "pc", [
    ["Kurta plain", 140],
    ["Kurta heavy", 160],
    ["Kurta very heavy", 180],
    ["Salwar plain", 140],
    ["Salwar heavy", 150],
    ["Plazzo plain", 140],
    ["Plazzo very heavy", 160],
    ["Dupatta plain", 90],
    ["Dupatta heavy", 110],
    ["Dupatta very heavy", 140],
    ["Saree plain", 250],
    ["Saree heavy", 300],
  ]),
  ...catalog("Dry Cleaning", "Kids", "pc", [
    ["Shirt", 50],
    ["Short woollen", 140],
    ["T Shirt", 50],
    ["Top plain", 50],
    ["Top heavy", 70],
    ["Frock", 100],
    ["Jeans", 110],
    ["Capri", 70],
    ["Shorts", 50],
    ["Jumper", 140],
    ["Dungaree", 140],
    ["Frock plain", 140],
  ]),
  ...catalog("Dry Cleaning", "Household", "pc", [
    ["Curtain door 7ft", 300],
    ["Curtain door with lining 10ft", 400],
    ["Curtain window 6ft", 300],
    ["Curtain window with lining 6ft", 400],
    ["Curtain 8x10", 150],
    ["Blanket single", 180],
    ["Blanket single 3 ply", 400],
    ["Blanket double", 240],
    ["Blanket double 3 ply", 480],
    ["Quilt single", 400],
    ["Quilt single heavy", 450],
    ["Quilt cover single", 50],
  ]),
  ...catalog("Dry Cleaning", "Other", "pc", [
    ["Soft toy small", 150],
    ["Soft toy medium", 250],
    ["Soft toy large", 400],
    ["Soft toy extra large", 500],
    ["Soft case medium", 140],
    ["Soft case large", 150],
    ["Soft case extra large", 150],
    ["Handbag canvas / jute small", 180],
    ["Handbag leather small", 150],
    ["Handbag leather large", 180],
  ]),
  ...catalog("Steam Iron", "Men", "pc", [
    ["Shirt", 20],
    ["Short silk", 70],
    ["Short woollen", 70],
    ["T Shirt", 10],
    ["Pant", 10],
    ["Jeans", 10],
    ["Coat", 70],
    ["Waist Coat", 30],
    ["Long Coat", 70],
    ["Jacket (half sleeves)", 30],
    ["Jacket (full sleeves)", 70],
    ["Jacket (with hood)", 60],
  ]),
  ...catalog("Steam Iron", "Women", "pc", [
    ["Kurta plain", 40],
    ["Kurta heavy", 60],
    ["Kurta very heavy", 60],
    ["Salwar plain", 50],
    ["Salwar heavy", 60],
    ["Plazzo plain", 50],
    ["Plazzo very heavy", 60],
    ["Dupatta plain", 20],
    ["Dupatta heavy", 30],
    ["Dupatta very heavy", 40],
    ["Saree plain", 60],
    ["Saree heavy", 80],
  ]),
  ...catalog("Steam Iron", "Kids", "pc", [
    ["Shirt", 10],
    ["Short woollen", 30],
    ["T Shirt", 10],
    ["Top plain", 10],
    ["Top heavy", 20],
    ["Frock", 30],
    ["Jeans", 10],
    ["Capri", 10],
    ["Shorts", 10],
    ["Jumper", 30],
    ["Dungaree", 30],
    ["Frock plain", 30],
  ]),
  ...catalog("Steam Iron", "Other", "pc", [
    ["Handkerchief", 10],
    ["Bath robe", 50],
    ["Muffler", 20],
    ["Tie", 10],
    ["Face mask", 10],
    ["Bed sheet single", 30],
    ["Bed sheet double", 30],
    ["Pillow cover", 10],
    ["Curtain door 7ft", 30],
    ["Curtain window 6/8ft", 30],
  ]),
  ...catalog("Shoe Cleaning", "Shoes", "pair", [
    ["Sport shoes", 150],
    ["Canvas shoes", 150],
    ["Leather shoes", 180],
    ["Suede leather", 180],
    ["Sandals", 150],
    ["Slippers", 120],
    ["Boots", 300],
  ]),
];

export function defaultShop() {
  return {
    name: "TruWash",
    legalName: "TruWash Laundry",
    tagline: "Laundry & Dry Cleaning",
    slogan: "Freshness You Can Trust...",
    phone: "7387303318",
    address: "Shop No B110, Pawanputra Business Point, Damodar Chowk, Pathardi Phata, Nashik",
    motto: "Clean | Fresh | Trusted",
    hours: "9 AM - 9 PM",
    whatsappTagline: "TruWash - Wash - Repeat",
    reviewLink: "",
    gstin: "",
    gstPercent: 0,
    billPrefix: "TW",
    printFormat: "a4",
    terms:
      "Please collect garments within 15 days of the delivery date. Count the pieces at the counter before leaving. TruWash is not responsible for colour bleed, shrinkage, or damage from weak fabric, buttons, zari, or ornaments. Free pickup and delivery applies on orders booked with the shop.",
  };
}

export function defaultRates() {
  return RATE_ROWS.map(([service, category, item, rate, unit], index) => ({
    id: `rate-${index + 1}`,
    service,
    category,
    item,
    rate,
    unit,
    popular: false,
  }));
}

export function groupRates(rates) {
  const groups = new Map();
  for (const rate of rates) {
    if (!groups.has(rate.service)) groups.set(rate.service, []);
    groups.get(rate.service).push(rate);
  }
  const names = [...groups.keys()].sort((a, b) => {
    const ia = SERVICE_ORDER.indexOf(a);
    const ib = SERVICE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return names.map((service) => ({ service, items: groups.get(service) }));
}
