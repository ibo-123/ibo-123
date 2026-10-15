function admin(active, crumbsItems, content, extra = {}) {
  return appShell({ role: "admin", active, crumbs: crumbsItems, content, ...extra });
}

addScreen({
  id: "admin-dashboard", order: 1600, group: "16 Admin dashboard", title: "Overview",
  links: [["Users", "admin-users"], ["Lectures", "admin-lectures"], ["Contests", "admin-contests"], ["Problems", "admin-problems"], ["Rating", "admin-rating"], ["Restricted", "admin-restricted"]],
  render() {
    const stats = [["Students", "128"], ["Active", "121"], ["Restricted", "7"], ["Upcoming lectures", "3"], ["Attendance open", "1"], ["Upcoming contests", "1"], ["Problems", "120"], ["Average rating", "3.84"]];
    return admin("admin-dashboard", [["Dashboard"]], pageHead("Administration", "What needs attention across the platform.") + `<div class="grid-4">${stats.map(([l, v]) => `<article class="card mini"><p class="stat-label">${l}</p><p class="stat-value num" style="font-size:26px">${v}</p></article>`).join("")}</div><article class="card"><h2>Recent activity</h2><ul class="timeline" style="margin-top:12px">${DATA.adminActivity.map((a) => `<li><strong>${a[0]}</strong><div class="caption">${a[1]} · ${a[2]}</div></li>`).join("")}</ul></article>`);
  },
});

addScreen({
  id: "admin-notifications", order: 1610, group: "16 Admin dashboard", title: "Admin notifications",
  links: [["Dashboard", "admin-dashboard"]],
  render() {
    return admin("admin-dashboard", [["Dashboard", "admin-dashboard"], ["Notifications"]], pageHead("Notifications") + `<article class="card">${DATA.adminActivity.slice(0, 5).map((a) => `<div class="list-row"><div><strong>${a[0]}</strong><div class="caption">${a[1]} · ${a[2]}</div></div></div>`).join("")}</article>`);
  },
});

function userRows() {
  return DATA.users.map((u) => {
    const restricted = u[4] === "Restricted";
    return { cells: [u[0], u[1], u[2], `<span class="num">${u[3]}</span>`, badge(restricted ? "restricted" : "active-account", u[4]), u[5], `<div class="cluster">${btn("View", { size: "sm", variant: "outline", nav: restricted ? "admin-user-restricted" : "admin-user" })}${restricted ? btn("Reopen", { size: "sm", nav: "admin-reopen" }) : ""}</div>`] };
  });
}

addScreen({
  id: "admin-users", order: 1700, group: "17 Admin users", title: "Users",
  links: [["Ibrahim", "admin-user"], ["Restricted student", "admin-user-restricted"], ["Filters", "admin-users-filter"], ["Loading", "admin-users-loading"]],
  render() {
    return admin("admin-users", [["Users"]], pageHead("Users", "Search, filter, and open a student record.") + `<div class="toolbar">${searchBox("Search name or email")}${btn("Filters", { variant: "outline", icon: "filter", action: "open-filter" })}</div>${smartTable(["Name", "Email", "Role", "Rating", "Status", "Attendance", "Actions"], userRows(), 980)}${pager("Showing 1–8 of 24")}`, { drawer: `<div class="drawer-root" hidden><aside class="drawer" role="dialog" aria-label="Filters"><div class="spread"><h2>Filters</h2><button type="button" class="btn btn-ghost btn-sm" data-action="close-filter">Close</button></div>${field({ label: "Role", type: "select", options: ["Any", "Student", "Admin"], value: "Any" })}${field({ label: "Status", type: "select", options: ["Any", "Active", "Restricted"], value: "Any" })}${field({ label: "Joined after", type: "date" })}<div class="cluster">${btn("Reset", { variant: "ghost", action: "close-filter" })}${btn("Apply", { action: "close-filter" })}</div></aside></div>` });
  },
});

addScreen({
  id: "admin-users-filter", order: 1710, group: "17 Admin users", title: "Filters open",
  links: [["Users", "admin-users"]],
  render() {
    return admin("admin-users", [["Users"]], pageHead("Users", "Role, status, and date narrow the table.") + smartTable(["Name", "Email", "Role", "Rating", "Status", "Attendance", "Actions"], userRows(), 980), {
      drawer: `<div class="drawer-root"><aside class="drawer" role="dialog" aria-label="Filters"><div class="spread"><h2>Filters</h2><button type="button" class="btn btn-ghost btn-sm" data-action="close-filter">Close</button></div>${field({ label: "Role", type: "select", options: ["Any", "Student", "Admin"], value: "Student" })}${field({ label: "Status", type: "select", options: ["Any", "Active", "Restricted"], value: "Active" })}${field({ label: "Joined after", type: "date", value: "2026-01-01" })}<div class="cluster">${btn("Reset", { variant: "ghost", nav: "admin-users" })}${btn("Apply", { nav: "admin-users" })}</div></aside></div>`,
    });
  },
});

addScreen({
  id: "admin-users-loading", order: 1720, group: "17 Admin users", title: "Users loading",
  links: [["Users", "admin-users"]],
  render: () => admin("admin-users", [["Users"]], `<div class="skeleton sk-lg"></div><div class="skeleton sk-card"></div><div class="skeleton"></div><div class="skeleton"></div>`),
});

function userDetail(restricted) {
  const name = restricted ? "Liya Mekonnen" : "Ibrahim Kedir";
  const rating = restricted ? "1.84" : "4.27";
  return admin(restricted ? "admin-restricted" : "admin-users", [["Users", "admin-users"], [name]], `
    ${pageHead(name, restricted ? "liya.mekonnen@ncc.edu" : "ibrahim.kedir@ncc.edu", restricted ? btn("Reopen access", { nav: "admin-reopen" }) : "")}
    <div class="cluster">${badge(restricted ? "restricted" : "active-account", restricted ? "Restricted" : "Active")}<span class="caption">${restricted ? "Restricted Oct 3, 2026" : "Student"}</span></div>
    <div class="grid-2">
      <article class="card stack"><h2>Account</h2><dl class="kv"><dt>Rating</dt><dd class="num">${rating} / 5.00</dd><dt>Attendance</dt><dd>${restricted ? "62%" : "91%"}</dd><dt>Streak</dt><dd>${restricted ? "0 days" : "12 days"}</dd><dt>Codeforces</dt><dd class="mono">${restricted ? "liya_m" : "ibrahimkediramdela2211"}</dd><dt>LeetCode</dt><dd class="mono">${restricted ? "—" : "ibro_man"}</dd></dl></article>
      <article class="card stack"><h2>Problem progress</h2><p class="num">${restricted ? "24 / 120" : "82 / 120"} solved</p>${bar(restricted ? 20 : 68)}<p class="caption">Verification status is stored per problem.</p></article>
    </div>
    <article class="card"><h2>Recent contest results</h2><p style="margin-top:8px">${restricted ? "No published results in the current term." : "Weekly Contest #03 · Rank #12 · 742 points"}</p></article>
    <article class="card"><h2>Rating history</h2><p class="secondary" style="margin-top:8px">${restricted ? "1.92 → 1.84 on Oct 3, 2026" : "3.95 → 4.27 on Oct 9, 2026"}</p></article>`);
}

addScreen({ id: "admin-user", order: 1730, group: "17 Admin users", title: "User details", links: [["Users", "admin-users"], ["Restricted record", "admin-user-restricted"]], render: () => userDetail(false) });
addScreen({ id: "admin-user-restricted", order: 1740, group: "17 Admin users", title: "Restricted user details", links: [["Reopen", "admin-reopen"]], render: () => userDetail(true) });

addScreen({
  id: "admin-announcements", order: 1800, group: "18 Admin announcements", title: "Announcement list",
  links: [["Create", "admin-announcement-new"], ["Edit", "admin-announcement-edit"], ["Delete", "admin-announcement-delete"]],
  render() {
    const rows = DATA.announcements.map((a) => ({ cells: [a.title, a.type, a.date, badge("published", "Published"), menu([["Edit", "admin-announcement-edit"], ["Delete", "admin-announcement-delete"]])] }));
    return admin("admin-announcements", [["Announcements"]], pageHead("Announcements", "Drafts stay hidden from students.", btn("Create", { icon: "plus", nav: "admin-announcement-new" })) + smartTable(["Title", "Type", "Created", "Status", "Actions"], rows, 800));
  },
});

function announcementForm(edit) {
  return admin("admin-announcements", [["Announcements", "admin-announcements"], [edit ? "Edit" : "Create"]], pageHead(edit ? "Edit announcement" : "Create announcement") + `<form class="card stack">${`<div class="form-grid">${field({ label: "Title", value: edit ? "Weekly Contest #04 invitation" : "" })}${field({ label: "Type", type: "select", value: edit ? "Contest" : "General", options: ["General", "Important", "Contest", "Lecture", "Attendance"] })}${field({ label: "Status", type: "select", value: edit ? "Published" : "Draft", options: ["Draft", "Published"] })}<div class="span-2">${field({ label: "Content", type: "textarea", value: edit ? "You are invited to NCC_DSA Weekly Contest #04." : "" })}</div></div>`}<div class="cluster">${btn("Save draft", { variant: "outline", nav: "admin-announcements" })}${btn(edit ? "Save" : "Publish", { nav: "admin-announce-toast" })}</div></form>`);
}

addScreen({ id: "admin-announcement-new", order: 1810, group: "18 Admin announcements", title: "Create announcement", links: [["Published toast", "admin-announce-toast"], ["List", "admin-announcements"]], render: () => announcementForm(false) });
addScreen({ id: "admin-announcement-edit", order: 1820, group: "18 Admin announcements", title: "Edit announcement", links: [["List", "admin-announcements"]], render: () => announcementForm(true) });
addScreen({
  id: "admin-announcement-delete", order: 1830, group: "18 Admin announcements", title: "Delete confirmation",
  links: [["Deleted", "admin-announce-deleted"]],
  render() {
    const page = admin("admin-announcements", [["Announcements"]], pageHead("Announcements"));
    return page + modal("Delete announcement?", "This action cannot be undone.", `${btn("Cancel", { variant: "outline", nav: "admin-announcements" })}${btn("Delete", { variant: "danger", nav: "admin-announce-deleted" })}`);
  },
});
addScreen({ id: "admin-announce-toast", order: 1840, group: "18 Admin announcements", title: "Publish success", links: [["List", "admin-announcements"]], render: () => admin("admin-announcements", [["Announcements"]], pageHead("Announcements"), { toast: toast("ok", "Announcement published successfully") }) });
addScreen({ id: "admin-announce-deleted", order: 1850, group: "18 Admin announcements", title: "Delete success", links: [["List", "admin-announcements"]], render: () => admin("admin-announcements", [["Announcements"]], pageHead("Announcements") + emptyBlock("Announcement deleted.", "The list updates after a successful delete."), { toast: toast("ok", "Announcement deleted") }) });

addScreen({
  id: "admin-lectures", order: 1900, group: "19 Admin lectures", title: "Lectures",
  links: [["Create", "admin-lecture-new"], ["Start attendance", "admin-attendance-start"]],
  render() {
    const rows = DATA.lectures.map((l) => ({ cells: [l.title, l.date, l.time, badge(statusKind(l.status), l.status), l.attendance, menu([["Edit", "admin-lecture-new"], ["Open attendance", "admin-attendance"], ["Delete", "admin-lecture-delete"]])] }));
    return admin("admin-lectures", [["Lectures"]], pageHead("Lectures", "", btn("Create lecture", { icon: "plus", nav: "admin-lecture-new" })) + smartTable(["Title", "Date", "Time", "Status", "Attendance", "Actions"], rows, 900));
  },
});

addScreen({
  id: "admin-lecture-new", order: 1910, group: "19 Admin lectures", title: "Create lecture",
  links: [["Lectures", "admin-lectures"]],
  render() {
    return admin("admin-lectures", [["Lectures", "admin-lectures"], ["Create"]], pageHead("Create lecture") + `<form class="card stack"><div class="form-grid">${field({ label: "Title", placeholder: "Lecture title" })}${field({ label: "Status", type: "select", options: ["Draft", "Published"], value: "Draft" })}<div class="span-2">${field({ label: "Description", type: "textarea" })}</div>${field({ label: "Date", type: "date", value: "2026-10-17" })}${field({ label: "Time", type: "time", value: "14:00" })}${field({ label: "Live session link", type: "url", placeholder: "https://" })}${field({ label: "Resource title", placeholder: "Slides" })}${field({ label: "Resource type", type: "select", options: ["PDF", "Link", "File"], value: "PDF" })}${field({ label: "Resource URL", type: "url", placeholder: "https://" })}</div><div class="cluster">${btn("Add resource", { variant: "outline", icon: "plus" })}${btn("Save draft", { variant: "secondary", nav: "admin-lectures" })}${btn("Publish", { nav: "admin-lecture-publish" })}</div></form>`);
  },
});

addScreen({
  id: "admin-lecture-publish", order: 1920, group: "19 Admin lectures", title: "Publish lecture",
  links: [["Lectures", "admin-lectures"]],
  render() {
    return admin("admin-lectures", [["Lectures"]], pageHead("Lectures"), { modal: modal("Publish lecture?", "The lecture will become visible to students.", `${btn("Cancel", { variant: "outline", nav: "admin-lectures" })}${btn("Publish", { nav: "admin-lectures" })}`), toast: "" });
  },
});

addScreen({
  id: "admin-lecture-delete", order: 1930, group: "19 Admin lectures", title: "Delete lecture",
  links: [["Lectures", "admin-lectures"]],
  render: () => admin("admin-lectures", [["Lectures"]], pageHead("Lectures"), { modal: modal("Delete lecture?", "This action cannot be undone.", `${btn("Cancel", { variant: "outline", nav: "admin-lectures" })}${btn("Delete", { variant: "danger", nav: "admin-lectures" })}`) }),
});

addScreen({
  id: "admin-attendance", order: 2000, group: "20 Admin attendance", title: "Attendance sessions",
  links: [["Start", "admin-attendance-start"], ["Active", "admin-attendance-active"], ["Results", "admin-attendance-results"]],
  render() {
    return admin("admin-attendance", [["Attendance"]], pageHead("Attendance", "Open a code for the lecture that is running.", btn("Start attendance", { nav: "admin-attendance-start" })) + `<article class="card stack"><h2>Binary Search Patterns</h2><div class="cluster">${badge("active", "Attendance active")}${badge("live", "Session live")}</div><p>Code <strong class="mono">4837</strong></p><p>Expires in <strong class="num">08:42</strong></p>${btn("View submissions", { variant: "outline", nav: "admin-attendance-results" })}</article>`);
  },
});

addScreen({
  id: "admin-attendance-start", order: 2010, group: "20 Admin attendance", title: "Start attendance",
  links: [["Active session", "admin-attendance-active"]],
  render() {
    return admin("admin-attendance", [["Attendance"]], pageHead("Attendance"), { modal: modal("Start attendance", "Lecture: Dynamic Programming #02<br>Code: 4837<br>Valid for: 10 minutes 15 seconds", `${btn("Cancel", { variant: "outline", nav: "admin-attendance" })}${btn("Start attendance", { nav: "admin-attendance-active" })}`) });
  },
});

addScreen({
  id: "admin-attendance-active", order: 2020, group: "20 Admin attendance", title: "Active session",
  links: [["Submissions", "admin-attendance-results"]],
  render() {
    return admin("admin-attendance", [["Attendance"]], pageHead("Attendance") + `<article class="card stack" style="max-width:480px"><div class="cluster">${badge("active", "Attendance active")}</div><h2>Dynamic Programming #02</h2><p class="stat-label">Code</p><p class="stat-value mono">4837</p><p class="stat-label">Expires in</p><p class="stat-value num">08:42</p><p class="caption">Validity was set to 10 minutes 15 seconds when the session started.</p>${btn("End session", { variant: "danger", nav: "admin-attendance" })}${btn("View submissions", { variant: "outline", nav: "admin-attendance-results" })}</article>`, { toast: toast("ok", "Attendance session started") });
  },
});

addScreen({
  id: "admin-attendance-results", order: 2030, group: "20 Admin attendance", title: "Attendance results",
  links: [["Session", "admin-attendance-active"]],
  render() {
    const rows = [["Ibrahim Kedir", "Present", "4:12 PM", "Accepted"], ["Hana Tesfaye", "Present", "4:08 PM", "Accepted"], ["Yonas Alemu", "Not recorded", "—", "—"], ["Liya Mekonnen", "Not recorded", "—", "—"]].map((r) => ({ cells: [r[0], badge(r[1] === "Present" ? "solved" : "unsolved", r[1]), r[2], r[3]] }));
    return admin("admin-attendance", [["Attendance", "admin-attendance"], ["Binary Search Patterns"]], pageHead("Submissions", "Binary Search Patterns · Oct 13, 2026") + `<div class="toolbar">${searchBox("Search student")}${field({ label: "Status", type: "select", options: ["All", "Present", "Not recorded"], value: "All" })}</div>` + smartTable(["Student", "Status", "Submitted at", "Verification"], rows, 720));
  },
});

addScreen({
  id: "admin-contests", order: 2100, group: "21 Admin contests", title: "Contests",
  links: [["Create", "admin-contest-new"], ["Publish", "admin-contest-publish"], ["Fetch results", "admin-results"]],
  render() {
    const rows = DATA.contests.map((c) => ({ cells: [c.title, c.platform, `${c.date} · ${c.time}`, badge(statusKind(c.status), c.status), c.status === "Completed" ? "Published" : "Not fetched", menu([["Edit", "admin-contest-new"], ["Fetch results", "admin-results"], ["Publish", "admin-contest-publish"], ["Delete", "admin-contest-delete"]])] }));
    return admin("admin-contests", [["Contests"]], pageHead("Contests", "", btn("Create contest", { icon: "plus", nav: "admin-contest-new" })) + smartTable(["Contest", "Platform", "Date", "Status", "Results", "Actions"], rows, 980));
  },
});

addScreen({
  id: "admin-contest-new", order: 2110, group: "21 Admin contests", title: "Create contest",
  links: [["Contests", "admin-contests"]],
  render() {
    return admin("admin-contests", [["Contests", "admin-contests"], ["Create"]], pageHead("Create contest") + `<form class="card stack"><div class="form-grid">${field({ label: "Title", value: "NCC_DSA Weekly Contest #04" })}${field({ label: "Platform", type: "select", options: ["Codeforces"], value: "Codeforces" })}<div class="span-2">${field({ label: "Description", type: "textarea", value: "Weekly rated practice on Codeforces." })}</div>${field({ label: "Codeforces contest ID", value: "123456" })}${field({ label: "Codeforces URL", type: "url", value: "https://codeforces.com/contest/123456" })}${field({ label: "Invitation link", type: "url", value: "https://codeforces.com/contest/123456" })}${field({ label: "Date", type: "date", value: "2026-10-19" })}${field({ label: "Time", type: "time", value: "15:30" })}${field({ label: "Duration (minutes)", type: "number", value: "120" })}${field({ label: "Publication", type: "select", options: ["Draft", "Published"], value: "Draft" })}</div><div class="cluster">${btn("Save draft", { variant: "outline", nav: "admin-contests" })}${btn("Publish", { nav: "admin-contest-publish" })}</div></form>`);
  },
});

addScreen({
  id: "admin-contest-publish", order: 2120, group: "21 Admin contests", title: "Publish contest",
  links: [["Contests", "admin-contests"]],
  render: () => admin("admin-contests", [["Contests"]], pageHead("Contests"), { modal: modal("Publish contest?", "The contest will become visible to users.", `${btn("Cancel", { variant: "outline", nav: "admin-contests" })}${btn("Publish", { nav: "admin-contests" })}`) }),
});

addScreen({
  id: "admin-contest-delete", order: 2130, group: "21 Admin contests", title: "Delete contest",
  links: [["Contests", "admin-contests"]],
  render: () => admin("admin-contests", [["Contests"]], pageHead("Contests"), { modal: modal("Delete contest?", "This action cannot be undone.", `${btn("Cancel", { variant: "outline", nav: "admin-contests" })}${btn("Delete", { variant: "danger", nav: "admin-contests" })}`) }),
});

function resultsAdmin(state) {
  const banner = {
    idle: `<article class="card stack"><h2>Contest results</h2><p><strong>NCC_DSA Weekly Contest #04</strong></p>${field({ label: "Codeforces contest ID", value: "123456" })}${btn("Fetch results", { icon: "refresh", nav: "admin-results-loading" })}<p class="caption">Last fetch: not yet run for this round.</p></article>`,
    loading: `<article class="card status-panel"><span class="spinner"></span><h2>Fetching contest results...</h2><p class="secondary">Codeforces contest 123456</p></article>`,
    ok: `<div class="callout ok"><strong>Results fetched successfully</strong>Participants processed: 42. Matched NCC_DSA users: 37.</div>`,
    error: `<div class="callout danger" role="alert"><strong>Unable to fetch Codeforces results.</strong>Please check the contest information and try again.</div>`,
  }[state];
  const table = state === "ok" || state === "idle" ? smartTable(["Rank", "Participant", "Handle", "Score", "Penalty", "Match"], DATA.board.slice(0, 6).map((r) => ({ className: r[1] === "Ibrahim Kedir" ? "is-me" : "", cells: [`#${r[0]}`, r[1], `<span class="mono">${r[2]}</span>`, r[3], r[4], badge("solved", "Matched")] })), 860) : "";
  const unmatched = state === "ok" ? `<article class="card stack"><h2>Unmatched handles</h2><p class="secondary">These Codeforces handles are not linked to an NCC_DSA account. Matched rows already stored were left in place.</p><p class="mono">tourist_x · new_handle_22 · guest_904 · cf_only_1 · cf_only_2</p><p class="caption">5 unmatched · 37 matched · 42 processed</p></article>` : "";
  const actions = `<div class="cluster">${btn("Fetch results", { variant: "outline", icon: "refresh", nav: "admin-results-loading" })}${btn("Publish results", { nav: "admin-results-publish" })}</div>`;
  return admin("admin-results", [["Results"]], pageHead("Codeforces results", "NCC_DSA Weekly Contest #04") + banner + (state === "ok" ? `<p class="caption">Last fetch: Oct 12, 2026, 9:40 PM</p>` : "") + table + unmatched + (state === "error" || state === "ok" || state === "idle" ? actions : ""));
}

addScreen({ id: "admin-results", order: 2200, group: "22 Admin results", title: "Fetch results", links: [["Loading", "admin-results-loading"], ["Success", "admin-results-ok"], ["Error", "admin-results-error"], ["Publish", "admin-results-publish"]], render: () => resultsAdmin("idle") });
addScreen({ id: "admin-results-loading", order: 2210, group: "22 Admin results", title: "Fetching", links: [["Success", "admin-results-ok"], ["Error", "admin-results-error"]], render: () => resultsAdmin("loading") });
addScreen({ id: "admin-results-ok", order: 2220, group: "22 Admin results", title: "Fetch success", links: [["Publish", "admin-results-publish"]], render: () => resultsAdmin("ok") });
addScreen({ id: "admin-results-error", order: 2230, group: "22 Admin results", title: "Codeforces error", links: [["Try again", "admin-results"]], render: () => resultsAdmin("error") });
addScreen({
  id: "admin-results-publish", order: 2240, group: "22 Admin results", title: "Publish results",
  links: [["Published", "admin-results-published"]],
  render: () => resultsAdmin("ok") + modal("Publish results?", "Students will see this leaderboard on the contest.", `${btn("Cancel", { variant: "outline", nav: "admin-results-ok" })}${btn("Publish results", { nav: "admin-results-published" })}`),
});
addScreen({ id: "admin-results-published", order: 2250, group: "22 Admin results", title: "Results published", links: [["Results", "admin-results"]], render: () => admin("admin-results", [["Results"]], pageHead("Codeforces results"), { toast: toast("ok", "Results published", "Weekly Contest #04 is now visible to students.") }) });

addScreen({
  id: "admin-problems", order: 2300, group: "23 Admin problems", title: "Problems",
  links: [["Add problem", "admin-problem-new"], ["Topics", "admin-topics"]],
  render() {
    const rows = DATA.problems.dp.map((p) => ({ cells: [p.title, "Dynamic Programming", p.platform, String(p.value), badge("published", "Published"), menu([["Edit", "admin-problem-new"], ["Delete", "admin-problem-delete"]])] }));
    return admin("admin-problems", [["Problems"]], pageHead("Problems", "Platforms: Codeforces and LeetCode.", btn("Add problem", { icon: "plus", nav: "admin-problem-new" })) + `<div class="toolbar">${searchBox("Search problems")}${field({ label: "Platform", type: "select", options: ["All", "Codeforces", "LeetCode"], value: "All" })}${field({ label: "Topic", type: "select", options: ["All"].concat(DATA.topics.map((t) => t.name)), value: "All" })}</div>` + smartTable(["Problem", "Topic", "Platform", "Value", "Status", "Actions"], rows, 860));
  },
});

addScreen({
  id: "admin-problem-new", order: 2310, group: "23 Admin problems", title: "Add problem",
  links: [["Problems", "admin-problems"]],
  render() {
    return admin("admin-problems", [["Problems", "admin-problems"], ["Add"]], pageHead("Add problem") + `<form class="card stack"><div class="form-grid">${field({ label: "Problem title", placeholder: "Problem title" })}${field({ label: "Topic", type: "select", options: DATA.topics.map((t) => t.name), value: "Dynamic Programming" })}${field({ label: "Platform", type: "select", options: ["Codeforces", "LeetCode"], value: "Codeforces" })}${field({ label: "Problem value", type: "number", value: "10" })}<div class="span-2">${field({ label: "Problem URL", type: "url", placeholder: "https://codeforces.com/problemset/problem/1/A" })}</div></div><div class="cluster">${btn("Cancel", { variant: "outline", nav: "admin-problems" })}${btn("Save problem", { nav: "admin-problems" })}</div></form>`);
  },
});

addScreen({
  id: "admin-problem-delete", order: 2320, group: "23 Admin problems", title: "Delete problem",
  links: [["Problems", "admin-problems"]],
  render: () => admin("admin-problems", [["Problems"]], pageHead("Problems"), { modal: modal("Delete problem?", "Students will no longer see this problem on the sheet.", `${btn("Cancel", { variant: "outline", nav: "admin-problems" })}${btn("Delete", { variant: "danger", nav: "admin-problems" })}`) }),
});

addScreen({
  id: "admin-topics", order: 2330, group: "23 Admin problems", title: "Topics",
  links: [["Problems", "admin-problems"]],
  render() {
    const rows = DATA.topics.map((t) => ({ cells: [t.name, String(t.total), String(t.solved), btn("Edit", { size: "sm", variant: "outline", nav: "admin-topic-edit" })] }));
    return admin("admin-topics", [["Topics"]], pageHead("Topics", "Keep the list to the topics you actually teach.", btn("Create topic", { icon: "plus", nav: "admin-topic-edit" })) + smartTable(["Topic", "Problems", "Solved count", "Actions"], rows, 640));
  },
});

addScreen({
  id: "admin-topic-edit", order: 2340, group: "23 Admin problems", title: "Edit topic",
  links: [["Topics", "admin-topics"]],
  render: () => admin("admin-topics", [["Topics", "admin-topics"], ["Edit"]], pageHead("Edit topic") + `<form class="card stack" style="max-width:480px">${field({ label: "Topic name", value: "Dynamic Programming" })}${btn("Save", { nav: "admin-topics" })}</form>`),
});

addScreen({
  id: "admin-progress", order: 2400, group: "24 Admin progress", title: "Progress",
  links: [["User progress", "admin-progress-user"]],
  render() {
    const rows = [["Ibrahim Kedir", "82", "120", "68%", "Oct 12, 2026"], ["Hana Tesfaye", "97", "120", "81%", "Oct 13, 2026"], ["Liya Mekonnen", "24", "120", "20%", "Sep 30, 2026"]].map((r, i) => ({ cells: [...r.slice(0, 4), r[4], btn("View", { size: "sm", variant: "outline", nav: "admin-progress-user" })] }));
    return admin("admin-progress", [["Progress"]], pageHead("Progress", "Verified solves only.") + `<div class="toolbar">${searchBox("Search student")}</div>` + smartTable(["User", "Problems solved", "Total problems", "Completion", "Last activity", ""], rows, 860));
  },
});

addScreen({
  id: "admin-progress-user", order: 2410, group: "24 Admin progress", title: "Student progress",
  links: [["Progress", "admin-progress"]],
  render() {
    const problems = DATA.problems.dp.map((p) => `<div class="list-row"><span>${p.title}</span>${badge(statusKind(p.status === "Not solved" ? "Not solved" : p.status === "Solved" ? "Solved" : "Verification pending"), p.status)}</div>`).join("");
    return admin("admin-progress", [["Progress", "admin-progress"], ["Ibrahim Kedir"]], pageHead("Ibrahim Kedir", "82 / 120 · 68%") + `<article class="card"><h2>Topic progress</h2><div class="stack" style="margin-top:8px">${DATA.topics.map((topic) => `<div><div class="spread"><span>${topic.name}</span><span class="num">${topic.id === "dp" ? "12 / 20" : topic.id === "arrays" ? "22 / 28" : topic.id === "binary-search" ? "16 / 20" : topic.id === "graphs" ? "18 / 30" : "14 / 22"}</span></div>${bar(topic.id === "dp" ? 60 : topic.id === "arrays" ? 79 : 70)}</div>`).join("")}</div></article><article class="card"><h2>Dynamic Programming</h2>${problems}</article>`);
  },
});

addScreen({
  id: "admin-rating", order: 2500, group: "25 Admin rating", title: "Rating",
  links: [["Recalculate", "admin-rating-recalc"], ["Restricted", "admin-restricted"]],
  render() {
    const rows = [["Ibrahim Kedir", "4.27", "4.50", "4.10", "4.70", "Oct 9, 2026"], ["Hana Tesfaye", "4.62", "4.80", "4.40", "4.70", "Oct 9, 2026"], ["Liya Mekonnen", "1.84", "1.60", "1.90", "2.10", "Oct 3, 2026"]].map((r) => ({ cells: [r[0], `<span class="num">${r[1]}</span>`, r[2], r[3], r[4], r[5]] }));
    return admin("admin-rating", [["Rating"]], pageHead("Rating", "Components are shown beside the official rating. Recalculate runs the platform job.", btn("Recalculate", { icon: "refresh", nav: "admin-rating-recalc" })) + smartTable(["User", "Current rating", "Problem", "Contest", "Attendance", "Last update"], rows, 860));
  },
});

addScreen({
  id: "admin-rating-recalc", order: 2510, group: "25 Admin rating", title: "Recalculate confirmation",
  links: [["Rating", "admin-rating"]],
  render: () => admin("admin-rating", [["Rating"]], pageHead("Rating"), { modal: modal("Recalculate ratings?", "This runs the platform rating job for student accounts.", `${btn("Cancel", { variant: "outline", nav: "admin-rating" })}${btn("Recalculate", { nav: "admin-rating-done" })}`) }),
});

addScreen({
  id: "admin-rating-done", order: 2520, group: "25 Admin rating", title: "Recalculate success",
  links: [["Rating", "admin-rating"]],
  render: () => admin("admin-rating", [["Rating"]], pageHead("Rating"), { toast: toast("ok", "Rating recalculated", "128 student accounts were updated.") }),
});

addScreen({
  id: "admin-restricted", order: 2600, group: "26 Admin restrictions", title: "Restricted users",
  links: [["Reopen", "admin-reopen"], ["User", "admin-user-restricted"]],
  render() {
    const rows = [{ cells: ["Ibrahim Kedir", "1.84 / 5", "Oct 13, 2026", badge("restricted", "Restricted"), btn("Reopen access", { size: "sm", nav: "admin-reopen" })] }, { cells: ["Liya Mekonnen", "1.84 / 5", "Oct 3, 2026", badge("restricted", "Restricted"), btn("Reopen access", { size: "sm", nav: "admin-reopen" })] }];
    return admin("admin-restricted", [["Restricted"]], pageHead("Restricted users", "Reopening restores normal platform access.") + smartTable(["User", "Rating", "Restriction date", "Status", "Action"], rows, 760));
  },
});

addScreen({
  id: "admin-reopen", order: 2610, group: "26 Admin restrictions", title: "Reopen confirmation",
  links: [["Restored", "admin-reopen-done"], ["Cancel", "admin-restricted"]],
  render() {
    return admin("admin-restricted", [["Restricted"]], pageHead("Restricted users"), { modal: modal("Reopen account?", "This will restore the user's normal platform access.", `${btn("Cancel", { variant: "outline", nav: "admin-restricted" })}${btn("Reopen account", { nav: "admin-reopen-done" })}`) });
  },
});

addScreen({
  id: "admin-reopen-done", order: 2620, group: "26 Admin restrictions", title: "Access restored",
  links: [["Restricted", "admin-restricted"]],
  render: () => admin("admin-restricted", [["Restricted"]], pageHead("Restricted users") + `<article class="card status-panel"><h2>Account access restored</h2><p class="secondary">The student can sign in to the full platform again.</p></article>`, { toast: toast("ok", "Account access restored") }),
});

function qr() {
  const cells = Array.from({ length: 81 }, (_, i) => {
    const x = i % 9;
    const y = Math.floor(i / 9);
    const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    const on = finder || (x * 3 + y * 5) % 4 === 0;
    return `<i class="${on ? "" : "off"}"></i>`;
  }).join("");
  return `<div class="qr" role="img" aria-label="Sample QR code">${cells}</div>`;
}

addScreen({
  id: "admin-2fa", order: 2630, group: "26 Admin restrictions", title: "Two-factor setup",
  note: "Reached from Two-factor in the admin sidebar.",
  links: [["Verify", "admin-2fa-code"]],
  render() {
    return admin("admin-dashboard", [["Two-factor"]], pageHead("Enable admin two-factor authentication", "Scan the QR code or enter the setup key, then verify.") + `<article class="card stack" style="max-width:520px">${qr()}<p class="caption">Sample QR for layout. The live code comes from the server.</p><p>Setup key</p><p class="mono">NCCDSA-2FA-SAMPLE-KEY</p>${btn("Continue", { nav: "admin-2fa-code" })}</article>`);
  },
});

addScreen({
  id: "admin-2fa-code", order: 2640, group: "26 Admin restrictions", title: "Two-factor code",
  links: [["Failure", "admin-2fa-fail"], ["Dashboard", "admin-dashboard"]],
  render() {
    return admin("admin-dashboard", [["Two-factor"]], `<article class="card stack" style="max-width:520px"><h1>Enter verification code</h1><p class="secondary">Use the 6-digit code from your authenticator.</p>${otp(6, "Verification code")}${btn("Verify", { nav: "admin-2fa-ok" })}</article>`);
  },
});

addScreen({
  id: "admin-2fa-fail", order: 2650, group: "26 Admin restrictions", title: "Invalid verification code",
  links: [["Try again", "admin-2fa-code"]],
  render() {
    return admin("admin-dashboard", [["Two-factor"]], `<article class="card stack" style="max-width:520px"><div class="callout danger" role="alert"><strong>Invalid verification code.</strong></div><h1>Enter verification code</h1>${otp(6, "Verification code")}${btn("Verify", { nav: "admin-2fa-fail" })}</article>`);
  },
});

addScreen({
  id: "admin-2fa-ok", order: 2660, group: "26 Admin restrictions", title: "Two-factor enabled",
  links: [["Dashboard", "admin-dashboard"]],
  render: () => admin("admin-dashboard", [["Two-factor"]], `<article class="card status-panel"><h2>Two-factor authentication is on</h2><p class="secondary">Admin sign-in will ask for a code.</p>${btn("Back to dashboard", { variant: "outline", nav: "admin-dashboard" })}</article>`),
});
