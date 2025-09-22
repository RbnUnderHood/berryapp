// Berry Tally base loaded
const $ = (s) => document.querySelector(s);

const K = {
  harvests: "berry.v1.harvests",
  bulkActions: "berry.v1.bulk_actions", // [{id,dateISO,berryId,product:'fresh'|'frozen',action:'remove'|'sold',amount_g}]
};
const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let harvests = load(K.harvests, []);
let bulkActions = load(K.bulkActions, []);
// No segmented state; radios are used instead

// ---- i18n ----
const I18N = {
  en: {
    app: { title: "Berry Tally" },
    common: {
      fresh: "Fresh",
      frozen: "Frozen",
      remove: "Remove",
      sold: "Sold",
    },
    pill: { fresh: "Fresh stock: {v} kg", frozen: "Frozen stock: {v} kg" },
    berries: {
      blueberries: "Blueberries",
      mulberries: "Mulberries",
      raspberries: "Raspberries",
      blackberries: "Blackberries",
    },
    harvest: {
      title: "Harvest",
      date: "Date",
      berry: "Berry",
      product: "Product",
      weight_g: "Weight (g)",
      add: "Add",
      export: "Export CSV (Harvests)",
    },
    storage: {
      title: "Storage",
      berry: "Berry",
      frozen_kg: "Frozen (kg)",
      fresh_kg: "Fresh (kg)",
      value_pyg: "Value (PYG)",
      days: "Days since last",
      bulk_title: "Bulk actions",
      amount_g: "Amount (g)",
      product: "Product",
      action: "Action",
      apply: "Apply",
    },
    sales: {
      title: "Sales",
      recent: "Recent actions",
      date: "Date",
      prod: "Prod",
      action: "Action",
      amount_kg: "Amount (kg)",
    },
    prices: {
      title: "Prices",
      hint: "Set current PYG/kg for bulk products. You can type “k” shorthand (e.g., 80k). Values round to nearest 5,000.",
      berry: "Berry",
      fresh_pyg: "Fresh PYG/kg",
      frozen_pyg: "Frozen PYG/kg",
    },
    table: {
      date: "Date",
      berry: "Berry",
      total_kg: "Total (kg)",
      frozen_kg: "Frozen (kg)",
      fresh_kg: "Fresh (kg)",
      value_pyg: "Value (PYG)",
    },
    totals: { total: "Total" },
  },
  de: {
    app: { title: "Beeren-Zähler" },
    common: {
      fresh: "Frisch",
      frozen: "Gefroren",
      remove: "Entfernen",
      sold: "Verkauft",
    },
    pill: {
      fresh: "Frischbestand: {v} kg",
      frozen: "Tiefkühlbestand: {v} kg",
    },
    berries: {
      blueberries: "Heidelbeeren",
      mulberries: "Maulbeeren",
      raspberries: "Himbeeren",
      blackberries: "Brombeeren",
    },
    harvest: {
      title: "Ernte",
      date: "Datum",
      berry: "Beere",
      product: "Produkt",
      weight_g: "Gewicht (g)",
      add: "Hinzufügen",
      export: "CSV exportieren (Ernten)",
    },
    storage: {
      title: "Lager",
      berry: "Beere",
      frozen_kg: "Gefroren (kg)",
      fresh_kg: "Frisch (kg)",
      value_pyg: "Wert (PYG)",
      days: "Tage seit letzter",
      bulk_title: "Lager-Aktionen",
      amount_g: "Menge (g)",
      product: "Produkt",
      action: "Aktion",
      apply: "Anwenden",
    },
    sales: {
      title: "Verkäufe",
      recent: "Letzte Aktionen",
      date: "Datum",
      prod: "Prod",
      action: "Aktion",
      amount_kg: "Menge (kg)",
    },
    prices: {
      title: "Preise",
      hint: "Aktuelle PYG/kg für Bulk-Produkte. “k” Kurzform erlaubt (z. B. 80k). Werte runden auf 5.000.",
      berry: "Beere",
      fresh_pyg: "Frisch PYG/kg",
      frozen_pyg: "Gefroren PYG/kg",
    },
    table: {
      date: "Datum",
      berry: "Beere",
      total_kg: "Gesamt (kg)",
      frozen_kg: "Gefroren (kg)",
      fresh_kg: "Frisch (kg)",
      value_pyg: "Wert (PYG)",
    },
    totals: { total: "Summe" },
  },
  gsw: {
    app: { title: "Beeri-Tally" },
    common: {
      fresh: "Frisch",
      frozen: "Gfrorn",
      remove: "Wägneh",
      sold: "Verchouft",
    },
    pill: { fresh: "Frischbestand: {v} kg", frozen: "Gfrornbestand: {v} kg" },
    berries: {
      blueberries: "Heidelbeeri",
      mulberries: "Maulbeeri",
      raspberries: "Himbeeri",
      blackberries: "Brombeeri",
    },
    harvest: {
      title: "Ernte",
      date: "Datum",
      berry: "Beeri",
      product: "Produkt",
      weight_g: "Gwicht (g)",
      add: "Hinzuefüege",
      export: "CSV exportiere (Ernte)",
    },
    storage: {
      title: "Lager",
      berry: "Beeri",
      frozen_kg: "Gfrorn (kg)",
      fresh_kg: "Frisch (kg)",
      value_pyg: "Wärt (PYG)",
      days: "Täg sit letscht",
      bulk_title: "Lager-Aktione",
      amount_g: "Mängi (g)",
      product: "Produkt",
      action: "Aktion",
      apply: "Aawände",
    },
    sales: {
      title: "Verchöif",
      recent: "Letschti Aktione",
      date: "Datum",
      prod: "Prod",
      action: "Aktion",
      amount_kg: "Mängi (kg)",
    },
    prices: {
      title: "Pris",
      hint: "Setz aktuell PYG pro kg. Du chasch «k» schriibe (z. B. 80k). Wärt wird uf 5’000 grundet.",
      berry: "Beeri",
      fresh_pyg: "Frisch PYG/kg",
      frozen_pyg: "Gfrorn PYG/kg",
    },
    table: {
      date: "Datum",
      berry: "Beeri",
      total_kg: "Total (kg)",
      frozen_kg: "Gfrorn (kg)",
      fresh_kg: "Frisch (kg)",
      value_pyg: "Wärt (PYG)",
    },
    totals: { total: "Total" },
  },
  // Later: add gsw: { ... } or rm: { ... }
};

K.lang = "berry.lang";
let LANG = localStorage.getItem(K.lang) || "en";

function t(path, params) {
  const segs = path.split(".");
  let cur = I18N[LANG] || I18N.en;
  for (const s of segs) cur = (cur && cur[s]) ?? null;
  let str = typeof cur === "string" ? cur : path;
  if (params) for (const k in params) str = str.replace(`{${k}}`, params[k]);
  return str;
}

function applyTranslations() {
  // Document title
  document.title = t("app.title");
  // Simple innerText replacement
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  // Pills with numbers: use data-i18n-aria + current values
  const fresh = document.getElementById("pillFresh");
  const frozen = document.getElementById("pillFrozen");
  if (fresh) {
    const v =
      fresh.dataset.v || fresh.textContent.match(/([\d.]+)/)?.[1] || "0";
    fresh.textContent = t("pill.fresh", { v });
  }
  if (frozen) {
    const v =
      frozen.dataset.v || frozen.textContent.match(/([\d.]+)/)?.[1] || "0";
    frozen.textContent = t("pill.frozen", { v });
  }
}

function initLangSwitch() {
  const radio = document.querySelector(`input[name="lang"][value="${LANG}"]`);
  if (radio) radio.checked = true;
  document.querySelectorAll('input[name="lang"]').forEach((r) => {
    r.addEventListener(
      "change",
      () => {
        LANG = r.value;
        localStorage.setItem(K.lang, LANG);
        applyTranslations();
        // re-render to refresh headers/labels produced in code
        initHarvestUI && initHarvestUI();
        initStorageUI && initStorageUI();
        renderHarvestTable && renderHarvestTable();
        renderStorage && renderStorage();
        renderRecentActions && renderRecentActions();
        renderPrices && renderPrices();
      },
      { passive: true }
    );
  });
  applyTranslations();
}

function initStorageUI() {
  const sel = document.getElementById("actBerry");
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = "";
    (BERRIES || []).forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = berryLabel(b.id);
      sel.appendChild(o);
    });
    if (prev) sel.value = prev;
  }
}
// Compute storage (harvests MINUS bulkActions)
function computeStorageByBerry() {
  const map = {};
  (BERRIES || []).forEach((b) => {
    map[b.id] = {
      berryId: b.id,
      frozenKg: 0,
      freshKg: 0,
      valuePYG: 0,
      lastDate: null,
      daysSince: null,
    };
  });
  (harvests || []).forEach((h) => {
    const m = map[h.berryId];
    m.frozenKg += (h.frozen_g || 0) / 1000;
    m.freshKg += (h.fresh_g || 0) / 1000;
    if (!m.lastDate || h.dateISO > m.lastDate) m.lastDate = h.dateISO;
  });
  // apply actions (subtract amounts)
  (bulkActions || []).forEach((a) => {
    const m = map[a.berryId];
    if (!m) return;
    const kg = (a.amount_g || 0) / 1000;
    if (a.product === "frozen") m.frozenKg = Math.max(0, m.frozenKg - kg);
    else m.freshKg = Math.max(0, m.freshKg - kg);
  });
  const today = todayLocalISO();
  // Local date (YYYY-MM-DD) to avoid timezone off-by-one
  function todayLocalISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  // Parse YYYY-MM-DD to a local Date at midnight
  function isoToLocalDate(iso) {
    if (!iso || typeof iso !== "string") return new Date();
    const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  }
  Object.values(map).forEach((m) => {
    // compute value using current PYG/kg prices
    const pFro = pricePYG(m.berryId, "frozen");
    const pFre = pricePYG(m.berryId, "fresh");
    m.valuePYG = Math.max(0, Math.round(m.frozenKg * pFro + m.freshKg * pFre));
    if (m.lastDate) {
      const d1 = isoToLocalDate(m.lastDate);
      const d2 = isoToLocalDate(today);
      const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
      m.daysSince = Math.max(0, diff);
    } else m.daysSince = "—";
  });
  return map;
}
// Render storage + recent actions
function renderStorage() {
  const tb = document.querySelector("#storageTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  const map = computeStorageByBerry();

  let sumFrozen = 0,
    sumFresh = 0,
    sumValue = 0;

  (BERRIES || []).forEach((b) => {
    const m = map[b.id];
    sumFrozen += m.frozenKg;
    sumFresh += m.freshKg;
    sumValue += m.valuePYG;

    const tr = document.createElement("tr");
    tr.innerHTML = `
  <td>${berryLabel(b.id)}</td>
      <td class="right">${m.frozenKg.toFixed(2)}</td>
      <td class="right">${m.freshKg.toFixed(2)}</td>
      <td class="right">${
        typeof toShortPYG === "function"
          ? toShortPYG(m.valuePYG)
          : m.valuePYG.toLocaleString()
      }</td>
      <td class="right">${m.daysSince}</td>`;
    tb.appendChild(tr);
  });

  // Update footer totals if present
  const tfF = document.getElementById("totFrozenKg");
  const tfR = document.getElementById("totFreshKg");
  const tfV = document.getElementById("totValuePYG");
  if (tfF) tfF.textContent = sumFrozen.toFixed(2);
  if (tfR) tfR.textContent = sumFresh.toFixed(2);
  if (tfV)
    tfV.textContent =
      typeof toShortPYG === "function"
        ? toShortPYG(sumValue)
        : sumValue.toLocaleString();

  // update header pills if present (by kg)
  const f = document.getElementById("pillFresh");
  if (f) {
    const v = sumFresh.toFixed(2);
    f.dataset.v = v;
    f.textContent =
      typeof t === "function" ? t("pill.fresh", { v }) : `Fresh stock: ${v} kg`;
  }
  const z = document.getElementById("pillFrozen");
  if (z) {
    const v = sumFrozen.toFixed(2);
    z.dataset.v = v;
    z.textContent =
      typeof t === "function"
        ? t("pill.frozen", { v })
        : `Frozen stock: ${v} kg`;
  }
}

function renderRecentActions() {
  const tb = document.querySelector("#salesTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  // show most recent first, cap to 10
  bulkActions
    .slice()
    .reverse()
    .slice(0, 10)
    .forEach((a) => {
      const kg = (a.amount_g || 0) / 1000;
      const prodLabel =
        a.product === "fresh" ? t("common.fresh") : t("common.frozen");
      const actLabel =
        a.action === "sold" ? t("common.sold") : t("common.remove");
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${formatDateEU(a.dateISO)}</td>
  <td>${berryLabel(a.berryId)}</td>
      <td>${prodLabel}</td>
      <td>${actLabel}</td>
  <td class="right">${kg.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
}
// Apply bulk action
async function onDoBulkAction() {
  const dateISO = todayLocalISO();
  const berryId = document.getElementById("actBerry").value;
  const amount_g = Number(document.getElementById("actWeight").value || 0);
  if (!berryId || amount_g <= 0) {
    alert("Set berry and a positive amount");
    return;
  }
  const product =
    document.querySelector('input[name="stProduct"]:checked')?.value ||
    "frozen";
  const action =
    document.querySelector('input[name="stAction"]:checked')?.value || "remove";
  // optional: block when insufficient? (soft for now; we’ll add hard check later)
  const rec = {
    id: crypto.randomUUID(),
    dateISO,
    berryId,
    product,
    action,
    amount_g,
  };
  bulkActions.push(rec);
  save(K.bulkActions, bulkActions);
  document.getElementById("actWeight").value = "";
  renderStorage();
  renderRecentActions();
}
const BERRIES = [
  { id: "blueberries" },
  { id: "mulberries" },
  { id: "raspberries" },
  { id: "blackberries" },
];
function berryLabel(id) {
  const key = `berries.${id}`;
  const label = typeof t === "function" ? t(key) : null;
  return label && label !== key ? label : id;
}

// Local date (YYYY-MM-DD) to avoid timezone off-by-one
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- Prices helpers (PYG) ----
function roundToStep(n, step = 5000) {
  return Math.round(n / step) * step;
}
function toShortPYG(n) {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs >= 1000000) {
    const m = n / 1000000;
    const shown = abs < 10000000 ? Math.round(m * 10) / 10 : Math.round(m);
    return String(shown) + "m";
  }
  if (abs >= 10000) return Math.round(n / 1000).toString() + "k";
  return String(n | 0);
}
function parsePYG(input) {
  if (input == null) return 0;
  let s = String(input).trim().toLowerCase();
  const isK = s.endsWith("k");
  const isM = s.endsWith("m");
  if (isK || isM) {
    s = s.slice(0, -1);
    // keep one decimal separator for k-notation; drop currency and spaces
    s = s.replace(/[^0-9.,]/g, "");
    // unify decimal comma to dot
    s = s.replace(/,/g, ".");
    let valf = parseFloat(s);
    if (!Number.isFinite(valf)) return 0;
    let val = valf * (isM ? 1000000 : 1000);
    return roundToStep(val, 5000);
  }
  // Non-k input: treat separators as thousands; drop non-digits
  s = s.replace(/[^0-9]/g, "");
  let val = Number(s);
  if (!Number.isFinite(val)) return 0;
  return roundToStep(val, 5000);
}

// Read price in PYG per kg for a berry
function pricePYG(berryId, which) {
  const p = prices?.[berryId];
  return which === "fresh"
    ? p?.fresh_PYGkg || 0
    : which === "frozen"
    ? p?.frozen_PYGkg || 0
    : 0;
}

// Prices persistence
K.prices = "berry.v1.prices";
let prices = load(K.prices, null);
if (!prices) {
  prices = {};
  (BERRIES || []).forEach((b) => {
    prices[b.id] = { fresh_eurkg: 0, frozen_eurkg: 0 };
  });
  save(K.prices, prices);
}

function renderPrices() {
  const tb = document.querySelector("#pricesTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  let normalized = false;
  (BERRIES || []).forEach((b) => {
    const row = document.createElement("tr");
    const prev = prices[b.id] || {};
    const pFresh =
      typeof prev.fresh_PYGkg === "number"
        ? prev.fresh_PYGkg
        : typeof prev.fresh_eurkg === "number"
        ? prev.fresh_eurkg
        : 0;
    const pFrozen =
      typeof prev.frozen_PYGkg === "number"
        ? prev.frozen_PYGkg
        : typeof prev.frozen_eurkg === "number"
        ? prev.frozen_eurkg
        : 0;
    // normalize keys to PYG
    const norm = {
      fresh_PYGkg: Number.isFinite(pFresh) ? roundToStep(pFresh, 5000) : 0,
      frozen_PYGkg: Number.isFinite(pFrozen) ? roundToStep(pFrozen, 5000) : 0,
    };
    if (
      !prev ||
      prev.fresh_PYGkg !== norm.fresh_PYGkg ||
      prev.frozen_PYGkg !== norm.frozen_PYGkg ||
      "fresh_eurkg" in prev ||
      "frozen_eurkg" in prev
    ) {
      normalized = true;
    }
    prices[b.id] = norm;
    row.innerHTML = `
      <td>${berryLabel(b.id)}</td>
      <td class="right">
        <input type="text" inputmode="numeric" data-price="${
          b.id
        }|fresh" value="${toShortPYG(prices[b.id].fresh_PYGkg)}">
      </td>
      <td class="right">
        <input type="text" inputmode="numeric" data-price="${
          b.id
        }|frozen" value="${toShortPYG(prices[b.id].frozen_PYGkg)}">
      </td>`;
    tb.appendChild(row);
  });
  if (normalized) save(K.prices, prices);

  // Save on blur (use capture to catch blur)
  tb.addEventListener(
    "blur",
    (e) => {
      const t = e.target;
      if (!t.matches("input[data-price]")) return;
      const [berryId, which] = t.dataset.price.split("|");
      const parsed = parsePYG(t.value);
      if (!prices[berryId])
        prices[berryId] = { fresh_PYGkg: 0, frozen_PYGkg: 0 };
      if (which === "fresh") prices[berryId].fresh_PYGkg = parsed;
      if (which === "frozen") prices[berryId].frozen_PYGkg = parsed;
      save(K.prices, prices);
      // reflect rounding + short form
      t.value = toShortPYG(parsed);
      document.dispatchEvent(
        new CustomEvent("metrics:updated", { detail: { source: "prices" } })
      );
    },
    true
  );
  // Enter commits
  tb.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.target.blur();
  });
}

// Format YYYY-MM-DD to DD-MM-’YY (European short with right single quote before year)
function formatDateEU(dateISO) {
  if (!dateISO || typeof dateISO !== "string") return dateISO || "";
  const parts = dateISO.split("-");
  if (parts.length !== 3) return dateISO;
  const [y, m, d] = parts;
  const yy = String(Number(y) % 100).padStart(2, "0");
  return `${d}-${m}-’${yy}`;
}

function initHarvestUI() {
  const sel = $("#harvestBerry");
  if (sel) {
    sel.innerHTML = "";
    BERRIES.forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = berryLabel(b.id);
      sel.appendChild(o);
    });
  }
  const d = $("#harvestDate");
  if (d) {
    const t = todayLocalISO();
    d.value = t;
    d.max = t; // prevent choosing a future date
  }
}

function initProductToggle() {
  // Legacy init removed — radios are read directly when submitting
}

function recomputeStockPills() {
  const sumFreshKg = (harvests || []).reduce(
    (s, h) => s + (h.fresh_g || 0) / 1000,
    0
  );
  const sumFrozenKg = (harvests || []).reduce(
    (s, h) => s + (h.frozen_g || 0) / 1000,
    0
  );
  const f = document.getElementById("pillFresh");
  const z = document.getElementById("pillFrozen");
  if (f) {
    const v = sumFreshKg.toFixed(2);
    f.dataset.v = v;
    f.textContent =
      typeof t === "function" ? t("pill.fresh", { v }) : `Fresh stock: ${v} kg`;
  }
  if (z) {
    const v = sumFrozenKg.toFixed(2);
    z.dataset.v = v;
    z.textContent =
      typeof t === "function"
        ? t("pill.frozen", { v })
        : `Frozen stock: ${v} kg`;
  }
}

function onAddHarvest() {
  const berryId = document.getElementById("harvestBerry").value;
  const dateISO = document.getElementById("harvestDate").value;
  const weight_g = Number(document.getElementById("harvestWeight").value || 0);
  const today = todayLocalISO();
  if (!berryId || !dateISO || weight_g <= 0) {
    alert("Fill date, berry, and a positive weight");
    return;
  }
  if (dateISO > today) {
    alert("Date cannot be in the future");
    return;
  }
  const product =
    document.querySelector('input[name="hvProduct"]:checked')?.value ||
    "frozen";
  const fresh_g = product === "fresh" ? weight_g : 0;
  const frozen_g = product === "frozen" ? weight_g : 0;
  const h = {
    id: crypto.randomUUID(),
    dateISO,
    berryId,
    weight_g,
    fresh_g,
    frozen_g,
    note: "",
  };
  harvests.push(h);
  save(K.harvests, harvests);
  document.getElementById("harvestWeight").value = "";
  renderHarvestTable();
  recomputeStockPills();
}

function renderHarvestTable() {
  const tb = document.querySelector("#harvestTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  function dayDiffFromToday(dateISO) {
    const d0 = new Date();
    d0.setHours(0, 0, 0, 0);
    const d1 = new Date(dateISO + "T00:00:00");
    return Math.round((d0 - d1) / (1000 * 60 * 60 * 24));
  }
  harvests
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .forEach((h) => {
      const diff = dayDiffFromToday(h.dateISO);
      const cls = diff === 0 ? "tr-today" : diff === 1 ? "tr-yesterday" : "";
      const tr = document.createElement("tr");
      if (cls) tr.className = cls;
      tr.innerHTML = `
        <td>${
          typeof formatDateEU === "function"
            ? formatDateEU(h.dateISO)
            : h.dateISO
        }</td>
                <td>${berryLabel(h.berryId)}</td>
				<td class="right">${(h.weight_g / 1000).toFixed(2)}</td>
				<td class="right">${((h.frozen_g || 0) / 1000).toFixed(2)}</td>
				<td class="right">${((h.fresh_g || 0) / 1000).toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
}

function exportHarvestCSV() {
  const header = [
    "record_type",
    "date",
    "berry",
    "weight_total_g",
    "fresh_g",
    "frozen_g",
    "note",
  ];
  const rows = harvests.map((h) => [
    "harvest",
    formatDateEU(h.dateISO),
    berryLabel(h.berryId),
    h.weight_g,
    h.fresh_g || 0,
    h.frozen_g || 0,
    h.note || "",
  ]);
  const csv = [header, ...rows]
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? '"' + s.replace(/"/g, '""') + '"'
            : s;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "harvests_export.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

initHarvestUI();
renderHarvestTable();
recomputeStockPills();
initProductToggle();
initStorageUI();
renderStorage();
renderRecentActions();
renderPrices();
initLangSwitch();
document.getElementById("btnAddHarvest")?.addEventListener("click", () => {
  onAddHarvest();
  renderStorage();
  renderRecentActions();
});
document
  .getElementById("btnExportHarvestCSV")
  ?.addEventListener("click", exportHarvestCSV);
// Ensure Sales UI is initialized and Apply is wired
(function initSalesUI() {
  const sel = document.getElementById("actBerry");
  if (sel && sel.options.length === 0) {
    sel.innerHTML = "";
    (BERRIES || []).forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = b.name;
      sel.appendChild(o);
    });
  }
  document.getElementById("btnDoBulkAction")?.addEventListener("click", () => {
    onDoBulkAction();
  });
})();
