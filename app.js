// Storage keys
const K = {
  harvests: "berry.v1.harvests",
  packages: "berry.v1.packages",
  prices: "berry.v1.prices",
  lang: "berry.lang",
};

// JSON helpers
function load(key, dft) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : dft;
  } catch (e) {
    return dft;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Minimal i18n
const I18N = {
  en: {
    blueberries: "Blueberries",
    mulberries: "Mulberries",
    raspberries: "Raspberries",
    blackberries: "Blackberries",
  },
  de: {
    blueberries: "Blaubeeren",
    mulberries: "Maulbeeren",
    raspberries: "Himbeeren",
    blackberries: "Brombeeren",
  },
};

// Language
let lang = load(K.lang, "en");

// Berry list
const BERRIES = [
  { id: "blueberries" },
  { id: "mulberries" },
  { id: "raspberries" },
  { id: "blackberries" },
];
function berryName(id) {
  return I18N[lang][id] || id;
}

// Default prices shape
function defaultPrices() {
  const z = {};
  BERRIES.forEach((b) => {
    z[b.id] = {
      bulk: { fresh: 0, frozen: 0 },
      pack: { fresh: 0, frozen: 0 },
    };
  });
  return z;
}

// State from storage
let harvests = load(K.harvests, []); // [{id,dateISO,berryId,weight_g,fresh_g,frozen_g,note}]
let packages = load(K.packages, []); // [{id,dateISO,product,bag_size_g,bags_count,mix:[{berryId,pct}],price_per_bag}]
let prices = load(K.prices, defaultPrices());

// Event pipeline
function dispatchMetrics() {
  document.dispatchEvent(new CustomEvent("metrics:updated"));
}
document.addEventListener("metrics:updated", () => {
  // no-op for now; will render later
});

// Debug boot
window.Berry = {
  K,
  load,
  save,
  I18N,
  lang,
  BERRIES,
  prices,
  harvests,
  packages,
  berryName,
};
console.log(
  "Berry Tally boot: lang=%s, harvests=%d, packages=%d",
  lang,
  harvests.length,
  packages.length
);
// TODO: logic
