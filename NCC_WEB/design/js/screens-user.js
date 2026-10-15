addScreen({
  id: "dashboard", order: 500, group: "05 User dashboard", title: "Dashboard",
  links: [["Lecture", "lecture-detail"], ["Live session", "lecture-live"], ["Contest", "contest-detail"], ["Progress", "progress"], ["Rating", "rating"], ["Loading", "dashboard-loading"]],
  render() {
    const u = DATA.user;
    return appShell({
      active: "dashboard",
      crumbs: [["Dashboard"]],
      content: `
        ${pageHead(`Welcome back, ${u.first}`, "Tuesday, 13 October 2026", btn("Join live session", { nav: "lecture-live" }))}
        <div class="hero-grid">
          <article class="card">
            <p class="stat-label">NCC_DSA rating</p>
            <p class="stat-value num">${u.rating.toFixed(2)} <span style="font-size:18px;color:var(--muted)">/ 5.00</span></p>
            <div style="margin:8px 0">${stars(u.rating)}</div>
            <p class="stat-hint up">+${u.change.toFixed(2)} this period</p>
            <div style="margin-top:12px">${btn("View rating", { variant: "outline", size: "sm", nav: "rating" })}</div>
          </article>
          <article class="card">
            <p class="stat-label">Current streak</p>
            <p class="stat-value">${icon("flame", 22)} ${u.streak} days</p>
            <p class="stat-hint">Longest streak · ${u.longest} days</p>
            <div style="margin-top:12px">${btn("View streak", { variant: "ghost", size: "sm", nav: "streak" })}</div>
          </article>
          <div class="mini-stats span-row">
            <article class="card mini"><p class="stat-label">Attendance</p><p class="stat-value num">${u.attendancePct}%</p><p class="stat-hint">${u.attended} attended · ${u.missed} missed</p></article>
            <article class="card mini"><p class="stat-label">Problems solved</p><p class="stat-value num">${u.solved}</p><p class="stat-hint">${u.solved} / ${u.total} on the sheet</p></article>
            <article class="card mini"><p class="stat-label">Contests</p><p class="stat-value num">${u.contestsJoined}</p><p class="stat-hint">Participations recorded</p></article>
          </div>
        </div>
        <div class="grid-2">
          <article class="card"><div class="spread"><h2>Upcoming lectures</h2><a data-nav="lectures" href="#lectures">All lectures</a></div>${lectureRows()}</article>
          <article class="card"><div class="spread"><h2>Upcoming contests</h2><a data-nav="contests" href="#contests">All contests</a></div>${contestRows(DATA.contests.filter((c) => c.status === "Upcoming"))}</article>
        </div>
        <div class="grid-2">
          <article class="card"><div class="spread"><h2>Announcements</h2><a data-nav="announcements" href="#announcements">View all</a></div>
            ${DATA.announcements.slice(0, 3).map((a) => `<div class="list-row"><div><strong>${a.title}</strong><div class="caption">${a.date} · ${a.type}</div></div>${badge(a.type === "Important" ? "warning" : "published", a.type)}</div>`).join("")}
          </article>
          <article class="card"><h2>Recent activity</h2><ul class="timeline" style="margin-top:12px">${DATA.activity.map((a) => `<li><strong>${a[0]}</strong><div class="caption">${a[1]} · ${a[2]}</div></li>`).join("")}</ul></article>
        </div>`,
    });
  },
});

addScreen({
  id: "dashboard-loading", order: 510, group: "05 User dashboard", title: "Dashboard loading",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({
      active: "dashboard", crumbs: [["Dashboard"]],
      content: `<div class="skeleton sk-lg"></div><div class="grid-3">${[1, 2, 3].map(() => `<div class="skeleton sk-card"></div>`).join("")}</div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton" style="width:70%"></div>`,
    });
  },
});

addScreen({
  id: "notifications", order: 520, group: "05 User dashboard", title: "Notifications",
  links: [["Dashboard", "dashboard"]],
  render() {
    const items = [["Contest", "Weekly Contest #04 is on Sunday at 3:30 PM.", "contest-detail"], ["Announcement", "Summer tournament seating was published.", "announcement-important"], ["Attendance", "Attendance recorded for Arrays and Prefix Sums.", "attendance"]];
    return appShell({ active: "dashboard", crumbs: [["Dashboard", "dashboard"], ["Notifications"]], content: pageHead("Notifications") + `<article class="card">${items.map((n) => `<div class="list-row"><div><strong>${n[0]}</strong><div class="secondary">${n[1]}</div></div>${btn("Open", { variant: "ghost", size: "sm", nav: n[2] })}</div>`).join("")}</article>` });
  },
});

addScreen({
  id: "announcements", order: 600, group: "06 Announcements", title: "Announcement list",
  links: [["Important", "announcement-important"], ["Detail", "announcement-detail"], ["Empty", "announcements-empty"]],
  render() {
    return appShell({
      active: "announcements", crumbs: [["Announcements"]],
      content: pageHead("Announcements", "Published notes from the DSA team.") + `<div class="toolbar">${searchBox("Search announcements")}${btn("Filter", { variant: "outline", icon: "filter", action: "open-filter" })}</div><div class="stack">${DATA.announcements.map((a) => `<article class="card ${a.type === "Important" ? "important" : ""}"><div class="spread"><div><div class="cluster">${badge(a.type === "Important" ? "warning" : "info", a.type)}${badge("published", a.status)}</div><h2 style="margin-top:8px">${a.title}</h2><p class="caption">${a.date}</p></div>${btn("Read", { variant: "outline", size: "sm", nav: a.nav })}</div><p class="secondary" style="margin-top:8px">${a.body}</p></article>`).join("")}</div>${pager("Showing 1–4 of 4")}`,
    });
  },
});

addScreen({
  id: "announcement-detail", order: 610, group: "06 Announcements", title: "Announcement detail",
  links: [["List", "announcements"], ["Related contest", "contest-detail"]],
  render() {
    return appShell({
      active: "announcements", crumbs: [["Announcements", "announcements"], ["Weekly Contest #04 invitation"]],
      content: `${btn("Back", { variant: "ghost", size: "sm", nav: "announcements" })}<article class="card stack"><div class="cluster">${badge("info", "Contest")}${badge("published", "Published")}</div><h1>Weekly Contest #04 invitation</h1><p class="caption">Oct 10, 2026</p><p>You are invited to NCC_DSA Weekly Contest #04. The round is on Codeforces this Sunday.</p><div class="callout"><strong>Related contest</strong>Sunday, Oct 19 · 3:30 PM · 2 hours. <a data-nav="contest-detail" href="#contest-detail">Open contest</a></div></article>`,
    });
  },
});

addScreen({
  id: "announcement-important", order: 620, group: "06 Announcements", title: "Important announcement",
  links: [["List", "announcements"]],
  render() {
    return appShell({
      active: "announcements", crumbs: [["Announcements", "announcements"], ["Summer tournament seating"]],
      content: `<article class="card important stack"><div class="cluster">${badge("warning", "Important")}<span class="caption">Oct 11, 2026</span></div><h1>Summer tournament seating</h1><p>Arrive 20 minutes early for NCC_DSA Summer Time Tournament check-in. Bring the Codeforces handle linked on your profile.</p><p class="secondary">This style is only for announcements marked important.</p></article>`,
    });
  },
});

addScreen({
  id: "announcements-empty", order: 630, group: "06 Announcements", title: "No announcements",
  links: [["List", "announcements"]],
  render: () => appShell({ active: "announcements", crumbs: [["Announcements"]], content: pageHead("Announcements") + emptyBlock("No announcements yet.", "When the team publishes one, it will show up here.") }),
});

addScreen({
  id: "rating", order: 1300, group: "13 Rating", title: "Rating",
  links: [["History", "rating-history"], ["Warning state", "rating-warning"], ["Empty history", "rating-empty"]],
  render() {
    const u = DATA.user;
    const parts = [["Problem solving", 4.5], ["Contest performance", 4.1], ["Attendance", 4.7]];
    return appShell({
      active: "rating", crumbs: [["Rating"]],
      content: pageHead("Rating", "The number on the card is the official NCC_DSA rating.") + `
        <article class="card">
          <p class="stat-label">NCC_DSA rating</p>
          <p class="stat-value num">${u.rating.toFixed(2)} <span style="font-size:20px;color:var(--muted)">/ 5.00</span></p>
          <div style="margin:8px 0">${stars(u.rating)}</div>
          <div class="cluster"><span class="caption">Previous ${u.previous.toFixed(2)}</span><span class="stat-hint up">+${u.change.toFixed(2)}</span>${badge("active-account", "Active account")}</div>
        </article>
        <article class="card stack"><h2>Rating breakdown</h2><p class="secondary">Component scores are reported by the platform. None of these bars is the rating by itself.</p>
          ${parts.map(([n, v]) => `<div class="break-row"><span>${n}</span>${bar((v / 5) * 100)}<strong class="num">${v.toFixed(1)}</strong></div>`).join("")}
        </article>
        <div class="cluster">${btn("Rating history", { variant: "outline", nav: "rating-history" })}${btn("Streak", { variant: "ghost", nav: "streak" })}</div>`,
    });
  },
});

addScreen({
  id: "rating-history", order: 1310, group: "13 Rating", title: "Rating history",
  links: [["Rating", "rating"], ["Empty", "rating-empty"]],
  render() {
    return appShell({
      active: "rating", crumbs: [["Rating", "rating"], ["History"]],
      content: pageHead("Rating history", "Date on the horizontal axis. Rating on the vertical axis.") + `<article class="card">${lineChart(DATA.history)}</article>` + smartTable(["Date", "Previous", "New", "Change", "Source"], DATA.historyRows.map((r) => ({ cells: r, className: r[3].startsWith("+") ? "" : "" }))) ,
    });
  },
});

addScreen({
  id: "rating-empty", order: 1320, group: "13 Rating", title: "No rating history",
  links: [["Rating", "rating"]],
  render: () => appShell({ active: "rating", crumbs: [["Rating", "rating"], ["History"]], content: pageHead("Rating history") + emptyBlock("No rating history yet.", "History appears after the platform records a rating.") }),
});

addScreen({
  id: "rating-warning", order: 1330, group: "13 Rating", title: "Rating warning",
  note: "Alternate state. The main rating screen uses 4.27.",
  links: [["Restricted state", "restricted"], ["Rating", "rating"]],
  render() {
    return appShell({
      active: "rating", crumbs: [["Rating"]],
      content: `<div class="callout warn" role="status"><strong>Rating warning</strong>Your current NCC_DSA rating is 2.14 / 5. Your rating is approaching the account restriction threshold. Continue participating in lectures, contests, attendance, and verified problem solving.</div>
        <article class="card"><p class="stat-label">NCC_DSA rating</p><p class="stat-value num">2.14 <span style="font-size:18px;color:var(--muted)">/ 5.00</span></p><div style="margin-top:8px">${stars(2.14)}</div><div style="margin-top:8px">${badge("warning", "Warning")}</div></article>`,
    });
  },
});

addScreen({
  id: "streak", order: 1400, group: "14 Streak", title: "Streak",
  links: [["Dashboard", "dashboard"]],
  render() {
    const u = DATA.user;
    return appShell({
      active: "dashboard", crumbs: [["Dashboard", "dashboard"], ["Streak"]],
      content: pageHead("Streak") + `<div class="grid-2"><article class="card"><p class="stat-label">Current streak</p><p class="stat-value">${u.streak} days</p></article><article class="card"><p class="stat-label">Longest streak</p><p class="stat-value">${u.longest} days</p></article></div><article class="card stack"><h2>Activity</h2><p class="secondary">Last qualifying activity · ${u.lastActivity}</p>${heatCalendar()}</article>`,
    });
  },
});

addScreen({
  id: "profile", order: 1500, group: "15 Profile", title: "Profile",
  links: [["Restricted state", "restricted"], ["Rating", "rating"]],
  render() {
    const u = DATA.user;
    return appShell({
      active: "profile", crumbs: [["Profile"]],
      content: pageHead("Profile", "Handles are used when a solve is checked on Codeforces or LeetCode.") + `
        <div class="grid-2">
          <article class="card"><div class="identity" style="padding:0 0 12px"><span class="avatar">${u.initials}</span><span><strong>${u.name}</strong><small>${u.email}</small></span></div>
            <dl class="kv"><dt>Codeforces</dt><dd class="mono">${u.cf}</dd><dt>LeetCode</dt><dd class="mono">${u.lc}</dd><dt>Account</dt><dd>${badge("active-account", "Active account")}</dd></dl>
          </article>
          <article class="card stack"><h2>Standing</h2><p>Rating <strong class="num">${u.rating.toFixed(2)} / 5.00</strong></p><p>Streak <strong>${u.streak} days</strong> · longest ${u.longest}</p><p>Attendance <strong>${u.attendancePct}%</strong></p><p>Problems solved <strong>${u.solved}</strong></p>${btn("Update linked handles", { variant: "outline", size: "sm", nav: "link-handles" })}</article>
        </div>`,
    });
  },
});

addScreen({
  id: "restricted", order: 1510, group: "15 Profile", title: "Restricted account",
  note: "Locked state. No navigation into the rest of the platform. Preview at 390 as well.",
  links: [["Admin reopen", "admin-reopen"], ["Login", "login"]],
  render() {
    return `<div class="lock"><article class="lock-card card stack">
      <div class="side-head" style="padding:0"><span class="mark">N</span><span><span class="brand-name">NCC_DSA</span><span class="brand-sub">Platform</span></span></div>
      <div>${badge("restricted", "Restricted")}</div>
      <h1>Account access restricted</h1>
      <p>Your NCC_DSA rating is below the required threshold. Your account currently has restricted access. Please contact the DSA Heads for assistance.</p>
      <div class="card flat" style="background:var(--sunken)"><p class="stat-label">Current rating</p><p class="stat-value num">1.84 <span style="font-size:18px;color:var(--muted)">/ 5.00</span></p></div>
      <a class="btn btn-primary btn-md" href="mailto:dsa-heads@ncc.edu">Contact DSA Heads</a>
      <a data-nav="login" href="#login">Log out</a>
    </article></div>`;
  },
});
