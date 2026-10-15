addScreen({
  id: "cover", order: 100, group: "01 Cover", title: "Cover",
  links: [["Design system", "foundations"], ["Components", "components"], ["Login", "login"], ["User dashboard", "dashboard"], ["Admin dashboard", "admin-dashboard"]],
  render() {
    const tiles = screenGroups().filter((g) => g.name !== "01 Cover").map((g) => `<a data-nav="${g.items[0].id}" href="#${g.items[0].id}"><small>${g.name.split(" ").slice(0, 1)}</small><strong>${g.name.replace(/^\d+\s/, "")}</strong></a>`).join("");
    return `<div class="spec-board">
      <div class="side-head" style="padding:0"><span class="mark">N</span><span><span class="brand-name">NCC_DSA</span><span class="brand-sub">Platform</span></span></div>
      <div>
        <p class="kicker">Visual specification</p>
        <h1>A complete interface for practice, contests, and account standing.</h1>
        <p class="secondary" style="margin-top:8px;max-width:62ch">Use the page list to move through every screen. Switch theme and width from the toolbar. Sample student: Ibrahim Kedir.</p>
      </div>
      <div class="grid-3">
        <article class="card"><h3>Clear first</h3><p class="secondary" style="margin-top:6px">Status, rating, and the next action stay ahead of history.</p></article>
        <article class="card"><h3>Both themes</h3><p class="secondary" style="margin-top:6px">Light for rooms. Dark for long practice sessions.</p></article>
        <article class="card"><h3>Four widths</h3><p class="secondary" style="margin-top:6px">1440, 1280, 768, and 390. Layouts change; they do not only scale.</p></article>
      </div>
      <div class="page-index">${tiles}</div>
    </div>`;
  },
});

addScreen({
  id: "foundations", order: 200, group: "02 Design system", title: "Foundations",
  links: [["Components", "components"]],
  render() {
    const light = [["Primary", "#0F6E56", "Actions, links, focus"], ["Secondary", "#1B3A4B", "Secondary actions"], ["Background", "#F3F5F8", "Page background"], ["Surface", "#FFFFFF", "Bars and inputs"], ["Card", "#FFFFFF", "Cards"], ["Border", "#E1E6EE", "Dividers"], ["Text", "#12161F", "Primary text"], ["Text secondary", "#3E4A5C", "Supporting text"], ["Muted", "#5C687A", "Captions"], ["Success", "#0F7A3A", "Positive"], ["Warning", "#8A5A00", "Caution"], ["Error", "#B4232C", "Errors"], ["Information", "#1D5BBF", "Informational"]];
    const dark = [["Primary", "#3DDC97", "Actions, links, focus"], ["Secondary", "#243447", "Secondary actions"], ["Background", "#0C1117", "Page background"], ["Surface", "#121922", "Bars and inputs"], ["Card", "#171F2A", "Cards"], ["Border", "#2A3544", "Dividers"], ["Text", "#E7EDF4", "Primary text"], ["Text secondary", "#C5D0DE", "Supporting text"], ["Muted", "#96A3B5", "Captions"], ["Success", "#3DDC97", "Positive"], ["Warning", "#F0B429", "Caution"], ["Error", "#FF8B95", "Errors"], ["Information", "#9DC2FF", "Informational"]];
    const sw = (rows) => rows.map(([n, h, r]) => `<div class="swatch-row"><i style="background:${h}"></i><div><strong>${n}</strong> <span class="mono">${h}</span><div class="caption">${r}</div></div></div>`).join("");
    const type = [["Display", "40 / 48 · 600", "display"], ["H1", "28 / 34 · 600", "h1"], ["H2", "22 / 28 · 600", "h2"], ["H3", "18 / 26 · 600", "h3"], ["Body large", "18 / 28 · 400", "bl"], ["Body", "15 / 24 · 400", "b"], ["Body small", "13 / 20 · 400", "bs"], ["Caption", "12 / 16 · 500", "c"], ["Button", "14 / 20 · 600", "btn"], ["Label", "13 / 16 · 600", "lb"], ["Code", "13 / 20 · mono", "code"]];
    const shown = { display: `<div style="font-size:40px;line-height:48px;font-weight:600;letter-spacing:-.03em">Rating 4.27</div>`, h1: `<h1 style="font-size:28px">Welcome back, Ibrahim</h1>`, h2: `<h2 style="font-size:22px">Upcoming lectures</h2>`, h3: `<h3 style="font-size:18px">Dynamic Programming</h3>`, bl: `<p style="font-size:18px">Practice. Compete. Keep the record.</p>`, b: `<p>Attendance is currently open.</p>`, bs: `<p style="font-size:13px">Showing 21–40 of 124</p>`, c: `<p class="caption">Last qualifying activity</p>`, btn: `<span style="font-weight:600;font-size:14px">Join live session</span>`, lb: `<span style="font-weight:600;font-size:13px">Email</span>`, code: `<span class="mono">ibrahimkediramdela2211</span>` };
    const space = [["4", "Icon gap"], ["8", "Tight stack"], ["12", "Table cell y"], ["16", "Form fields, mobile page padding"], ["24", "Section gap, modal padding"], ["32", "Desktop page padding"], ["40", "Large section"], ["48", "Auth panel"], ["64", "Cover sections"]];
    return `<div class="spec-board">
      <div><p class="kicker">Foundations</p><h1>Color, type, spacing</h1><p class="secondary">IBM Plex Sans for UI. IBM Plex Mono for handles, codes, and scores. Toggle the toolbar to preview both themes on real screens.</p></div>
      <div class="swatch-grid"><article class="card"><h2>Light</h2>${sw(light)}</article><article class="card"><h2>Dark</h2>${sw(dark)}</article></div>
      <article class="card"><h2>Type</h2>${type.map(([n, m, k]) => `<div class="type-row"><div><strong>${n}</strong><div class="caption">${m}</div></div><div>${shown[k]}</div></div>`).join("")}</article>
      <article class="card"><h2>Spacing</h2><p class="caption">8px base. 4px only for icon gaps and compact table padding.</p>${space.map(([n, use]) => `<div class="space-row"><span class="mono">${n}</span><div class="space-bar" style="width:${n}px"></div><span>${use}</span></div>`).join("")}</article>
      <div class="grid-3">
        <article class="card"><h3>Radius</h3><p class="caption">Controls 8 · Cards 12 · Modals 16</p></article>
        <article class="card"><h3>Shadow</h3><p class="caption">One soft card shadow. No glass, no heavy glow.</p></article>
        <article class="card"><h3>Icons</h3><div class="cluster" style="margin-top:8px">${["dashboard", "megaphone", "book", "check", "trophy", "chart", "user", "bell", "search", "alert", "lock", "flame"].map((n) => `<span title="${n}">${icon(n)}</span>`).join("")}</div></article>
      </div>
    </div>`;
  },
});

addScreen({
  id: "components", order: 300, group: "03 Components", title: "Components",
  links: [["Login", "login"]],
  render() {
    const kinds = [["published", "Published"], ["draft", "Draft"], ["active", "Active"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["solved", "Solved"], ["unsolved", "Not solved"], ["pending", "Verification pending"], ["failed", "Verification failed"], ["restricted", "Restricted"], ["active-account", "Active account"], ["warning", "Warning"], ["live", "Live"]];
    return `<div class="spec-board">
      <div><p class="kicker">Components</p><h1>Reusable parts</h1><p class="secondary">Names match the build: Button/Primary, Input/Text, Badge/Warning, Modal/Confirmation.</p></div>
      <article class="card stack"><p class="component-label">Button/Primary · Secondary · Outline · Ghost · Danger · Success</p>
        <div class="cluster">${btn("Primary")}${btn("Secondary", { variant: "secondary" })}${btn("Outline", { variant: "outline" })}${btn("Ghost", { variant: "ghost" })}${btn("Danger", { variant: "danger" })}${btn("Success", { variant: "success" })}</div>
        <div class="cluster">${btn("Small", { size: "sm" })}${btn("Medium")}${btn("Large", { size: "lg" })}${btn("Disabled", { disabled: true })}${btn("Loading", { loading: true })}</div>
      </article>
      <article class="card"><p class="component-label">Input states</p><div class="form-grid">
        ${field({ label: "Text", value: "", placeholder: "Lecture title" })}
        ${field({ label: "Email", type: "email", value: "ibrahim.kedir@ncc.edu" })}
        ${field({ label: "Password", type: "password", value: "password" })}
        ${field({ label: "Focus", value: "Binary search", focus: true })}
        ${field({ label: "Number", type: "number", value: "10" })}
        ${field({ label: "URL", type: "url", placeholder: "https://codeforces.com/contest/123456" })}
        ${field({ label: "Date", type: "date", value: "2026-10-17" })}
        ${field({ label: "Time", type: "time", value: "14:00" })}
        ${field({ label: "Select", type: "select", value: "Codeforces", options: ["Codeforces", "LeetCode"] })}
        ${field({ label: "Error", value: "ibrahim", error: "Enter a valid email address." })}
        ${field({ label: "Success", value: "ibrahim.kedir@ncc.edu", success: "Email is available." })}
        ${field({ label: "Disabled", value: "Locked field", disabled: true })}
        <div class="span-2">${field({ label: "Textarea", type: "textarea", value: "States, transitions, and how to read a DP problem before coding." })}</div>
      </div></article>
      <article class="card"><p class="component-label">Badge</p><div class="cluster">${kinds.map(([k, l]) => badge(k, l)).join("")}</div></article>
      <div class="grid-2">
        <article class="card"><p class="component-label">Card/Rating</p><p class="stat-label">NCC_DSA rating</p><p class="stat-value num">4.27 / 5.00</p><div style="margin-top:8px">${stars(4.27)}</div><p class="stat-hint up">+0.32 this period</p></article>
        <article class="card"><p class="component-label">Card/Streak</p><p class="stat-label">Current streak</p><p class="stat-value">12 days</p><p class="stat-hint">Longest streak · 21 days</p></article>
      </div>
      <article class="card"><p class="component-label">Table/ContestResult · selected and current-user rows</p>${smartTable(["Rank", "Participant", "Handle", "Score", "Penalty"], [{ cells: ["#11", "Abel Girma", "abel_g", "760", "1120"], className: "is-selected" }, { cells: ["#12", "Ibrahim Kedir", "ibrahimkediramdela2211", "742", "1240"], className: "is-me" }])}</article>
      <div class="grid-2">
        <div class="stack"><p class="component-label">Toast</p>${[["ok", "Announcement published"], ["bad", "Failed to publish announcement"], ["warn", "Rating is approaching the restriction threshold"], ["", "Contest results are being processed"]].map(([t, m]) => `<div class="toast ${t}"><div><strong>${m}</strong></div></div>`).join("")}</div>
        <div><p class="component-label">Modal/Confirmation</p><div class="modal" style="width:100%"><h2>Delete announcement?</h2><p>This action cannot be undone.</p><div class="modal-actions">${btn("Cancel", { variant: "outline" })}${btn("Delete", { variant: "danger" })}</div></div></div>
      </div>
      <article class="card"><p class="component-label">Pagination · Skeleton · OTP</p><div class="stack">${pager("Showing 21–40 of 124")}<div class="skeleton sk-lg"></div><div class="skeleton"></div>${otp(4, "Sample code")}</div></article>
    </div>`;
  },
});

addScreen({
  id: "responsive", order: 2800, group: "28 Responsive design", title: "Behavior by width",
  note: "Use the width control to preview any screen. These are the layout rules.",
  links: [["Dashboard", "dashboard"], ["Mobile navigation", "mobile-nav"]],
  render() {
    const rules = [
      ["1440 Desktop", "Sidebar fixed at 248px. Tables. Two-column forms. Auth brand panel visible."],
      ["1280 Laptop", "Same structure. Stats wrap if five columns no longer fit."],
      ["768 Tablet", "Sidebar becomes a drawer. Tables become cards. Forms become one column."],
      ["390 Mobile", "Drawer, single column, modal as a bottom sheet, 44px code boxes, primary actions full width in forms."],
    ];
    return `<div class="spec-board"><p class="kicker">Responsive</p><h1>Width changes the layout</h1><div class="grid-2">${rules.map(([t, b]) => `<article class="card"><h3>${t}</h3><p class="secondary" style="margin-top:6px">${b}</p></article>`).join("")}</div>
      <article class="card stack"><h2>What changes</h2><p>Navigation: sidebar to drawer, opened from the menu button.</p><p>Tables: card list under 800px, with the column name on each line.</p><p>Cards and forms: one column. Page padding 32 → 16.</p><p>Modals: centered on desktop, bottom sheet on a phone.</p><p>Buttons: keep 32 / 40 / 48 heights. Form submits stretch to the card width.</p></article>
    </div>`;
  },
});

addScreen({
  id: "mobile-nav", order: 2810, group: "28 Responsive design", title: "Mobile navigation open",
  note: "Preview at 390. The drawer is open.",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", navOpen: true, crumbs: [["Dashboard"]], content: pageHead("Welcome back, Ibrahim", "The menu covers the page until it is closed.") + `<article class="card"><p>Tap the dimmed area or a destination to leave the menu.</p></article>` });
  },
});

function flow(steps) {
  return `<div class="flow">${steps.map((s, i) => `${i ? '<div class="flow-arrow"></div>' : ""}<a class="flow-step" data-nav="${s[1]}" href="#${s[1]}">${s[0]}<small>${s[2] || ""}</small></a>`).join("")}</div>`;
}

addScreen({
  id: "user-flow", order: 2900, group: "29 User flow", title: "User journey",
  links: [["Login", "login"], ["Dashboard", "dashboard"]],
  render() {
    const steps = [["Register", "register"], ["Login", "login"], ["User dashboard", "dashboard"], ["Announcement", "announcements"], ["Lecture", "lecture-detail"], ["Live session", "lecture-live"], ["Attendance", "attendance-code"], ["Contest", "contest-detail"], ["Contest result", "results"], ["Progress sheet", "progress"], ["Problem", "problem"], ["I solved this", "verify-pending"], ["Verification", "verify-ok"], ["Rating", "rating"], ["Streak", "streak"], ["Warning", "rating-warning"], ["Restriction", "restricted"], ["Admin review", "admin-restricted"], ["Reopen access", "admin-reopen"]];
    return `<div class="spec-board"><p class="kicker">User flow</p><h1>From registration to restored access</h1><p class="secondary">Each step opens that screen. Restriction is the locked state. Reopen is an admin action.</p>${flow(steps)}</div>`;
  },
});

addScreen({
  id: "admin-flow", order: 3000, group: "30 Admin flow", title: "Admin journey",
  links: [["Admin login", "admin-login"], ["Admin dashboard", "admin-dashboard"]],
  render() {
    return `<div class="spec-board"><p class="kicker">Admin flow</p><h1>Run the platform from one shell</h1>
      ${flow([["Admin login", "admin-login"], ["Admin dashboard", "admin-dashboard"], ["Manage users", "admin-users"]])}
      <div class="flow-branch" style="margin-top:16px">
        ${[["Lectures", "admin-lectures"], ["Start attendance", "admin-attendance-start"], ["Announcements", "admin-announcements"], ["Contests", "admin-contests"], ["Fetch results", "admin-results"], ["Publish results", "admin-results-publish"], ["Problems", "admin-problems"], ["Progress", "admin-progress"], ["Rating", "admin-rating"], ["Restricted users", "admin-restricted"], ["Reopen account", "admin-reopen"]].map(([t, id]) => `<a class="flow-step" data-nav="${id}" href="#${id}">${t}</a>`).join("")}
      </div>
    </div>`;
  },
});

addScreen({
  id: "prototype", order: 3100, group: "31 Prototype", title: "Prototype map",
  render() {
    const rows = [...SCREENS].filter((s) => s.links && s.links.length).sort((a, b) => a.order - b.order).map((s) => `<div class="list-row"><div><strong>${s.title}</strong><div class="caption">${s.group}</div></div><div class="cluster">${s.links.map(([label, id]) => `<a class="btn btn-outline btn-sm" data-nav="${id}" href="#${id}">${label}</a>`).join("")}</div></div>`).join("");
    return `<div class="spec-board"><p class="kicker">Prototype</p><h1>Where each control goes</h1><p class="secondary">Buttons inside screens navigate. This list is the same map.</p><article class="card">${rows}</article></div>`;
  },
});

addScreen({
  id: "states", order: 2700, group: "27 Error and empty states", title: "State index",
  links: [["Network", "network-error"], ["Empty announcements", "announcements-empty"], ["Verification failed", "verify-fail"]],
  render() {
    const items = [
      ["No announcements yet.", "announcements-empty"],
      ["No lectures available.", "lectures-empty"],
      ["No contests available.", "contests-empty"],
      ["No results available yet.", "results-empty"],
      ["No problems found.", "problems-empty"],
      ["No verified problems yet.", "progress-empty"],
      ["No rating history yet.", "rating-empty"],
      ["Something went wrong.", "network-error"],
      ["Unauthorized.", "unauthorized"],
      ["Session expired.", "session-expired"],
      ["Not found.", "not-found"],
      ["Forbidden.", "forbidden"],
    ];
    return `<div class="spec-board"><p class="kicker">States</p><h1>Empty, error, and system screens</h1><div class="grid-2">${items.map(([t, id]) => `<a class="card" data-nav="${id}" href="#${id}" style="text-decoration:none;color:inherit"><strong>${t}</strong><div class="caption">Open screen</div></a>`).join("")}</div></div>`;
  },
});

addScreen({
  id: "network-error", order: 2710, group: "27 Error and empty states", title: "Network and server error",
  links: [["Try again", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", crumbs: [["Dashboard"]], content: `<div class="card status-panel"><h2>Something went wrong</h2><p class="secondary">We couldn't load this information.</p>${btn("Try again", { nav: "dashboard" })}</div>` });
  },
});

addScreen({
  id: "not-found", order: 2720, group: "27 Error and empty states", title: "Not found",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", crumbs: [["Not found"]], content: `<div class="card status-panel"><h2>Page not found</h2><p class="secondary">That link does not match a page in NCC_DSA.</p>${btn("Back to dashboard", { variant: "outline", nav: "dashboard" })}</div>` });
  },
});

addScreen({
  id: "forbidden", order: 2730, group: "27 Error and empty states", title: "Forbidden",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", crumbs: [["Forbidden"]], content: `<div class="card status-panel"><h2>You do not have access</h2><p class="secondary">This area is limited to administrators.</p>${btn("Back to dashboard", { variant: "outline", nav: "dashboard" })}</div>` });
  },
});
