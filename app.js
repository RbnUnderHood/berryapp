// Berry Tally base loaded
const $ = (s) => document.querySelector(s);

// Key names for localStorage (declare early so other code can use K safely)
const K = {
  harvests: "berry.v1.harvests",
  bulkActions: "berry.v1.bulk_actions",
  packages: "berry.v1.packages",
  packActions: "berry.v1.pack_actions",
  prices: "berry.v1.prices",
  demoSeeded: "berry.v1.demo_seeded",
  demoSeededExt: "berry.v1.demo_seeded_ext_202406",
  lang: "berry.lang",
  theme: "berry.v1.theme",
  dataVersion: "berry.v1.data_version",
};

const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---- Data versioning & backup ----
// Increment when we change data format; add a migration as needed
const DATA_VERSION = 1;
K.dataVersion = "berry.v1.data_version";

function ensureDataVersionAndMigrate() {
  try {
    const cur = Number(localStorage.getItem(K.dataVersion) || 0);
    if (!Number.isFinite(cur) || cur === DATA_VERSION) return;
    // Placeholder for future migrations
    // if (cur < 1) { /* migrate keys/shape if needed */ }
    localStorage.setItem(K.dataVersion, String(DATA_VERSION));
  } catch {}
}

function exportBackupBlob() {
  const payload = {
    meta: {
      app: "berryapp",
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
    },
    data: {
      harvests,
      bulkActions,
      packages,
      packActions,
      prices,
      lang: LANG,
      theme: THEME,
    },
  };
  const json = JSON.stringify(payload, null, 2);
  return new Blob([json], { type: "application/json;charset=utf-8;" });
}

function downloadBackup() {
  try {
    const blob = exportBackupBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const dt = new Date();
    const ts = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(dt.getDate()).padStart(2, "0")}`;
    a.download = `berryapp-backup-${ts}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert("Backup export failed");
    console.error(e);
  }
}

async function importBackupFromFile(file) {
  if (!file) return;
  try {
    const txt = await file.text();
    const payload = JSON.parse(txt);
    if (!payload || !payload.data) throw new Error("Invalid backup file");
    const d = payload.data;
    // Basic validation of arrays/objects
    harvests = Array.isArray(d.harvests) ? d.harvests : [];
    bulkActions = Array.isArray(d.bulkActions) ? d.bulkActions : [];
    packages = Array.isArray(d.packages) ? d.packages : [];
    packActions = Array.isArray(d.packActions) ? d.packActions : [];
    prices = typeof d.prices === "object" && d.prices ? d.prices : prices;
    // Persist
    save(K.harvests, harvests);
    save(K.bulkActions, bulkActions);
    save(K.packages, packages);
    save(K.packActions, packActions);
    save(K.prices, prices);
    // Optional: restore prefs
    if (d.lang) {
      LANG = d.lang;
      localStorage.setItem(K.lang, LANG);
    }
    if (d.theme) applyTheme(d.theme);
    // Re-render
    renderHarvestTable && renderHarvestTable();
    renderStorage && renderStorage();
    renderRecentActions && renderRecentActions();
    renderSales && renderSales();
    renderPrices && renderPrices();
    populatePackageSelect && populatePackageSelect();
    renderMixer && renderMixer();
    renderAnalytics && renderAnalytics();
    applyTranslations && applyTranslations();
    alert("Backup imported successfully");
  } catch (e) {
    alert("Backup import failed");
    console.error(e);
  }
}
let harvests = load(K.harvests, []);
let bulkActions = load(K.bulkActions, []);
// Mixer/packages
let packages = load(K.packages, []);
// track packaged actions (remove/sold) for counts
let packActions = load(K.packActions, []);
// No segmented state; radios are used instead

// ---- i18n ----
const I18N = {
  en: {
    app: { title: "Berry Tally" },
    backup: {
      title: "Backup & Restore",
      hint: "Your data is saved in your browser (localStorage). Export a backup before switching devices or clearing browser data.",
      export_btn: "Export backup (.json)",
      import_btn: "Import backup",
    },
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
      weight_kg: "Weight (kg)",
      picker_pyg: "Picker salary (PYG)",
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
      type: "Type",
      bulk: "Bulk",
      packaged: "Packaged",
      packaged_inventory: "Packaged inventory",
      size_g: "Size",
      mix: "Mix",
      count: "Count",
      cost_per_bag_pyg: "Cost/bag (PYG)",
      package: "Package",
      amount_g: "Amount (g)",
      product: "Product",
      action: "Action",
      apply: "Apply",
    },
    sales: {
      title: "Sales",
      recent: "Recent actions",
      date: "Date",
      prod: "Product",
      action: "Action",
      amount_kg: "Amount (kg)",
      price_pygkg: "Price (PYG/kg)",
      value_pyg: "Value (PYG)",
      note: "Note",
      note_ph: "e.g., Café Rosa, cash",
      month: "Month",
      month_all: "All months",
      berry_all: "All berries",
      sum_by_month: "Summary by Month",
      sum_by_berry: "Summary by Berry",
      export: "Export CSV (Sales)",
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
      actions: "Actions",
      total_kg: "Total (kg)",
      frozen_kg: "Frozen (kg)",
      fresh_kg: "Fresh (kg)",
      value_pyg: "Value (PYG)",
      kg: "Kg",
    },
    totals: { total: "Total" },
    monthsShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    analytics: {
      title: "Harvest Analytics",
      berry: "Berry",
      period: "Period",
      agg: "Aggregation",
      week: "Week",
      month: "Month",
      year: "Year",
      from: "From",
      to: "To",
      all_berries: "All berries",
      last30: "Last 30 days",
      last7: "Last 7 days",
      thisYear: "This year",
      custom: "Custom",
      count: "# Harvests",
      avg_per_harvest: "Avg kg/harvest",
      first_last: "First / Last",
      weekly_totals: "Weekly totals (kg)",
      monthly_totals: "Monthly totals (kg)",
      yearly_totals: "Yearly totals (kg)",
      picker_cost: "Picker salary (PYG)",
      ma7: "7-day moving average (kg)",
    },
    mixer: {
      title: "Mixer",
      create: "Create packages",
      product: "Product",
      size_g: "Package size (g)",
      size_custom_g: "Custom size (g)",
      size_custom_option: "Custom…",
      count: "Count",
      kpi_sum_remain: "Sum / Remaining (g)",
      kpi_cost_per_bag: "Cost / bag (PYG)",
      create_btn: "Create packages",
    },
    ui: {
      delete: "Delete",
      confirm_delete: "Delete this entry?",
    },
  },
  de: {
    app: { title: "Beeren-Zähler" },
    backup: {
      title: "Backup & Wiederherstellung",
      hint: "Deine Daten werden im Browser (localStorage) gespeichert. Exportiere ein Backup, bevor du das Gerät wechselst oder Browserdaten löschst.",
      export_btn: "Backup exportieren (.json)",
      import_btn: "Backup importieren",
    },
    common: {
      fresh: "Frisch",
      frozen: "Gefroren",
      remove: "Entfernen",
      sold: "Verkauft",
    },
    pill: { fresh: "Frischbestand: {v} kg", frozen: "Tiefkühlbestand: {v} kg" },
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
      weight_kg: "Gewicht (kg)",
      picker_pyg: "Pflückerlohn (PYG)",
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
      type: "Typ",
      bulk: "Bulk",
      packaged: "Verpackt",
      packaged_inventory: "Verpackter Bestand",
      size_g: "Größe",
      mix: "Mischung",
      count: "Anzahl",
      cost_per_bag_pyg: "Kosten/Beutel (PYG)",
      package: "Packung",
      amount_g: "Menge (g)",
      product: "Produkt",
      action: "Aktion",
      apply: "Anwenden",
    },
    sales: {
      title: "Verkäufe",
      recent: "Letzte Aktionen",
      date: "Datum",
      prod: "Produkt",
      action: "Aktion",
      amount_kg: "Menge (kg)",
      price_pygkg: "Preis (PYG/kg)",
      value_pyg: "Wert (PYG)",
      note: "Notiz",
      note_ph: "z. B. Café Rosa, bar",
      month: "Monat",
      month_all: "Alle Monate",
      berry_all: "Alle Beeren",
      sum_by_month: "Zusammenfassung nach Monat",
      sum_by_berry: "Zusammenfassung nach Beere",
      export: "CSV exportieren (Verkäufe)",
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
      actions: "Aktionen",
      total_kg: "Gesamt (kg)",
      frozen_kg: "Gefroren (kg)",
      fresh_kg: "Frisch (kg)",
      value_pyg: "Wert (PYG)",
      kg: "Kg",
    },
    totals: { total: "Summe" },
    monthsShort: [
      "Jan",
      "Feb",
      "Mär",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dez",
    ],
    analytics: {
      title: "Ernte-Analytik",
      berry: "Beere",
      period: "Zeitraum",
      agg: "Aggregation",
      week: "Woche",
      month: "Monat",
      year: "Jahr",
      from: "Von",
      to: "Bis",
      all_berries: "Alle Beeren",
      last30: "Letzte 30 Tage",
      last7: "Letzte 7 Tage",
      thisYear: "Dieses Jahr",
      custom: "Benutzerdefiniert",
      count: "# Ernten",
      avg_per_harvest: "Ø kg/Ernte",
      first_last: "Erste / Letzte",
      weekly_totals: "Wöchentliche Summen (kg)",
      monthly_totals: "Monatliche Summen (kg)",
      yearly_totals: "Jährliche Summen (kg)",
      picker_cost: "Pflückerlohn (PYG)",
      ma7: "7-Tage gleitender Durchschnitt (kg)",
    },
    mixer: {
      title: "Mixer",
      create: "Pakete erstellen",
      product: "Produkt",
      size_g: "Paketgröße (g)",
      size_custom_g: "Eigene Größe (g)",
      size_custom_option: "Eigene…",
      count: "Anzahl",
      kpi_sum_remain: "Summe / Rest (g)",
      kpi_cost_per_bag: "Kosten / Beutel (PYG)",
      create_btn: "Pakete erstellen",
    },
    ui: {
      delete: "Löschen",
      confirm_delete: "Diesen Eintrag löschen?",
    },
  },
  gsw: {
    app: { title: "Beeri-Tally" },
    backup: {
      title: "Sicherig & Wiederherstellig",
      hint: "Dyni Date sind im Browser (localStorage). Exportier e Sicherig, wänn du s Gerät wächslesch oder Browserdate löschesch.",
      export_btn: "Sicherig exportiere (.json)",
      import_btn: "Sicherig importiere",
    },
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
      weight_kg: "Gwicht (kg)",
      picker_pyg: "Pflückerloun (PYG)",
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
      type: "Typ",
      bulk: "Bulk",
      packaged: "Verpackt",
      packaged_inventory: "Verpackti Bestand",
      size_g: "Grössi",
      mix: "Mischig",
      count: "Aazahl",
      cost_per_bag_pyg: "Choschte/Bag (PYG)",
      package: "Päckli",
      amount_g: "Mängi (g)",
      product: "Produkt",
      action: "Aktion",
      apply: "Aawände",
    },
    sales: {
      title: "Verchöif",
      recent: "Letschti Aktione",
      date: "Datum",
      prod: "Produkt",
      action: "Aktion",
      amount_kg: "Mängi (kg)",
      price_pygkg: "Pris (PYG/kg)",
      value_pyg: "Wärt (PYG)",
      note: "Notiz",
      note_ph: "z. B. Café Rosa, bar",
      month: "Monet",
      month_all: "Alli Monet",
      berry_all: "Alli Beeri",
      sum_by_month: "Zämesfassig nach Monet",
      sum_by_berry: "Zämesfassig nach Beeri",
      export: "CSV exportiere (Verchöif)",
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
      actions: "Aktione",
      total_kg: "Total (kg)",
      frozen_kg: "Gfrorn (kg)",
      fresh_kg: "Frisch (kg)",
      value_pyg: "Wärt (PYG)",
      kg: "Kg",
    },
    totals: { total: "Total" },
    monthsShort: [
      "Jan",
      "Feb",
      "Mär",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dez",
    ],
    analytics: {
      title: "Ernte-Analytik",
      berry: "Beeri",
      period: "Ziitruum",
      agg: "Aggregeerig",
      week: "Wuche",
      month: "Monet",
      year: "Jahr",
      from: "Vo",
      to: "Bis",
      all_berries: "Alli Beeri",
      last30: "Letschti 30 Täg",
      last7: "Letschti 7 Täg",
      thisYear: "Das Jahr",
      custom: "Eigen",
      count: "# Ernte",
      avg_per_harvest: "Ø kg/Ernte",
      first_last: "Ersti / Letschti",
      weekly_totals: "Wuche-Summe (kg)",
      monthly_totals: "Monats-Summe (kg)",
      yearly_totals: "Jahrs-Summe (kg)",
      picker_cost: "Pflückerloun (PYG)",
      ma7: "7-Täg gleitende Durchschnitt (kg)",
    },
    mixer: {
      title: "Mixer",
      create: "Päckli mache",
      product: "Produkt",
      size_g: "Päckli-Grössi (g)",
      size_custom_g: "Eigeni Grössi (g)",
      size_custom_option: "Eigen…",
      count: "Aazahl",
      kpi_sum_remain: "Summi / Rässt (g)",
      kpi_cost_per_bag: "Choschte / Bag (PYG)",
      create_btn: "Päckli mache",
    },
    ui: {
      delete: "Wägneh",
      confirm_delete: "Däne Iitrag wägneh?",
    },
  },
};

let LANG = localStorage.getItem(K.lang) || "gsw";
let THEME = localStorage.getItem(K.theme) || "dark";

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
  // html lang attribute for accessibility/SEO
  if (document?.documentElement) document.documentElement.lang = LANG;
  // Simple innerText replacement
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  // Translate placeholders
  document.querySelectorAll("[data-i18n-placeholder]")?.forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && "placeholder" in el) {
      el.placeholder = t(key);
    }
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

// ---- Theme handling ----
function applyTheme(theme) {
  THEME = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", THEME);
  localStorage.setItem(K.theme, THEME);
  // sync toggle
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.checked = THEME === "light";
  // re-render charts to pick new axis colors
  if (typeof renderAnalytics === "function") renderAnalytics();
}

// Format YYYY-MM to localized label like "Sep 2025"
function formatMonthKey(key) {
  if (!key || key.length !== 7) return key || "";
  const [y, m] = key.split("-");
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  const names = (I18N[LANG] && I18N[LANG].monthsShort) || I18N.en.monthsShort;
  return `${names[idx]} ${y}`;
}

function populateSalesFilters() {
  const monthSel = document.getElementById("salesMonth");
  const berrySel = document.getElementById("salesBerry");
  const prevMonth = monthSel?.value || "all";
  const prevBerry = berrySel?.value || "all";
  // Months from sold actions
  if (monthSel) {
    const months = Array.from(
      new Set(
        (bulkActions || [])
          .filter((a) => a.action === "sold")
          .map((a) => (a.dateISO || "").slice(0, 7))
      )
    )
      .filter(Boolean)
      .sort()
      .reverse();
    monthSel.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.setAttribute("data-i18n", "sales.month_all");
    optAll.textContent = t("sales.month_all");
    monthSel.appendChild(optAll);
    months.forEach((m) => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = formatMonthKey(m);
      monthSel.appendChild(o);
    });
    monthSel.value = months.includes(prevMonth) ? prevMonth : "all";
  }
  // Berries
  if (berrySel) {
    const all = document.createElement("option");
    all.value = "all";
    all.setAttribute("data-i18n", "sales.berry_all");
    all.textContent = t("sales.berry_all");
    const prev = prevBerry;
    berrySel.innerHTML = "";
    berrySel.appendChild(all);
    (BERRIES || []).forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = berryLabel(b.id);
      berrySel.appendChild(o);
    });
    berrySel.value = (BERRIES || []).some((b) => b.id === prev) ? prev : "all";
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
        populateSalesFilters && populateSalesFilters();
        // refresh analytics labels and UI
        if (typeof refreshAnalyticsFiltersLocale === "function")
          refreshAnalyticsFiltersLocale();
        // refresh mixer labels and table
        if (typeof refreshMixerLocale === "function") refreshMixerLocale();
        renderHarvestTable && renderHarvestTable();
        renderStorage && renderStorage();
        renderRecentActions && renderRecentActions();
        renderPrices && renderPrices();
        populatePackageSelect && populatePackageSelect();
        if (typeof renderMixer === "function") renderMixer();
        if (typeof renderAnalytics === "function") renderAnalytics();
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
  // Toggle Bulk vs Packaged controls
  const bulkBerry = document.getElementById("bulkRowBerry");
  const bulkProd = document.getElementById("bulkRowProduct");
  const bulkAmt = document.getElementById("bulkRowAmount");
  const packSelWrap = document.getElementById("packRowSelect");
  const packCntWrap = document.getElementById("packRowCount");
  function applyTypeVisibility() {
    const type =
      document.querySelector('input[name="stType"]:checked')?.value || "bulk";
    const isPack = type === "packaged";
    if (bulkBerry) bulkBerry.hidden = isPack;
    if (bulkProd) bulkProd.hidden = isPack;
    if (bulkAmt) bulkAmt.hidden = isPack;
    if (packSelWrap) packSelWrap.hidden = !isPack;
    if (packCntWrap) packCntWrap.hidden = !isPack;
    if (isPack && typeof populatePackageSelect === "function")
      populatePackageSelect();
  }
  document.querySelectorAll('input[name="stType"]').forEach((r) => {
    r.addEventListener("change", applyTypeVisibility);
  });
  applyTypeVisibility();
}
// ---- Mixer (packages) UI ----
function initMixerUI() {
  const grid = document.getElementById("mxMixGrid");
  if (!grid) return;
  if (grid.childElementCount === 0) {
    (BERRIES || []).forEach((b) => {
      const wrap = document.createElement("div");
      wrap.className = "g-3";
      const lab = document.createElement("label");
      lab.textContent =
        typeof berryLabel === "function" ? berryLabel(b.id) : b.name || b.id;
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.step = "1";
      inp.placeholder = "0";
      inp.setAttribute("data-mx-berry", b.id);
      wrap.appendChild(lab);
      wrap.appendChild(inp);
      grid.appendChild(wrap);
    });
  }
  // size custom toggle
  const sel = document.getElementById("mxSize");
  const custom = document.getElementById("mxSizeCustom");
  const customWrap = document.getElementById("mxSizeCustomWrap");
  if (sel && custom) {
    sel.onchange = () => {
      custom.disabled = sel.value !== "custom";
      if (custom.disabled) custom.value = "";
      if (customWrap) customWrap.hidden = sel.value !== "custom";
      recomputeMixer();
    };
  }
  // initialize visibility on first load
  if (customWrap && sel) customWrap.hidden = sel.value !== "custom";
  if (custom) custom.oninput = recomputeMixer;
  const cnt = document.getElementById("mxCount");
  if (cnt) cnt.oninput = recomputeMixer;
  document
    .querySelectorAll("#mxMixGrid input[data-mx-berry]")
    .forEach((inp) => inp.addEventListener("input", recomputeMixer));
  document
    .querySelectorAll('input[name="mxProduct"]')
    .forEach((r) => r.addEventListener("change", recomputeMixer));
  document
    .getElementById("btnCreatePackages")
    ?.addEventListener("click", onCreatePackages);
  recomputeMixer();
}

function mixerSizeG() {
  const sel = document.getElementById("mxSize");
  const custom = document.getElementById("mxSizeCustom");
  if (!sel) return 0;
  if (sel.value === "custom") return Math.max(0, Number(custom?.value || 0));
  return Math.max(0, Number(sel.value || 0));
}
function mixerProduct() {
  return (
    document.querySelector('input[name="mxProduct"]:checked')?.value || "frozen"
  );
}
function mixerMix() {
  const map = {};
  document
    .querySelectorAll("#mxMixGrid input[data-mx-berry]")
    .forEach((inp) => {
      const g = Math.max(0, Number(inp.value || 0));
      if (g > 0) map[inp.dataset.mxBerry] = g;
    });
  return map;
}
function gramsSum(obj) {
  return Object.values(obj).reduce((s, x) => s + (Number(x) || 0), 0);
}
function recomputeMixer() {
  const size = mixerSizeG();
  const mix = mixerMix();
  const sum = gramsSum(mix);
  const remain = Math.max(0, size - sum);
  // compute cost per bag from current prices and selected product
  const prod = mixerProduct();
  let cost = 0;
  Object.keys(mix).forEach((id) => {
    const kg = (mix[id] || 0) / 1000;
    cost += kg * (typeof pricePYG === "function" ? pricePYG(id, prod) : 0);
  });
  const toShort =
    typeof toShortPYG === "function" ? toShortPYG : (n) => n.toLocaleString();
  const elSum = document.getElementById("mxSum");
  const elRem = document.getElementById("mxRemain");
  const elCost = document.getElementById("mxCost");
  if (elSum) elSum.textContent = String(sum);
  if (elRem) elRem.textContent = String(remain);
  if (elCost) elCost.textContent = toShort(Math.round(cost));
  const count = Math.max(
    1,
    Number(document.getElementById("mxCount")?.value || 1)
  );
  const btn = document.getElementById("btnCreatePackages");
  if (btn) btn.disabled = !(size > 0 && sum === size && count >= 1);
}
function onCreatePackages() {
  const size_g = mixerSizeG();
  const mix = mixerMix();
  const count = Math.max(
    1,
    Number(document.getElementById("mxCount")?.value || 1)
  );
  const product = mixerProduct();
  const dateISO = todayLocalISO();
  // compute cost snapshot per bag
  let cost_pyg_per_pkg = 0;
  Object.keys(mix).forEach((id) => {
    const kg = (mix[id] || 0) / 1000;
    cost_pyg_per_pkg +=
      kg * (typeof pricePYG === "function" ? pricePYG(id, product) : 0);
  });
  cost_pyg_per_pkg = Math.round(cost_pyg_per_pkg);
  // create package record
  const pkg = {
    id: crypto.randomUUID(),
    dateISO,
    product,
    size_g,
    count,
    mix,
    cost_pyg_per_pkg,
  };
  packages.push(pkg);
  save(K.packages, packages);
  // subtract bulk per berry (grams * count) via bulkActions with action:'pack'
  Object.entries(mix).forEach(([berryId, gramsPerBag]) => {
    const total_g = (gramsPerBag || 0) * count;
    const rec = {
      id: crypto.randomUUID(),
      dateISO,
      berryId,
      product,
      action: "pack",
      amount_g: total_g,
    };
    bulkActions.push(rec);
  });
  save(K.bulkActions, bulkActions);
  // clear inputs
  document
    .querySelectorAll("#mxMixGrid input[data-mx-berry]")
    .forEach((inp) => (inp.value = ""));
  const cnt = document.getElementById("mxCount");
  if (cnt) cnt.value = "1";
  recomputeMixer();
  // downstream renders
  if (typeof renderStorage === "function") renderStorage();
  if (typeof renderMixer === "function") renderMixer();
  if (typeof renderRecentActions === "function") renderRecentActions();
  if (typeof renderSales === "function") renderSales();
}
function mixSignature(mix) {
  const keys = Object.keys(mix || {}).sort();
  return keys.map((k) => `${k}:${mix[k]}`).join("|");
}
function mixShortLabel(mix) {
  const keys = Object.keys(mix || {}).sort();
  return keys
    .map(
      (k) =>
        `${
          (typeof berryLabel === "function" ? berryLabel(k) : k).split(" ")[0]
        } ${mix[k]}g`
    )
    .join(", ");
}
function renderMixer() {
  const tb =
    document.querySelector("#packagedTable tbody") ||
    document.querySelector("#mixerTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  const groups = {};
  (packages || []).forEach((p) => {
    const sig = `${p.product}|${p.size_g}|${mixSignature(p.mix)}`;
    if (!groups[sig])
      groups[sig] = {
        dateISO: p.dateISO,
        product: p.product,
        size_g: p.size_g,
        mix: p.mix,
        count: 0,
        cost: p.cost_pyg_per_pkg,
      };
    groups[sig].count += p.count || 1;
    if (p.dateISO > groups[sig].dateISO) groups[sig].dateISO = p.dateISO;
  });
  // apply packaged actions (remove/sold) to reduce available count
  (packActions || []).forEach((a) => {
    const key = `${a.product}|${a.size_g}|${a.mixSig}`;
    if (!groups[key]) return;
    const delta = Number(a.count || 0);
    if (!Number.isFinite(delta) || delta <= 0) return;
    groups[key].count = Math.max(0, (groups[key].count || 0) - delta);
    // keep latest date
    if (a.dateISO > groups[key].dateISO) groups[key].dateISO = a.dateISO;
  });

  Object.values(groups)
    .sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || ""))
    .forEach((g) => {
      const tr = document.createElement("tr");
      const toShort =
        typeof toShortPYG === "function"
          ? toShortPYG
          : (n) => n.toLocaleString();
      tr.innerHTML = `
        <td>${
          typeof formatDateEU === "function"
            ? formatDateEU(g.dateISO)
            : g.dateISO
        }</td>
        <td>${g.product}</td>
        <td>${g.size_g} g</td>
        <td>${mixShortLabel(g.mix)}</td>
        <td class="right">${g.count}</td>
        <td class="right">${toShort(g.cost)}</td>`;
      tb.appendChild(tr);
    });
}
function refreshMixerLocale() {
  const grid = document.getElementById("mxMixGrid");
  if (!grid) return;
  grid.querySelectorAll("input[data-mx-berry]").forEach((inp) => {
    const id = inp.getAttribute("data-mx-berry");
    const lab = inp.previousElementSibling;
    if (lab && lab.tagName === "LABEL")
      lab.textContent = typeof berryLabel === "function" ? berryLabel(id) : id;
  });
}

// ---- Packaged actions (remove/sell packages) ----
function populatePackageSelect() {
  const sel = document.getElementById("packSel");
  if (!sel) return;
  const groups = {};
  (packages || []).forEach((p) => {
    const sig = `${p.product}|${p.size_g}|${mixSignature(p.mix)}`;
    if (!groups[sig])
      groups[sig] = {
        product: p.product,
        size_g: p.size_g,
        mix: p.mix,
        count: 0,
      };
    groups[sig].count += p.count || 1;
  });
  // subtract actions to show available
  (packActions || []).forEach((a) => {
    const key = `${a.product}|${a.size_g}|${a.mixSig}`;
    if (groups[key])
      groups[key].count = Math.max(0, groups[key].count - (a.count || 0));
  });
  const prev = sel.value;
  sel.innerHTML = "";
  Object.entries(groups)
    .sort(([ak], [bk]) => ak.localeCompare(bk))
    .forEach(([sig, g]) => {
      const o = document.createElement("option");
      o.value = sig;
      const prod = g.product;
      const labelMix = mixShortLabel(g.mix);
      o.textContent = `${prod} • ${g.size_g}g • ${labelMix} — x${g.count}`;
      sel.appendChild(o);
    });
  if (prev) sel.value = prev;
}
function onDoPackAction() {
  const sel = document.getElementById("packSel");
  const cntEl = document.getElementById("packCount");
  if (!sel || !cntEl) return;
  const sig = sel.value;
  if (!sig) {
    alert("Choose a package");
    return;
  }
  const count = Math.max(1, Number(cntEl.value || 1));
  const action =
    document.querySelector('input[name="pkAction"]:checked')?.value || "remove";
  const note = document.getElementById("packNote")?.value || "";
  const [product, size_g_str, mixSig] = sig.split("|");
  const size_g = Number(size_g_str);
  // Check available
  // Recompute available as in populatePackageSelect
  const grouped = {};
  (packages || []).forEach((p) => {
    const s = `${p.product}|${p.size_g}|${mixSignature(p.mix)}`;
    grouped[s] = (grouped[s] || 0) + (p.count || 1);
  });
  (packActions || []).forEach((a) => {
    grouped[`${a.product}|${a.size_g}|${a.mixSig}`] = Math.max(
      0,
      (grouped[`${a.product}|${a.size_g}|${a.mixSig}`] || 0) - (a.count || 0)
    );
  });
  const avail = grouped[sig] || 0;
  if (count > avail) {
    alert(`Only ${avail} available`);
    return;
  }
  const dateISO = todayLocalISO();
  const rec = {
    id: crypto.randomUUID(),
    dateISO,
    product,
    size_g,
    mixSig,
    action,
    count,
    note,
  };
  packActions.push(rec);
  save(K.packActions, packActions);
  document.getElementById("packCount").value = "1";
  if (document.getElementById("packNote"))
    document.getElementById("packNote").value = "";
  renderMixer();
  populatePackageSelect();
  renderRecentActions();
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
  // apply actions (subtract amounts; includes remove, sold, pack)
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
  // Sales card logic: filter, summaries, note, price snapshot, CSV
  const tb = document.querySelector("#salesTable tbody");
  if (!tb) return;
  tb.innerHTML = "";
  // Get filters
  const monthSel = document.getElementById("salesMonth");
  const berrySel = document.getElementById("salesBerry");
  const monthVal = monthSel?.value || "all";
  const berryVal = berrySel?.value || "all";
  // Filter actions: only sold
  let actions = (bulkActions || []).filter((a) => a.action === "sold");
  if (monthVal !== "all") {
    actions = actions.filter((a) => (a.dateISO || "").slice(0, 7) === monthVal);
  }
  if (berryVal !== "all") {
    actions = actions.filter((a) => a.berryId === berryVal);
  }
  // Table rows
  let totKg = 0,
    totVal = 0;
  actions.forEach((a) => {
    const kg = (a.amount_g || 0) / 1000;
    const prodLabel =
      a.product === "fresh" ? t("common.fresh") : t("common.frozen");
    const price = a.priceSnapshot || pricePYG(a.berryId, a.product);
    const value = Math.round(kg * price);
    totKg += kg;
    totVal += value;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDateEU(a.dateISO)}</td>
      <td>${berryLabel(a.berryId)}</td>
      <td>${prodLabel}</td>
      <td class="right">${kg.toFixed(2)}</td>
      <td class="right">${toShortPYG(price)}</td>
      <td class="right">${toShortPYG(value)}</td>
      <td>${a.note || ""}</td>`;
    tb.appendChild(tr);
  });
  // Totals
  const totKgEl = document.getElementById("salesTotKg");
  const totValEl = document.getElementById("salesTotVal");
  if (totKgEl) totKgEl.textContent = totKg.toFixed(2);
  if (totValEl) totValEl.textContent = toShortPYG(totVal);
  // Summaries by month
  const sumMonth = {};
  actions.forEach((a) => {
    const m = (a.dateISO || "").slice(0, 7);
    if (!sumMonth[m]) sumMonth[m] = { kg: 0, val: 0 };
    const kg = (a.amount_g || 0) / 1000;
    const price = a.priceSnapshot || pricePYG(a.berryId, a.product);
    sumMonth[m].kg += kg;
    sumMonth[m].val += Math.round(kg * price);
  });
  const sumMonthTb = document.querySelector("#salesSumMonth tbody");
  if (sumMonthTb) {
    sumMonthTb.innerHTML = "";
    Object.entries(sumMonth).forEach(([m, v]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${formatMonthKey(
        m
      )}</td><td class="right">${v.kg.toFixed(
        2
      )}</td><td class="right">${toShortPYG(v.val)}</td>`;
      sumMonthTb.appendChild(tr);
    });
  }
  // Summaries by berry
  const sumBerry = {};
  actions.forEach((a) => {
    const b = a.berryId;
    if (!sumBerry[b]) sumBerry[b] = { kg: 0, val: 0 };
    const kg = (a.amount_g || 0) / 1000;
    const price = a.priceSnapshot || pricePYG(a.berryId, a.product);
    sumBerry[b].kg += kg;
    sumBerry[b].val += Math.round(kg * price);
  });
  const sumBerryTb = document.querySelector("#salesSumBerry tbody");
  if (sumBerryTb) {
    sumBerryTb.innerHTML = "";
    Object.entries(sumBerry).forEach(([b, v]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${berryLabel(b)}</td><td class="right">${v.kg.toFixed(
        2
      )}</td><td class="right">${toShortPYG(v.val)}</td>`;
      sumBerryTb.appendChild(tr);
    });
  }
  // End of renderRecentActions
}
// Apply bulk action
async function onDoBulkAction() {
  // Route to packaged actions when Type=Packaged
  const type =
    document.querySelector('input[name="stType"]:checked')?.value || "bulk";
  if (type === "packaged") {
    onDoPackActionViaBulk();
    return;
  }
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
  const note = document.getElementById("actNote")?.value || "";
  const rec = {
    id: crypto.randomUUID(),
    dateISO,
    berryId,
    product,
    action,
    amount_g,
    note,
    priceSnapshot: pricePYG(berryId, product),
  };
  bulkActions.push(rec);
  save(K.bulkActions, bulkActions);
  document.getElementById("actWeight").value = "";
  if (document.getElementById("actNote"))
    document.getElementById("actNote").value = "";
  renderStorage();
  renderRecentActions();
  renderSales();
}

// Packaged remove/sell via Bulk actions UI
function onDoPackActionViaBulk() {
  const sel = document.getElementById("packSel");
  const cntEl = document.getElementById("packCount");
  if (!sel || !cntEl) return;
  const sig = sel.value;
  if (!sig) {
    alert("Choose a package");
    return;
  }
  const count = Math.max(1, Number(cntEl.value || 1));
  const action =
    document.querySelector('input[name="stAction"]:checked')?.value || "remove";
  const note = document.getElementById("actNote")?.value || "";
  const [product, size_g_str, mixSig] = sig.split("|");
  const size_g = Number(size_g_str);
  // availability check (similar to populatePackageSelect)
  const grouped = {};
  (packages || []).forEach((p) => {
    const s = `${p.product}|${p.size_g}|${mixSignature(p.mix)}`;
    grouped[s] = (grouped[s] || 0) + (p.count || 1);
  });
  (packActions || []).forEach((a) => {
    const k = `${a.product}|${a.size_g}|${a.mixSig}`;
    grouped[k] = Math.max(0, (grouped[k] || 0) - (a.count || 0));
  });
  const avail = grouped[sig] || 0;
  if (count > avail) {
    alert(`Only ${avail} available`);
    return;
  }
  const dateISO = todayLocalISO();
  const rec = {
    id: crypto.randomUUID(),
    dateISO,
    product,
    size_g,
    mixSig,
    action,
    count,
    note,
  };
  packActions.push(rec);
  save(K.packActions, packActions);
  // reset
  cntEl.value = "1";
  const n = document.getElementById("actNote");
  if (n) n.value = "";
  // refresh views
  renderMixer();
  populatePackageSelect();
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

// Seed demo data if everything is empty and not seeded before
function seedDemoDataIfEmpty() {
  try {
    const already = localStorage.getItem(K.demoSeeded) === "1";
    const noHarvests = !Array.isArray(harvests) || harvests.length === 0;
    const noActions = !Array.isArray(bulkActions) || bulkActions.length === 0;
    const pricesEmpty = (() => {
      if (!prices) return true;
      let sum = 0;
      (BERRIES || []).forEach((b) => {
        const p = prices[b.id] || {};
        sum +=
          (p.fresh_PYGkg || p.fresh_eurkg || 0) +
          (p.frozen_PYGkg || p.frozen_eurkg || 0);
      });
      return sum === 0;
    })();
    if (already || !(noHarvests && noActions && pricesEmpty)) return;

    // Helpers
    const today = todayLocalISO();
    function isoAddDays(iso, delta) {
      const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
      const dt = new Date(y, (m || 1) - 1, d || 1);
      dt.setDate(dt.getDate() + delta);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    }
    const d0 = today;
    const d1 = isoAddDays(today, -1);
    const d2 = isoAddDays(today, -2);
    const d5 = isoAddDays(today, -5);
    const d8 = isoAddDays(today, -8);

    // Seed prices (PYG/kg)
    const seedPrices = {
      blueberries: { fresh_PYGkg: 80000, frozen_PYGkg: 70000 },
      mulberries: { fresh_PYGkg: 60000, frozen_PYGkg: 50000 },
      raspberries: { fresh_PYGkg: 90000, frozen_PYGkg: 80000 },
      blackberries: { fresh_PYGkg: 85000, frozen_PYGkg: 75000 },
    };
    prices = prices || {};
    (BERRIES || []).forEach((b) => {
      const sp = seedPrices[b.id] || {
        fresh_PYGkg: 60000,
        frozen_PYGkg: 50000,
      };
      prices[b.id] = {
        fresh_PYGkg: sp.fresh_PYGkg,
        frozen_PYGkg: sp.frozen_PYGkg,
      };
    });
    save(K.prices, prices);

    // Seed harvests
    harvests = [
      {
        id: crypto.randomUUID(),
        dateISO: d8,
        berryId: "blueberries",
        weight_g: 1800,
        fresh_g: 0,
        frozen_g: 1800,
        note: "",
      },
      {
        id: crypto.randomUUID(),
        dateISO: d5,
        berryId: "mulberries",
        weight_g: 2200,
        fresh_g: 800,
        frozen_g: 1400,
        note: "",
      },
      {
        id: crypto.randomUUID(),
        dateISO: d2,
        berryId: "raspberries",
        weight_g: 1500,
        fresh_g: 0,
        frozen_g: 1500,
        note: "",
      },
      {
        id: crypto.randomUUID(),
        dateISO: d1,
        berryId: "blackberries",
        weight_g: 1200,
        fresh_g: 600,
        frozen_g: 600,
        note: "",
      },
      {
        id: crypto.randomUUID(),
        dateISO: d0,
        berryId: "mulberries",
        weight_g: 2000,
        fresh_g: 0,
        frozen_g: 2000,
        note: "",
      },
      {
        id: crypto.randomUUID(),
        dateISO: d0,
        berryId: "blueberries",
        weight_g: 900,
        fresh_g: 900,
        frozen_g: 0,
        note: "",
      },
    ];
    save(K.harvests, harvests);

    // Seed bulk actions
    bulkActions = [
      {
        id: crypto.randomUUID(),
        dateISO: d1,
        berryId: "blueberries",
        product: "frozen",
        action: "remove",
        amount_g: 500,
      },
      {
        id: crypto.randomUUID(),
        dateISO: d0,
        berryId: "blackberries",
        product: "fresh",
        action: "sold",
        amount_g: 300,
      },
    ];
    save(K.bulkActions, bulkActions);

    localStorage.setItem(K.demoSeeded, "1");
  } catch {}
}

// Seed extended demo data from mid-2024 if not already seeded
function seedExtendedDemoDataIfNeeded() {
  try {
    if (localStorage.getItem(K.demoSeededExt) === "1") return;
    const start = "2024-06-01";
    const today = todayLocalISO();
    // local ISO add days
    function isoAddDaysLocal(iso, delta) {
      const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
      const dt = new Date(y, (m || 1) - 1, d || 1);
      dt.setDate(dt.getDate() + delta);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    }
    // pseudo-random helper
    function rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }
    // Generate harvests every ~3 days, sometimes two per day
    let date = start;
    let step = 0;
    const berries = (BERRIES || []).map((b) => b.id);
    while (date <= today) {
      // 1 harvest
      const berry1 = pick(berries);
      const prod1 = Math.random() < 0.5 ? "fresh" : "frozen";
      const w1 = rand(900, 2400);
      harvests.push({
        id: crypto.randomUUID(),
        dateISO: date,
        berryId: berry1,
        weight_g: w1,
        fresh_g: prod1 === "fresh" ? w1 : 0,
        frozen_g: prod1 === "frozen" ? w1 : 0,
        note: "",
      });
      // 30% chance of a second harvest same day
      if (Math.random() < 0.3) {
        const berry2 = pick(berries);
        const prod2 = Math.random() < 0.5 ? "fresh" : "frozen";
        const w2 = rand(700, 1800);
        harvests.push({
          id: crypto.randomUUID(),
          dateISO: date,
          berryId: berry2,
          weight_g: w2,
          fresh_g: prod2 === "fresh" ? w2 : 0,
          frozen_g: prod2 === "frozen" ? w2 : 0,
          note: "",
        });
      }
      // Occasionally add a sale/remove action roughly every ~2 weeks
      if (step % 5 === 0) {
        const b = pick(berries);
        const product = Math.random() < 0.5 ? "fresh" : "frozen";
        const amount_g = rand(200, 800);
        bulkActions.push({
          id: crypto.randomUUID(),
          dateISO: date,
          berryId: b,
          product,
          action: Math.random() < 0.7 ? "sold" : "remove",
          amount_g,
          note: "",
          priceSnapshot: pricePYG(b, product),
        });
      }
      date = isoAddDaysLocal(date, 3);
      step++;
    }
    save(K.harvests, harvests);
    save(K.bulkActions, bulkActions);
    localStorage.setItem(K.demoSeededExt, "1");
  } catch {}
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
        <input type="text" inputmode="text" data-price="${
          b.id
        }|fresh" value="${toShortPYG(prices[b.id].fresh_PYGkg)}">
      </td>
      <td class="right">
        <input type="text" inputmode="text" data-price="${
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
  // read kilograms (accept comma decimal), convert to grams (round to nearest gram)
  const rawKg = (document.getElementById("harvestWeight").value || "").trim();
  const normKg = rawKg.replace(",", ".");
  const weight_kg_input = Number(normKg);
  const weight_g = Math.round(
    (Number.isFinite(weight_kg_input) ? weight_kg_input : 0) * 1000
  );
  const picker_pyg = parsePYG(
    document.getElementById("harvestPickerPYG")?.value || 0
  );
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
    picker_pyg,
    note: "",
  };
  harvests.push(h);
  save(K.harvests, harvests);
  document.getElementById("harvestWeight").value = "";
  const p = document.getElementById("harvestPickerPYG");
  if (p) p.value = "";
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
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
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
				<td class="right">${((h.frozen_g || 0) / 1000).toFixed(2)}</td>
				<td class="right">${((h.fresh_g || 0) / 1000).toFixed(2)}</td>
                <td class="right">${
                  typeof toShortPYG === "function"
                    ? toShortPYG(h.picker_pyg || 0)
                    : String(h.picker_pyg || 0)
                }</td>
                <td class="right">
                  <button class="btn" data-del-harvest="${h.id}">${t(
        "ui.delete"
      )}</button>
                </td>`;
      tb.appendChild(tr);
    });

  // Bind delete buttons (event delegation is fine, but we’ll add listeners here for clarity)
  tb.querySelectorAll("button[data-del-harvest]")?.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = btn.getAttribute("data-del-harvest");
      if (!id) return;
      if (!confirm(t("ui.confirm_delete"))) return;
      const idx = harvests.findIndex((h) => h.id === id);
      if (idx >= 0) {
        harvests.splice(idx, 1);
        save(K.harvests, harvests);
        renderHarvestTable();
        recomputeStockPills();
        renderStorage && renderStorage();
        renderRecentActions && renderRecentActions();
        if (typeof renderAnalytics === "function") renderAnalytics();
        // Notify any listeners to recompute metrics/charts
        try {
          document.dispatchEvent(
            new CustomEvent("metrics:updated", {
              detail: { source: "harvest-delete" },
            })
          );
        } catch {}
      }
    });
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
    "picker_pyg",
    "note",
  ];
  const rows = harvests.map((h) => [
    "harvest",
    formatDateEU(h.dateISO),
    berryLabel(h.berryId),
    h.weight_g,
    h.fresh_g || 0,
    h.frozen_g || 0,
    h.picker_pyg || 0,
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

// Ensure data version key exists
try {
  if (!localStorage.getItem(K.dataVersion))
    localStorage.setItem(K.dataVersion, String(DATA_VERSION));
} catch {}
ensureDataVersionAndMigrate();
seedDemoDataIfEmpty();
// Ensure prices initialized (renderPrices also normalizes); then extend demo
initHarvestUI();
renderHarvestTable();
recomputeStockPills();
initProductToggle();
initStorageUI();
renderStorage();
renderRecentActions();
renderPrices();
// Mixer boot
initMixerUI();
renderMixer();
// Packaged selector for Bulk UI
populatePackageSelect();
// Theme init + toggle
applyTheme(THEME);
const themeT = document.getElementById("themeToggle");
if (themeT) themeT.checked = THEME === "light";
document.getElementById("themeToggle")?.addEventListener("change", (e) => {
  const tgt = e.currentTarget || e.target;
  const isLight = !!tgt?.checked;
  applyTheme(isLight ? "light" : "dark");
});
seedExtendedDemoDataIfNeeded();
initLangSwitch();
// Backup & Restore buttons
document
  .getElementById("btnExportBackup")
  ?.addEventListener("click", downloadBackup);
document
  .getElementById("btnImportBackup")
  ?.addEventListener("click", async () => {
    const inp = document.getElementById("fileImportBackup");
    const file = inp?.files?.[0];
    if (!file) {
      alert("Choose a backup file first");
      return;
    }
    await importBackupFromFile(file);
  });
document.getElementById("btnAddHarvest")?.addEventListener("click", () => {
  onAddHarvest();
  renderStorage();
  renderRecentActions();
  if (typeof renderAnalytics === "function") renderAnalytics();
});
document
  .getElementById("btnExportHarvestCSV")
  ?.addEventListener("click", exportHarvestCSV);
// Ensure Sales UI is initialized and Apply is wired
(function initSalesUI() {
  // Bulk action berry select
  const sel = document.getElementById("actBerry");
  if (sel && sel.options.length === 0) {
    sel.innerHTML = "";
    (BERRIES || []).forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = berryLabel(b.id);
      sel.appendChild(o);
    });
  }
  document.getElementById("btnDoBulkAction")?.addEventListener("click", () => {
    onDoBulkAction();
  });
  // Sales filters
  const monthSel = document.getElementById("salesMonth");
  const berrySel = document.getElementById("salesBerry");
  populateSalesFilters();
  // Filter change events
  monthSel?.addEventListener("change", renderSales);
  berrySel?.addEventListener("change", renderSales);
  // CSV export
  document
    .getElementById("btnExportSalesCSV")
    ?.addEventListener("click", exportSalesCSV);
  // Initial render
  renderSales();
})();
// Render Sales card
function renderSales() {
  renderRecentActions();
}
// Export Sales CSV
function exportSalesCSV() {
  const header = [
    "record_type",
    "date",
    "berry",
    "product",
    "amount_kg",
    "price_pygkg",
    "value_pyg",
    "note",
  ];
  // Only sold actions
  const monthSel = document.getElementById("salesMonth");
  const berrySel = document.getElementById("salesBerry");
  const monthVal = monthSel?.value || "all";
  const berryVal = berrySel?.value || "all";
  let actions = (bulkActions || []).filter((a) => a.action === "sold");
  if (monthVal !== "all") {
    actions = actions.filter((a) => (a.dateISO || "").slice(0, 7) === monthVal);
  }
  if (berryVal !== "all") {
    actions = actions.filter((a) => a.berryId === berryVal);
  }
  const rows = actions.map((a) => {
    const kg = (a.amount_g || 0) / 1000;
    const price = a.priceSnapshot || pricePYG(a.berryId, a.product);
    const value = Math.round(kg * price);
    return [
      "sale",
      formatDateEU(a.dateISO),
      berryLabel(a.berryId),
      a.product,
      kg.toFixed(2),
      toShortPYG(price),
      toShortPYG(value),
      a.note || "",
    ];
  });
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
  a.download = "sales_export.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// -------- Analytics (Harvest) --------
// Utilities for date ranges + series
function isoToday() {
  return todayLocalISO();
}
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function startOfYear() {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}
function clampRange(from, to) {
  if (!from || !to) return null;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}
function rangeDays(from, to) {
  const out = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
function movingAvg(arr, win = 7) {
  const res = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= win) sum -= arr[i - win];
    res.push(i >= win - 1 ? sum / win : null);
  }
  return res;
}
function toWeekKey(iso) {
  const d = new Date(iso + "T00:00:00");
  const onejan = new Date(d.getFullYear(), 0, 1);
  const day = Math.floor((d - onejan) / 86400000) + onejan.getDay();
  const week = Math.floor(day / 7) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function toMonthKey(iso) {
  // YYYY-MM
  if (!iso || iso.length < 7) return iso || "";
  return iso.slice(0, 7);
}
function toYearKey(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 4);
}
function formatAggKey(key, agg) {
  if (agg === "year") return key;
  if (agg === "month") return formatMonthKey(key);
  // week: key is like YYYY-Www → show e.g., "W34 ’25" localized
  try {
    const [y, w] = key.split("-W");
    const yy = String(Number(y) % 100).padStart(2, "0");
    return `W${w} ’${yy}`;
  } catch {
    return key;
  }
}

// Populate filters
function initAnalyticsUI() {
  const selB = document.getElementById("anaBerry");
  if (selB && selB.options.length <= 1) {
    (BERRIES || []).forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = berryLabel ? berryLabel(b.id) : b.name || b.id;
      selB.appendChild(o);
    });
  }
  const selP = document.getElementById("anaPeriod");
  const selAgg = document.getElementById("anaAgg");
  // ensure defaults if not set by markup or previous state
  if (selP && !selP.value) selP.value = "thisYear";
  if (selAgg && !selAgg.value) selAgg.value = "month";
  if (selP) selP.onchange = renderAnalytics;
  if (selAgg) {
    selAgg.onchange = () => {
      // update bar chart title i18n key
      const h = document.getElementById("h3AggTotals");
      if (h) {
        const key =
          selAgg.value === "month"
            ? "analytics.monthly_totals"
            : selAgg.value === "year"
            ? "analytics.yearly_totals"
            : "analytics.weekly_totals";
        h.setAttribute("data-i18n", key);
        h.textContent = t(key);
      }
      renderAnalytics();
    };
  }
  if (selB) {
    selB.onchange = renderAnalytics;
  }
  // Update title once based on default/current aggregation
  const h = document.getElementById("h3AggTotals");
  if (selAgg && h) {
    const key =
      selAgg.value === "month"
        ? "analytics.monthly_totals"
        : selAgg.value === "year"
        ? "analytics.yearly_totals"
        : "analytics.weekly_totals";
    h.setAttribute("data-i18n", key);
    h.textContent = t(key);
  }
  if (selP) renderAnalytics();
}

// Update berry option labels on language change without rebuilding options
function refreshAnalyticsFiltersLocale() {
  const selB = document.getElementById("anaBerry");
  if (!selB) return;
  Array.from(selB.options).forEach((opt) => {
    if (opt.value && opt.value !== "all")
      opt.textContent = berryLabel(opt.value);
  });
  // also update aggregation title label
  const selAgg = document.getElementById("anaAgg");
  const h = document.getElementById("h3AggTotals");
  if (selAgg && h) {
    const key =
      selAgg.value === "month"
        ? "analytics.monthly_totals"
        : selAgg.value === "year"
        ? "analytics.yearly_totals"
        : "analytics.weekly_totals";
    h.setAttribute("data-i18n", key);
    h.textContent = t(key);
  }
}

// Compute filtered series (daily kg) and KPIs from harvests
function analyticsData() {
  const berryId = document.getElementById("anaBerry")?.value || "all";
  const period = document.getElementById("anaPeriod")?.value || "last30";
  const agg = document.getElementById("anaAgg")?.value || "week";
  const fromTo = (() => {
    const today = isoToday();
    if (period === "last7") return { from: addDays(today, -6), to: today };
    if (period === "last30") return { from: addDays(today, -29), to: today };
    if (period === "thisYear") return { from: startOfYear(), to: today };
    return null;
  })();
  if (!fromTo)
    return {
      days: [],
      dailyKg: [],
      rows: [],
      buckets: {},
      ma: [],
      totalKg: 0,
      count: 0,
      avgKg: 0,
      first: null,
      last: null,
    };

  // Filter harvests in range, by berry
  const rows = (harvests || [])
    .filter((h) =>
      !berryId || berryId === "all" ? true : h.berryId === berryId
    )
    .filter((h) => h.dateISO >= fromTo.from && h.dateISO <= fromTo.to)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const days = rangeDays(fromTo.from, fromTo.to);
  const map = Object.fromEntries(days.map((d) => [d, 0]));
  rows.forEach((h) => {
    map[h.dateISO] += (h.weight_g || 0) / 1000;
  }); // kg per day
  const dailyKg = days.map((d) => map[d] || 0);
  const ma = movingAvg(dailyKg, 7);

  // Aggregation buckets
  const buckets = {};
  const toKey =
    agg === "month" ? toMonthKey : agg === "year" ? toYearKey : toWeekKey;
  days.forEach((d, i) => {
    const key = toKey(d);
    buckets[key] = (buckets[key] || 0) + dailyKg[i];
  });

  // KPIs
  const totalKg = dailyKg.reduce((s, x) => s + x, 0);
  const count = rows.length;
  const avgKg = count ? totalKg / count : 0;
  const first = rows[0]?.dateISO || null;
  const last = rows[rows.length - 1]?.dateISO || null;

  return {
    days,
    dailyKg,
    ma,
    buckets,
    rows,
    totalKg,
    count,
    avgKg,
    first,
    last,
    agg,
  };
}

// Simple canvas drawing helpers (no libs)
function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
function drawAxes(ctx, padding) {
  const axis =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--axis")
      .trim() || "#2a3144";
  ctx.strokeStyle = axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, ctx.canvas.height - padding);
  ctx.lineTo(ctx.canvas.width - padding, ctx.canvas.height - padding);
  ctx.stroke();
}
function drawYTicks(ctx, maxVal, padding) {
  const axis =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--axis")
      .trim() || "#2a3144";
  ctx.fillStyle = axis;
  ctx.strokeStyle = axis + "40"; // light grid
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const h = ctx.canvas.height;
  const w = ctx.canvas.width;
  const innerH = h - padding * 2;
  const steps = 4; // 0%, 25, 50, 75, 100
  const niceMax = maxVal <= 1 ? 1 : Math.ceil(maxVal);
  for (let i = 0; i <= steps; i++) {
    const v = (niceMax * i) / steps;
    const y = padding + innerH * (1 - v / niceMax);
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // small tick on the Y axis
    ctx.beginPath();
    ctx.moveTo(padding - 4, y);
    ctx.lineTo(padding, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(0), padding - 6, y);
  }
  return niceMax;
}
function drawXLabels(ctx, labels, padding) {
  const axis =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--axis")
      .trim() || "#2a3144";
  ctx.fillStyle = axis;
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const w = ctx.canvas.width;
  const innerW = w - padding * 2;
  const n = labels.length;
  if (!n) return;
  const step = Math.max(1, Math.floor(n / 8)); // show ~8 labels max
  for (let i = 0; i < n; i += step) {
    const x = padding + (i / Math.max(1, n - 1)) * innerW;
    // small tick on X axis
    ctx.beginPath();
    ctx.moveTo(x, ctx.canvas.height - padding);
    ctx.lineTo(x, ctx.canvas.height - padding + 4);
    ctx.stroke();
    ctx.fillText(labels[i], x, ctx.canvas.height - padding + 6);
  }
}
function drawBars(ctx, values, labels) {
  const pad = 32,
    w = ctx.canvas.width,
    h = ctx.canvas.height;
  clearCanvas(ctx);
  drawAxes(ctx, pad);
  const max = Math.max(1, ...values);
  const innerW = w - pad * 2,
    innerH = h - pad * 2;
  const niceMax = drawYTicks(ctx, max, pad);
  const barW = Math.max(2, Math.floor(innerW / Math.max(1, values.length)));
  values.forEach((v, i) => {
    const x = pad + i * barW;
    const y = pad + innerH * (1 - v / niceMax);
    const bh = innerH * (v / niceMax);
    ctx.fillStyle = "#7aa2ff";
    ctx.fillRect(x + 1, y, barW - 2, bh);
  });
  if (labels && labels.length) drawXLabels(ctx, labels, pad);
}
function drawLine(ctx, values, labels) {
  const pad = 32,
    w = ctx.canvas.width,
    h = ctx.canvas.height;
  clearCanvas(ctx);
  drawAxes(ctx, pad);
  const finiteVals = values.filter((v) => v != null);
  const max = Math.max(1, ...finiteVals);
  const innerW = w - pad * 2,
    innerH = h - pad * 2;
  const niceMax = drawYTicks(ctx, max, pad);
  ctx.strokeStyle = "#5ee1a7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * innerW;
    if (v == null) {
      return;
    }
    const y = pad + innerH * (1 - v / niceMax);
    if (i === 0 || values[i - 1] == null) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  if (labels && labels.length) drawXLabels(ctx, labels, pad);
}

// Render analytics (KPIs + charts)
function renderAnalytics() {
  const data = analyticsData();
  // KPIs
  const toEU = (iso) =>
    typeof formatDateEU === "function" ? formatDateEU(iso) : iso || "—";
  const elTotal = document.getElementById("kpiTotalKg");
  if (elTotal) elTotal.textContent = (data.totalKg || 0).toFixed(2);
  const elCount = document.getElementById("kpiCount");
  if (elCount) elCount.textContent = String(data.count || 0);
  const elAvg = document.getElementById("kpiAvgKg");
  if (elAvg) elAvg.textContent = (data.avgKg || 0).toFixed(2);
  const elFL = document.getElementById("kpiFirstLast");
  if (elFL)
    elFL.textContent =
      data.first && data.last
        ? `${toEU(data.first)} / ${toEU(data.last)}`
        : "—";
  // Picker salary sum (PYG)
  const sumPicker = (data.rows || []).reduce(
    (s, r) => s + (r.picker_pyg || 0),
    0
  );
  const elPicker = document.getElementById("kpiPickerPYG");
  if (elPicker) elPicker.textContent = toShortPYG(sumPicker);

  // Charts
  const c1 = document.getElementById("chartWeekly");
  const c2 = document.getElementById("chartMA");
  if (c1 && c1.getContext) {
    const ctx1 = c1.getContext("2d");
    const entries = Object.entries(data.buckets).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const vals = entries.map(([, v]) => v);
    const labels = entries.map(([k]) => formatAggKey(k, data.agg));
    drawBars(ctx1, vals, labels);
  }
  if (c2 && c2.getContext) {
    const ctx2 = c2.getContext("2d");
    const dayLabels = data.days.map((d) => {
      // show DD-MM or MM-YY occasionally; keep short
      const [y, m, dd] = d.split("-");
      return `${dd}-${m}`;
    });
    drawLine(ctx2, data.ma, dayLabels);
  }
}

// Boot hooks for analytics
initAnalyticsUI();
renderAnalytics();

// Re-render when new harvests arrive or language changes
document.addEventListener("metrics:updated", () => {
  renderAnalytics();
  renderMixer && renderMixer();
  populatePackageSelect && populatePackageSelect();
});
