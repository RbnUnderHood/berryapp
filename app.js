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

function initStorageUI() {
  const sel = document.getElementById("actBerry");
  if (sel) {
    sel.innerHTML = "";
    (BERRIES || []).forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = b.name;
      sel.appendChild(o);
    });
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
  const today = new Date().toISOString().slice(0, 10);
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
      <td>${b.name}</td>
      <td class="right">${m.frozenKg.toFixed(2)}</td>
      <td class="right">${m.freshKg.toFixed(2)}</td>
      <td class="right">${typeof toShortPYG === "function" ? toShortPYG(m.valuePYG) : m.valuePYG.toLocaleString()}</td>
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
    tfV.textContent = typeof toShortPYG === "function" ? toShortPYG(sumValue) : sumValue.toLocaleString();

  // update header pills if present (by kg)
  const f = document.getElementById("pillFresh");
  if (f) f.textContent = `Fresh stock: ${sumFresh.toFixed(2)} kg`;
  const z = document.getElementById("pillFrozen");
  if (z) z.textContent = `Frozen stock: ${sumFrozen.toFixed(2)} kg`;
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
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${formatDateEU(a.dateISO)}</td>
      <td>${BERRIES.find((b) => b.id === a.berryId)?.name || a.berryId}</td>
      <td>${a.product}</td>
      <td>${a.action}</td>
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
  { id: "blueberries", name: "Blueberries" },
  { id: "mulberries", name: "Mulberries" },
  { id: "raspberries", name: "Raspberries" },
  { id: "blackberries", name: "Blackberries" },
];
const berryName = (id) => BERRIES.find((b) => b.id === id)?.name || id;

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
      <td>${b.name}</td>
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
      o.textContent = b.name;
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
  if (f) f.textContent = `Fresh stock: ${sumFreshKg.toFixed(2)} kg`;
  if (z) z.textContent = `Frozen stock: ${sumFrozenKg.toFixed(2)} kg`;
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
  harvests
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .forEach((h) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDateEU(h.dateISO)}</td>
				<td>${berryName(h.berryId)}</td>
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
    BERRIES.find((b) => b.id === h.berryId)?.name || h.berryId,
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
