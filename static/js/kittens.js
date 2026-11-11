// ---------- Kitten icons: 8 looks, each with its own background colour ----------
const KITTENS = [
  { name: "Orange tabby",  bg: "#fde2c4", fur: "#f4a04a", inner: "#f7b9b0", mark: "stripes", markColor: "#e07f2a" },
  { name: "Grey tabby",    bg: "#d6e6fb", fur: "#b3b9c1", inner: "#f2c4c4", mark: "stripes", markColor: "#7d858e" },
  { name: "Black cat",     bg: "#e6dcf7", fur: "#3d3a44", inner: "#8a6f7a", eye: "#b5d94c", light: true },
  { name: "White cat",     bg: "#fbd8e2", fur: "#fdfcf8", inner: "#f7b9c6", eye: "#7cc0e8" },
  { name: "Calico",        bg: "#fff1b8", fur: "#fdfcf8", inner: "#f7b9b0", mark: "calico" },
  { name: "Siamese",       bg: "#cfeee6", fur: "#f3e6d3", inner: "#c9a48a", mark: "mask", markColor: "#8a6a55", eye: "#6fb6e6" },
  { name: "Tuxedo",        bg: "#ffd9cc", fur: "#3d3a44", inner: "#8a6f7a", mark: "tuxedo", eye: "#f2c14e" },
  { name: "Brown spotted", bg: "#e2efc9", fur: "#b98157", inner: "#f0b8a8", mark: "spots", markColor: "#7e5136" },
];

const OUTLINE = "#4a3328";

function kittenSVG(k) {
  const earL = k.mark === "calico" ? "#f4a04a" : k.mark === "mask" ? k.markColor : k.fur;
  const earR = k.mark === "calico" ? "#3d3a44" : k.mark === "mask" ? k.markColor : k.fur;
  const face = k.light ? "#d9d2df" : OUTLINE;   // features stay visible on dark fur

  const marks = {
    stripes: `<path d="M28 22q1 3 0 6M32 21v7M36 22q-1 3 0 6M13 35h4M51 35h-4" stroke="${k.markColor}" stroke-width="2.2" fill="none"/>`,
    calico:  `<ellipse cx="23" cy="31" rx="7" ry="6" fill="#f4a04a" stroke="none"/>
              <ellipse cx="41" cy="25" rx="5" ry="3.5" fill="#3d3a44" stroke="none"/>`,
    mask:    `<ellipse cx="32" cy="42" rx="10" ry="8" fill="${k.markColor}" stroke="none"/>`,
    tuxedo:  `<path d="M32 27L28 36C20 38 20 50 32 52C44 50 44 38 36 36Z" fill="#fdfcf8" stroke="none"/>`,
    spots:   `<g fill="${k.markColor}" stroke="none"><circle cx="27" cy="25" r="1.8"/><circle cx="33" cy="23" r="2"/><circle cx="38" cy="26" r="1.6"/></g>`,
  }[k.mark] || "";

  const eye = (cx) => k.eye
    ? `<circle cx="${cx}" cy="36" r="3.6" fill="${k.eye}" stroke="none"/>
       <ellipse cx="${cx}" cy="36" rx="1.3" ry="2.8" fill="#221a16" stroke="none"/>
       <circle cx="${cx + 1}" cy="34.6" r="0.9" fill="#fff" stroke="none"/>`
    : `<circle cx="${cx}" cy="36" r="3.3" fill="#221a16" stroke="none"/>
       <circle cx="${cx + 1}" cy="34.8" r="1.1" fill="#fff" stroke="none"/>`;

  return `
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <g stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M14 32L15 10L30 21Z" fill="${earL}"/>
      <path d="M50 32L49 10L34 21Z" fill="${earR}"/>
      <path d="M18 25L18.5 15L26 21Z" fill="${k.inner}" stroke="none"/>
      <path d="M46 25L45.5 15L38 21Z" fill="${k.inner}" stroke="none"/>
      <ellipse cx="32" cy="37" rx="20" ry="16.5" fill="${k.fur}"/>
      ${marks}
      <g class="eyes-open">${eye(25)}${eye(39)}</g>
      <path class="eyes-closed" d="M21.5 36.5q3.5 2.6 7 0M35.5 36.5q3.5 2.6 7 0" fill="none" stroke="${face}" stroke-width="1.8"/>
      <ellipse cx="20" cy="43" rx="3" ry="1.8" fill="#f27c7c" opacity=".45" stroke="none"/>
      <ellipse cx="44" cy="43" rx="3" ry="1.8" fill="#f27c7c" opacity=".45" stroke="none"/>
      <path d="M30.4 41.5h3.2l-1.6 1.9z" fill="#f08a8a" stroke-width="1.2"/>
      <path d="M32 43.4q-1.8 2.2-3.8.8M32 43.4q1.8 2.2 3.8.8" fill="none" stroke="${face}" stroke-width="1.4"/>
      <path d="M17 41l-9-1.5M17 44l-9 1.5M47 41l9-1.5M47 44l9 1.5" fill="none" stroke="${face}" stroke-width="1.2"/>
      <!-- Snooze bubble from the nose -->
      <g class="bubble">
        <circle cx="38.5" cy="43" r="5" fill="#dff2ff" fill-opacity=".85" stroke="#7cbfe0" stroke-width="1"/>
        <circle cx="37" cy="41.5" r="1.2" fill="#fff" stroke="none"/>
      </g>
    </g>
  </svg>`;
}

// ---------- Table rows ----------
const table = document.querySelector(".plan");
const tbody = document.getElementById("kitten-rows");
const dateColumns = Number(table.dataset.dateColumns);
// Random kittens: deal from a shuffled "bag" of all 8 so every look shows up
// before any repeats, and refill it with a fresh shuffle when it runs out.
let bag = [];
let lastKitten = null;

function nextKitten() {
  if (bag.length === 0) {
    bag = [...KITTENS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    // don't repeat the same kitten across the bag boundary
    if (bag[bag.length - 1] === lastKitten) bag.unshift(bag.pop());
  }
  return (lastKitten = bag.pop());
}

const TRASH_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <g class="trash-lid"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></g>
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>`;

// ---------- Rows ----------
// Builds one row. `data` is either a freshly made row or one loaded from storage.
function createRow({ kitten, sleep, delay, expanded = false, dates = [], notes = "" }) {
  const k = KITTENS[kitten];
  const tr = document.createElement("tr");
  tr.dataset.kitten = kitten;
  tr.dataset.sleep = sleep;
  tr.dataset.delay = delay;
  tr.classList.toggle("is-expanded", expanded);
  tr.innerHTML = `
    <td><div class="cell">
      <button class="kitten" type="button" style="--kitten-bg:${k.bg};--sleep:${sleep}s;--delay:-${delay}s"
              aria-expanded="${expanded}" aria-label="${k.name}: expand row" title="${k.name}">
        ${kittenSVG(k)}
        <span class="zzz" aria-hidden="true"><i>Z</i><i>Z</i><i>Z</i></span>
      </button>
    </div></td>
    ${`<td><div class="cell"><span class="date" tabindex="0" title="Click to edit"></span></div></td>`.repeat(dateColumns)}
    <td><div class="cell cell--notes"><textarea class="notes" readonly placeholder="Add notes…"
         aria-label="Notes (double-click to edit)" title="Double-click to edit"></textarea></div></td>
    <td><div class="cell"><button class="trash" type="button" aria-label="Delete ${k.name}" title="Delete row">${TRASH_SVG}</button></div></td>`;

  tr.querySelectorAll(".date").forEach((el, i) => {
    el.dataset.value = formatDate(dates[i] || "");   // re-format so stored text is always just digits + slashes
    renderDate(el);
  });
  tr.querySelector(".notes").value = notes;
  tbody.appendChild(tr);
}

document.getElementById("add-kitten").addEventListener("click", () => {
  playRandomMeow();
  createRow({
    kitten: KITTENS.indexOf(nextKitten()),
    // Each kitten gets its own breathing speed and start offset
    sleep: (2.4 + Math.random() * 2).toFixed(2),
    delay: (Math.random() * 3).toFixed(2),
  });
  saveRows();
});

tbody.addEventListener("click", (e) => {
  // Trash: collapse the row, then remove it
  const trash = e.target.closest(".trash");
  if (trash) {
    const tr = trash.closest("tr");
    playTrashSound();
    tr.classList.add("is-removing");
    setTimeout(() => { tr.remove(); saveRows(); }, 350);
    return;
  }

  // Click a kitten to expand / collapse its row
  const kitten = e.target.closest(".kitten");
  if (!kitten) return;
  playRandomMeow();
  const open = kitten.closest("tr").classList.toggle("is-expanded");
  kitten.setAttribute("aria-expanded", open);
  saveRows();
});

// Clear-all trash in the header. First click arms it ("Clear all?"),
// a second click within 3 seconds clears every row.
const clearAll = document.getElementById("clear-all");
let disarmTimer;

function disarmClearAll() {
  clearTimeout(disarmTimer);
  clearAll.classList.remove("is-armed");
  clearAll.setAttribute("aria-label", "Clear all kittens");
}

clearAll.addEventListener("click", () => {
  const rows = tbody.querySelectorAll("tr:not(.is-removing)");
  if (!rows.length) return;

  if (!clearAll.classList.contains("is-armed")) {
    clearAll.classList.add("is-armed");
    clearAll.setAttribute("aria-label", "Click again to clear all kittens");
    disarmTimer = setTimeout(disarmClearAll, 3000);
    return;
  }

  disarmClearAll();
  playTrashSound();
  rows.forEach((tr) => tr.classList.add("is-removing"));
  setTimeout(() => { rows.forEach((tr) => tr.remove()); saveRows(); }, 350);
});

// Notes save as you type
tbody.addEventListener("input", (e) => {
  if (e.target.classList.contains("notes")) saveRows();
});

// Single-click a date to edit it
tbody.addEventListener("click", (e) => {
  const date = e.target.closest(".date");
  if (date) editDate(date);
});

// Double-click notes to edit them; clicking out locks them again
tbody.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("notes")) editNotes(e.target);
});
tbody.addEventListener("focusout", (e) => {
  if (e.target.classList.contains("notes")) e.target.readOnly = true;
});

// Keyboard: Enter opens a date or the notes for editing, Escape finishes notes
tbody.addEventListener("keydown", (e) => {
  const el = e.target;
  if (e.key === "Enter" && el.classList.contains("date")) editDate(el);
  if (el.classList.contains("notes")) {
    if (e.key === "Enter" && el.readOnly) { e.preventDefault(); editNotes(el); }
    if (e.key === "Escape") el.blur();
  }
});

function editNotes(el) {
  el.readOnly = false;
  el.focus();
  el.setSelectionRange(el.value.length, el.value.length);   // cursor at the end
}

// ---------- Dates ----------
function renderDate(el) {
  const value = el.dataset.value || "";
  el.classList.toggle("is-empty", !value);
  // value only ever holds digits and slashes, so this is safe
  el.innerHTML = (value || "MM/DD/YY").split("/").join('<span class="slash">/</span>');
}

function formatDate(raw) {
  const d = String(raw).replace(/\D/g, "").slice(0, 6);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6)].filter(Boolean).join("/");
}

function editDate(el) {
  const input = document.createElement("input");
  input.className = "date-input";
  input.value = el.dataset.value || "";
  input.placeholder = "MM/DD/YY";
  input.maxLength = 8;
  input.inputMode = "numeric";

  input.addEventListener("input", () => { input.value = formatDate(input.value); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") { input.value = el.dataset.value || ""; input.blur(); }
  });
  input.addEventListener("blur", () => {          // clicking out saves it
    el.dataset.value = input.value;
    renderDate(el);
    input.replaceWith(el);
    saveRows();
  });

  el.replaceWith(input);
  input.focus();
}

// ---------- Saving in the browser (localStorage) ----------
// Everything lives on this device/browser only. Storage can be unavailable
// (e.g. some private modes), so every read/write is wrapped in try/catch.
const STORAGE_KEY = "dentalKitten.rows.v1";

function saveRows() {
  const rows = [...tbody.querySelectorAll("tr:not(.is-removing)")].map((tr) => ({
    kitten: Number(tr.dataset.kitten),
    sleep: tr.dataset.sleep,
    delay: tr.dataset.delay,
    expanded: tr.classList.contains("is-expanded"),
    // a date being edited right now is an <input>; keep its last saved value
    dates: [...tr.querySelectorAll("td")].slice(1, 1 + dateColumns).map((td) => {
      const span = td.querySelector(".date");
      return span ? span.dataset.value || "" : "";
    }),
    notes: tr.querySelector(".notes").value,
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch { /* storage full or blocked: keep working, just unsaved */ }
}

function loadRows() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { /* nothing saved, or unreadable */ }
  if (!Array.isArray(rows)) return;

  for (const row of rows) {
    if (!KITTENS[row?.kitten]) continue;           // skip anything malformed
    createRow({
      kitten: row.kitten,
      sleep: Number(row.sleep) || 3,
      delay: Number(row.delay) || 0,
      expanded: row.expanded === true,
      dates: Array.isArray(row.dates) ? row.dates : [],
      notes: typeof row.notes === "string" ? row.notes : "",
    });
  }
  // so the next new kitten isn't the same as the last saved one
  if (rows.length) lastKitten = KITTENS[rows[rows.length - 1].kitten] ?? null;
}

loadRows();
