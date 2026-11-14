// ---------- Notes pages: bottom-left lock, page buttons, copy-on-tap ----------
// Locked: just the red lock. Tap it and a password box slides out; Enter (or tapping away) checks it.
// Wrong: the box shakes and slides back. Right: the lock opens and the page buttons appear
// (cat = planning table, 1 = oral hygiene, 2 = note templates, 3 = injections).
// The notes come from the server (POST /notes) only with the right password, and are removed again on lock.
const notesNav = document.getElementById("notes-nav");
const lockBtn = document.getElementById("lock-btn");
const lockInput = document.getElementById("lock-input");
const pageBtns = document.getElementById("page-btns");
const notesPages = document.getElementById("notes-pages");
const planWrap = document.getElementById("plan");
const badge = document.getElementById("badge");
const copyToast = document.getElementById("copy-toast");

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
let unlocked = false;
let busy = false;   // checking a password, or shaking after a wrong one

document.body.dataset.page = "plan";

function setAsking(on) {
  notesNav.classList.toggle("is-asking", on);
  lockInput.tabIndex = on ? 0 : -1;
  if (on) lockInput.focus();   // in the tap itself, so iPad shows the keyboard
  else lockInput.value = "";
}

// While the box is open, pressing the lock mustn't blur it first (that would check the password twice)
lockBtn.addEventListener("mousedown", (e) => {
  if (notesNav.classList.contains("is-asking")) e.preventDefault();
});
lockBtn.addEventListener("click", () => {
  if (busy) return;
  if (unlocked) lock();
  else if (notesNav.classList.contains("is-asking")) tryPassword();
  else setAsking(true);
});
lockInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); tryPassword(); }
  if (e.key === "Escape") { setAsking(false); lockInput.blur(); }
});
lockInput.addEventListener("blur", () => {   // clicking off counts as entering it
  if (notesNav.classList.contains("is-asking") && !busy) tryPassword();
});

async function tryPassword() {
  if (busy) return;
  const password = lockInput.value.trim();
  if (!password) { setAsking(false); lockInput.blur(); return; }
  busy = true;
  let html = null;
  try {
    const res = await fetch("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) html = await res.text();
  } catch { /* offline: stays locked */ }
  if (html === null) return wrongPassword();

  notesPages.innerHTML = html;
  unlocked = true;
  setAsking(false);
  lockInput.blur();
  busy = false;
  notesNav.classList.add("is-unlocked");
  pageBtns.inert = false;
  lockBtn.setAttribute("aria-label", "Lock notes");
  lockBtn.title = "Lock notes";
  markActive();
}

function wrongPassword() {
  notesNav.classList.add("is-wrong");   // shake
  setTimeout(() => {
    notesNav.classList.remove("is-wrong");
    setAsking(false);
    lockInput.blur();
    busy = false;
  }, reduceMotion.matches ? 0 : 450);
}

function lock() {
  unlocked = false;
  showPage("plan");
  notesPages.innerHTML = "";   // the notes leave the page until the password is entered again
  notesNav.classList.remove("is-unlocked");
  pageBtns.inert = true;
  lockBtn.setAttribute("aria-label", "Unlock notes");
  lockBtn.title = "Unlock notes";
}

pageBtns.addEventListener("click", (e) => {
  const btn = e.target.closest(".page-btn");
  if (btn) showPage(btn.dataset.page);
});

function markActive() {
  pageBtns.querySelectorAll(".page-btn").forEach((btn) => {
    const on = btn.dataset.page === document.body.dataset.page;
    btn.classList.toggle("is-active", on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}

// Switch between the planning table and a notes page. The logo slides left (title beside it)
// on notes pages and back to the middle for the table; the new page fades up into place.
function showPage(page, animate = true) {
  if (page === document.body.dataset.page) return;
  const section = notesPages.querySelector(`.note-page[data-page="${page}"]`);
  if (page !== "plan" && !section) return;
  clearTimeout(swap);   // a pending "Plan your day!" swap from the Plan button mustn't overwrite the title

  const change = () => {
    document.body.dataset.page = page;
    notesPages.querySelectorAll(".note-page").forEach((s) => { s.hidden = s !== section; });
    heading.classList.remove("is-fading");
    if (page === "plan") heading.innerHTML = '<span class="today-colour">Plan</span> your day!';
    else heading.textContent = section.dataset.title;
    markActive();
  };
  if (!animate || reduceMotion.matches) return change();

  window.scrollTo(0, 0);
  // FLIP: measure, change the layout, then animate each element from where it was
  const moving = [badge, heading];
  const before = moving.map((el) => el.getBoundingClientRect());
  change();
  const ease = "cubic-bezier(.65, 0, .35, 1)";
  moving.forEach((el, i) => {
    const after = el.getBoundingClientRect();
    const from = `translate(${before[i].left - after.left}px, ${before[i].top - after.top}px)`;
    const fade = el === heading ? [{ opacity: 0 }, { opacity: 1 }] : [{}, {}];
    el.animate([{ transform: from, ...fade[0] }, { transform: "none", ...fade[1] }], { duration: 650, easing: ease });
  });
  (section || planWrap).animate(
    [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }],
    { duration: 450, delay: 200, easing: "ease", fill: "backwards" },
  );
}

// ---------- Copy on tap ----------
notesPages.addEventListener("click", (e) => {
  const el = e.target.closest("[data-copy]");
  if (el && !String(getSelection())) copyFrom(el);   // not when the tap was selecting text
});
notesPages.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-copy]")) {
    e.preventDefault();
    copyFrom(e.target);
  }
});

async function copyFrom(el) {
  const ok = await copyText(el.dataset.copy);
  el.classList.remove("is-copied");
  void el.offsetWidth;   // restart the flash if it's tapped again quickly
  if (ok) el.classList.add("is-copied");
  showToast(ok ? "Copied!" : "Couldn't copy, select the text instead");
}

// navigator.clipboard only exists on https / localhost; over plain http (e.g. an iPad on the
// local network) fall back to selecting a hidden textarea and copying that
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* fall back */ }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
  document.body.append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* not allowed */ }
  ta.remove();
  return ok;
}

let toastTimer;
function showToast(message) {
  copyToast.textContent = message;
  copyToast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => copyToast.classList.remove("is-shown"), 1400);
}
