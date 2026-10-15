let theme = "dark";
let width = 1440;
let current = "cover";

try {
  theme = localStorage.getItem("ncc-dsa-theme") || theme;
  width = Number(localStorage.getItem("ncc-dsa-width")) || width;
} catch (err) { /* keep defaults */ }

function go(id) {
  if (!getScreen(id)) id = "cover";
  current = id;
  if (location.hash.slice(1) !== id) location.hash = id;
  render();
}

function renderNav(screen) {
  const q = (document.getElementById("v-search")?.value || "").trim().toLowerCase();
  const nav = document.getElementById("viewer-nav");
  const groups = screenGroups().map((g) => {
    const items = g.items.filter((s) => !q || `${s.title} ${s.group}`.toLowerCase().includes(q));
    if (!items.length) return "";
    return `<div class="v-group">${g.name}</div>${items.map((s) => `<a class="v-link${s.id === screen.id ? " is-current" : ""}" data-nav="${s.id}" href="#${s.id}">${s.title}</a>`).join("")}`;
  }).join("");
  const previous = document.getElementById("v-search");
  const keep = document.activeElement === previous;
  const pos = keep ? previous.selectionStart : 0;
  nav.innerHTML = `<p class="viewer-kicker">NCC_DSA</p><strong style="display:block;margin-bottom:10px">Visual specification</strong><label class="sr-only" for="v-search">Find a screen</label><input id="v-search" class="v-search" placeholder="Find a screen" value="${q.replace(/"/g, "&quot;")}" />${groups}`;
  if (keep) {
    const input = document.getElementById("v-search");
    input.focus();
    input.setSelectionRange(pos, pos);
  }
}

function render() {
  const screen = getScreen(current) || getScreen("cover");
  current = screen.id;
  const canvas = document.getElementById("viewer-canvas");
  canvas.innerHTML = `<div id="frame-scale"><div class="artboard" data-theme="${theme}" style="width:${width}px">${screen.render()}</div></div>`;
  fit();
  renderNav(screen);
  const bar = document.getElementById("viewer-bar");
  const widths = [1440, 1280, 768, 390];
  const labels = { 1440: "1440", 1280: "1280", 768: "768", 390: "390" };
  bar.innerHTML = `<div class="viewer-title"><p class="viewer-kicker">${screen.group}</p><strong>${screen.title}</strong>${screen.note ? `<em>${screen.note}</em>` : ""}</div><div class="cluster"><div class="seg" role="group" aria-label="Frame width">${widths.map((w) => `<button type="button" data-width="${w}" class="${w === width ? "on" : ""}">${labels[w]}</button>`).join("")}</div><div class="seg" role="group" aria-label="Theme"><button type="button" data-theme-set="light" class="${theme === "light" ? "on" : ""}">Light</button><button type="button" data-theme-set="dark" class="${theme === "dark" ? "on" : ""}">Dark</button></div></div>`;
  const links = document.getElementById("viewer-links");
  links.innerHTML = `<span>Prototype</span>${(screen.links || []).map(([label, id]) => `<a class="proto-link" data-nav="${id}" href="#${id}">${label}</a>`).join("")}`;
  const currentLink = document.querySelector(`#viewer-nav .is-current`);
  if (currentLink) currentLink.scrollIntoView({ block: "nearest" });
}

function fit() {
  const canvas = document.getElementById("viewer-canvas");
  const wrap = document.getElementById("frame-scale");
  const board = wrap.querySelector(".artboard");
  const scale = Math.min(1, (canvas.clientWidth - 48) / width);
  board.style.transform = `scale(${scale})`;
  board.style.transformOrigin = "top left";
  wrap.style.width = `${width * scale}px`;
  wrap.style.height = `${board.offsetHeight * scale}px`;
}

document.body.addEventListener("click", (e) => {
  const widthBtn = e.target.closest("[data-width]");
  if (widthBtn) {
    width = Number(widthBtn.dataset.width);
    try { localStorage.setItem("ncc-dsa-width", String(width)); } catch (err) {}
    render();
    return;
  }
  const themeBtn = e.target.closest("[data-theme-set]");
  if (themeBtn) {
    theme = themeBtn.dataset.themeSet;
    try { localStorage.setItem("ncc-dsa-theme", theme); } catch (err) {}
    render();
    return;
  }
  const nav = e.target.closest("[data-nav]");
  if (nav) {
    if (nav.dataset.topic) STATE.topic = nav.dataset.topic;
    e.preventDefault();
    go(nav.dataset.nav);
    document.getElementById("viewer-canvas").scrollTop = 0;
    return;
  }
  const pw = e.target.closest("[data-toggle-password]");
  if (pw) {
    const input = document.getElementById(pw.dataset.togglePassword);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    pw.setAttribute("aria-label", show ? "Hide password" : "Show password");
    pw.setAttribute("aria-pressed", String(show));
  }
  if (e.target.closest("[data-action='toggle-nav']")) e.target.closest(".app")?.classList.toggle("nav-open");
  if (e.target.closest("[data-action='close-nav']")) e.target.closest(".app")?.classList.remove("nav-open");
  const kebab = e.target.closest("[data-action='menu']");
  if (kebab) {
    const menu = kebab.closest(".menu");
    document.querySelectorAll(".artboard .menu.open").forEach((m) => { if (m !== menu) m.classList.remove("open"); });
    menu.classList.toggle("open");
  }
  if (e.target.closest("[data-action='open-filter']")) document.querySelector(".artboard .drawer-root")?.removeAttribute("hidden");
  if (e.target.closest("[data-action='close-filter']")) document.querySelector(".artboard .drawer-root")?.setAttribute("hidden", "");
});

document.body.addEventListener("input", (e) => {
  if (e.target.id === "v-search") {
    renderNav(getScreen(current));
    return;
  }
  const input = e.target;
  if (!input.closest(".otp")) return;
  input.value = input.value.replace(/\D/g, "").slice(0, 1);
  if (input.value && input.nextElementSibling) input.nextElementSibling.focus();
});

document.body.addEventListener("keydown", (e) => {
  const input = e.target;
  if (!input.closest || !input.closest(".otp")) return;
  if (e.key === "Backspace" && !input.value && input.previousElementSibling) input.previousElementSibling.focus();
});

document.body.addEventListener("submit", (e) => {
  if (e.target.closest(".artboard")) e.preventDefault();
});

window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1) || "cover";
  if (id !== current) go(id);
});
window.addEventListener("resize", fit);

current = location.hash.slice(1) || "cover";
render();
