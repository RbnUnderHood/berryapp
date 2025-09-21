// DOM helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// Populate berry select
function initBerrySelect() {
  const sel = $("#harvestBerry");
  if (!sel) return;
  sel.innerHTML = "";
  BERRIES.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = berryName(b.id);
    sel.appendChild(opt);
  });
}

// Set default date
function setToday(input) {
  if (!input) return;
  const d = new Date().toISOString().slice(0, 10);
  input.value = d;
}

// Add harvest handler
function onAddHarvest() {
  const berryId = $("#harvestBerry")?.value;
  const dateISO = $("#harvestDate")?.value;
  const weight_g = parseInt($("#harvestWeight")?.value, 10);
  if (!berryId || !dateISO || !weight_g || weight_g <= 0) {
    alert("Please select berry, date, and enter a positive weight.");
    return;
  }
  const entry = {
    id: crypto.randomUUID(),
    dateISO,
    berryId,
    weight_g,
    fresh_g: 0,
    frozen_g: weight_g,
    note: "",
  };
  harvests.push(entry);
  save(K.harvests, harvests);
  $("#harvestWeight").value = "";
  renderHarvestTable();
  dispatchMetrics();
}

// Render harvest table
function renderHarvestTable() {
  const tb = $("#harvestTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  harvests
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .forEach((h) => {
      const tr = document.createElement("tr");
      const kg = (h.weight_g / 1000).toFixed(2);
      const frz = ((h.frozen_g || 0) / 1000).toFixed(2);
      const fr = ((h.fresh_g || 0) / 1000).toFixed(2);
      tr.innerHTML = `
        <td>${h.dateISO}</td>
        <td>${berryName(h.berryId)}</td>
        <td class="right">${kg}</td>
        <td class="right">${frz}</td>
        <td class="right">${fr}</td>`;
      tb.appendChild(tr);
    });
}

// Boot wiring
// Boot wiring (run after all declarations)
document.addEventListener("DOMContentLoaded", () => {
  initBerrySelect();
  setToday($("#harvestDate"));
  $("#btnAddHarvest")?.addEventListener("click", onAddHarvest);
  renderHarvestTable();
});
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
