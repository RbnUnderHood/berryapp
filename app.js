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
  Object.values(map).forEach((m) => {
    if (m.lastDate) {
      const d1 = new Date(m.lastDate + "T00:00:00Z");
      const d2 = new Date(today + "T00:00:00Z");
      m.daysSince = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
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
  (BERRIES || []).forEach((b) => {
    const m = map[b.id];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.name}</td>
      <td class="right">${m.frozenKg.toFixed(2)}</td>
      <td class="right">${m.freshKg.toFixed(2)}</td>
      <td class="right">${m.daysSince}</td>`;
    tb.appendChild(tr);
  });
  // update header pills if present
  const totalFresh = Object.values(map).reduce((s, m) => s + m.freshKg, 0);
  const totalFrozen = Object.values(map).reduce((s, m) => s + m.frozenKg, 0);
  const f = document.getElementById("pillFresh");
  if (f) f.textContent = `Fresh stock: ${totalFresh.toFixed(2)} kg`;
  const z = document.getElementById("pillFrozen");
  if (z) z.textContent = `Frozen stock: ${totalFrozen.toFixed(2)} kg`;
}

function renderRecentActions() {
  const tb = document.querySelector("#actionsTable tbody");
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
      <td>${a.dateISO}</td>
      <td>${BERRIES.find((b) => b.id === a.berryId)?.name || a.berryId}</td>
      <td>${a.product}</td>
      <td>${a.action}</td>
  <td class="right">${kg.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
}
// Apply bulk action
async function onDoBulkAction() {
  const dateISO = new Date().toISOString().slice(0, 10);
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

// Format YYYY-MM-DD to DD-MM-'YY (European short with leading apostrophe before year)
function formatDateEU(dateISO) {
  if (!dateISO || typeof dateISO !== "string") return dateISO || "";
  const parts = dateISO.split("-");
  if (parts.length !== 3) return dateISO;
  const [y, m, d] = parts;
  const yy = String(Number(y) % 100).padStart(2, "0");
  return `${d}-${m}-'${yy}`;
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
    d.value = new Date().toISOString().slice(0, 10);
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
  if (!berryId || !dateISO || weight_g <= 0) {
    alert("Fill date, berry, and a positive weight");
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
document.getElementById("btnAddHarvest")?.addEventListener("click", () => {
  onAddHarvest();
  renderStorage();
  renderRecentActions();
});
document
  .getElementById("btnExportHarvestCSV")
  ?.addEventListener("click", exportHarvestCSV);
document
  .getElementById("btnDoBulkAction")
  ?.addEventListener("click", onDoBulkAction);
