function resources() {
  return `<div class="stack">${DATA.resources.map((r) => `<div class="resource"><div style="flex:1"><strong>${r[0]}</strong><div class="caption">${r[1]}</div></div>${btn(r[2], { variant: "outline", size: "sm" })}</div>`).join("")}</div>`;
}

function lecturePage(mode) {
  const modes = {
    detail: { title: "Introduction to Dynamic Programming", date: "Friday, Oct 17, 2026", time: "2:00 PM", status: "Upcoming", sessionTitle: "Not started", sessionBody: "The room opens at 2:00 PM.", join: "disabled", attend: "open", desc: "States, transitions, and how to read a DP problem before coding." },
    live: { title: "Binary Search Patterns", date: "Tuesday, Oct 13, 2026", time: "4:00 PM", status: "Live", sessionTitle: "Live", sessionBody: "The session is open now.", join: "live", attend: "open", desc: "Lower bound, upper bound, and the predicate form used in contest problems." },
    soon: { title: "Graph Traversal Workshop", date: "Saturday, Oct 18, 2026", time: "10:00 AM", status: "Starting soon", sessionTitle: "Starting soon", sessionBody: "You can join when the host starts the room.", join: "soon", attend: "closed", desc: "BFS, DFS, and when each one is the right first move." },
    done: { title: "Arrays and Prefix Sums", date: "Monday, Oct 6, 2026", time: "4:00 PM", status: "Completed", sessionTitle: "Completed", sessionBody: "This live session has ended.", join: "done", attend: "attended", desc: "Prefix sums, difference arrays, and common contest patterns." },
    idle: { title: "Introduction to Dynamic Programming", date: "Friday, Oct 17, 2026", time: "2:00 PM", status: "Upcoming", sessionTitle: "Not started", sessionBody: "Join stays unavailable until the session starts.", join: "disabled", attend: "closed", desc: "States, transitions, and how to read a DP problem before coding." },
  };
  const m = modes[mode];
  const join = m.join === "live" ? `<a class="btn btn-primary btn-md" href="https://meet.ncc.edu/binary-search">Join live session</a>` : m.join === "soon" ? btn("Starting soon", { variant: "outline", disabled: true }) : m.join === "done" ? btn("Session ended", { variant: "ghost", disabled: true }) : btn("Join live session", { disabled: true });
  let attend = "";
  if (m.attend === "open") {
    attend = `<h2>Attendance</h2><p>Attendance is currently open.</p><p><strong>Enter the 4-digit attendance code</strong></p>${otp(4, "Attendance code")}<div>${btn("Submit attendance", { nav: "attendance-ok" })}</div>`;
  } else if (m.attend === "attended") {
    attend = `<h2>Attendance</h2>${badge("solved", "Attended")}<p class="secondary">Recorded Oct 6, 2026 at 4:12 PM.</p>`;
  } else {
    attend = `<h2>Attendance</h2><p>Attendance is not currently active.</p>`;
  }
  return appShell({
    active: "lectures",
    crumbs: [["Lectures", "lectures"], [m.title]],
    content: `${pageHead(m.title, `${m.date} · ${m.time}`)}<div class="cluster">${badge(statusKind(m.status), m.status)}${m.status === "Live" ? '<span class="live-dot" aria-hidden="true"></span>' : ""}</div>
      <article class="card"><h2>Description</h2><p style="margin-top:8px">${m.desc}</p></article>
      <div class="grid-2">
        <article class="card stack"><h2>Resources</h2>${resources()}</article>
        <article class="card stack"><h2>Live session</h2><p class="stat-value" style="font-size:22px">${m.date.split(",")[0]}</p><p>${m.time}</p><p class="secondary">${m.sessionTitle}. ${m.sessionBody}</p>${join}</article>
      </div>
      <article class="card stack">${attend}</article>`,
  });
}

addScreen({ id: "lectures", order: 700, group: "07 Lectures", title: "Lecture list", links: [["Details", "lecture-detail"], ["Live", "lecture-live"], ["Starting soon", "lecture-soon"], ["Completed", "lecture-done"], ["Empty", "lectures-empty"]], render() {
  return appShell({ active: "lectures", crumbs: [["Lectures"]], content: pageHead("Lectures", "Upcoming sessions first.") + `<div class="toolbar">${searchBox("Search lectures")}${btn("Filter", { variant: "outline", icon: "filter" })}</div><div class="grid-2">${DATA.lectures.map((l) => `<article class="card stack"><div class="cluster">${badge(statusKind(l.status), l.status)}${l.resources ? badge("info", "Resources") : ""}${badge(statusKind(l.attendance), l.attendance)}</div><h2>${l.title}</h2><p class="secondary">${l.desc}</p><p class="caption">${l.date} · ${l.time}</p>${btn("View", { variant: "outline", size: "sm", nav: l.nav })}</article>`).join("")}</div>` });
}});

addScreen({ id: "lecture-detail", order: 710, group: "07 Lectures", title: "Lecture details", links: [["Attendance success", "attendance-ok"], ["Live state", "lecture-live"], ["List", "lectures"]], render: () => lecturePage("detail") });
addScreen({ id: "lecture-live", order: 720, group: "07 Lectures", title: "Live session", links: [["Attendance", "attendance-code"], ["List", "lectures"]], render: () => lecturePage("live") });
addScreen({ id: "lecture-soon", order: 730, group: "07 Lectures", title: "Starting soon", links: [["Lecture", "lecture-detail"]], render: () => lecturePage("soon") });
addScreen({ id: "lecture-done", order: 740, group: "07 Lectures", title: "Completed lecture", links: [["List", "lectures"]], render: () => lecturePage("done") });
addScreen({ id: "lecture-idle", order: 750, group: "07 Lectures", title: "Attendance not active", links: [["Lecture", "lecture-detail"]], render: () => lecturePage("idle") });
addScreen({ id: "lectures-empty", order: 760, group: "07 Lectures", title: "No lectures", links: [["List", "lectures"]], render: () => appShell({ active: "lectures", crumbs: [["Lectures"]], content: pageHead("Lectures") + emptyBlock("No lectures available.", "Scheduled lectures will appear here.") }) });

addScreen({
  id: "attendance", order: 800, group: "08 Attendance", title: "Attendance",
  links: [["Enter code", "attendance-code"], ["Correct", "attendance-ok"], ["Wrong code", "attendance-bad"], ["Expired", "attendance-expired"], ["Duplicate", "attendance-duplicate"], ["Not active", "attendance-inactive"]],
  render() {
    const u = DATA.user;
    return appShell({
      active: "attendance", crumbs: [["Attendance"]],
      content: pageHead("Attendance", "Totals come from recorded lectures.") + `<div class="grid-4"><article class="card mini"><p class="stat-label">Lectures</p><p class="stat-value num">${u.lectures}</p></article><article class="card mini"><p class="stat-label">Attended</p><p class="stat-value num">${u.attended}</p></article><article class="card mini"><p class="stat-label">Missed</p><p class="stat-value num">${u.missed}</p></article><article class="card mini"><p class="stat-label">Attendance</p><p class="stat-value num">${u.attendancePct}%</p></article></div>${bar(u.attendancePct)}<article class="card"><h2>History</h2>${smartTable(["Lecture", "Date", "Session", "Record"], DATA.attendanceHistory.map((r) => ({ cells: [r[0], r[1], badge(statusKind(r[2]), r[2]), r[3]] })))}</article>${btn("Enter attendance code", { nav: "attendance-code" })}`,
    });
  },
});

function codeScreen(title, body, tone, extra) {
  return appShell({
    active: "attendance", crumbs: [["Attendance", "attendance"], ["Code"]],
    content: `<article class="card stack" style="max-width:520px"><h1>${title}</h1>${body || ""}${extra || ""}</article>`,
    toast: tone ? toast(tone, title, body) : "",
  });
}

addScreen({
  id: "attendance-code", order: 810, group: "08 Attendance", title: "Attendance code",
  links: [["Correct", "attendance-ok"], ["Wrong", "attendance-bad"]],
  render() {
    return appShell({
      active: "attendance", crumbs: [["Lectures", "lectures"], ["Attendance code"]],
      content: `<article class="card stack" style="max-width:520px"><h1>Enter attendance code</h1><p>Lecture</p><p><strong>Introduction to Dynamic Programming</strong></p><p>Enter 4-digit code</p>${otp(4, "Attendance code")}${btn("Submit", { nav: "attendance-ok" })}</article>`,
    });
  },
});

addScreen({ id: "attendance-ok", order: 820, group: "08 Attendance", title: "Attendance recorded", links: [["Attendance", "attendance"]], render: () => appShell({ active: "attendance", crumbs: [["Attendance"]], content: `<article class="card status-panel"><span class="badge badge-ok"><i></i>Recorded</span><h2>Attendance recorded</h2><p class="secondary">Your attendance has been successfully recorded.</p>${btn("Back to attendance", { variant: "outline", nav: "attendance" })}</article>` }) });
addScreen({ id: "attendance-bad", order: 830, group: "08 Attendance", title: "Wrong code", links: [["Try again", "attendance-code"]], render: () => appShell({ active: "attendance", crumbs: [["Attendance"]], content: `<article class="card stack" style="max-width:520px"><div class="callout danger" role="alert"><strong>Invalid attendance code</strong>Please check the code and try again.</div><h1>Enter attendance code</h1>${otp(4, "Attendance code")}${btn("Submit", { nav: "attendance-bad" })}</article>` }) });
addScreen({ id: "attendance-expired", order: 840, group: "08 Attendance", title: "Code expired", links: [["Attendance", "attendance"]], render: () => appShell({ active: "attendance", crumbs: [["Attendance"]], content: `<article class="card status-panel"><h2>Attendance code expired</h2><p class="secondary">The attendance session has ended.</p></article>` }) });
addScreen({ id: "attendance-duplicate", order: 850, group: "08 Attendance", title: "Already recorded", links: [["Attendance", "attendance"]], render: () => appShell({ active: "attendance", crumbs: [["Attendance"]], content: `<article class="card status-panel"><h2>Attendance already recorded</h2><p class="secondary">You have already submitted attendance.</p></article>` }) });
addScreen({ id: "attendance-inactive", order: 860, group: "08 Attendance", title: "Attendance inactive", links: [["Lectures", "lectures"]], render: () => appShell({ active: "attendance", crumbs: [["Attendance"]], content: `<article class="card status-panel"><h2>Attendance is not currently active.</h2><p class="secondary">The code entry opens only while a session is running.</p></article>` }) });

function contestBody(mode) {
  const active = mode === "active";
  const done = mode === "done";
  const title = done ? "NCC_DSA Weekly Contest #03" : "NCC_DSA Weekly Contest #04";
  const when = done ? "Sunday, Oct 12, 2026 · 3:30 PM" : "Sunday, Oct 19, 2026 · 3:30 PM";
  const status = active ? "Active" : done ? "Completed" : "Upcoming";
  return appShell({
    active: "contests", crumbs: [["Contests", "contests"], [title]],
    content: `${pageHead(title, "Codeforces · 2 hours")}<div class="cluster">${badge(statusKind(status), status)}${!done ? badge("info", "Invited") : badge("completed", "Results ready")}</div>
      <article class="card important stack"><p class="kicker">You are invited to participate</p><h2>${title}</h2><p>Platform: Codeforces<br>Date: ${when.split("·")[0]}<br>Time: ${when.split("·")[1]}</p>${done ? btn("View results", { nav: "results" }) : `<a class="btn btn-primary btn-md" href="https://codeforces.com/contest/123456">Open contest</a>`}</article>
      <div class="grid-2"><article class="card stack"><h2>About</h2><p>A weekly NCC_DSA round. Standings are fetched from Codeforces after the contest and then published here.</p><dl class="kv"><dt>Platform</dt><dd>Codeforces</dd><dt>Contest ID</dt><dd class="mono">123456</dd><dt>When</dt><dd>${when}</dd><dt>Duration</dt><dd>2 hours</dd><dt>Invitation</dt><dd><a href="https://codeforces.com/contest/123456">codeforces.com/contest/123456</a></dd></dl></article>
      <article class="card stack"><h2>Your result</h2>${done ? `<p>Rank <strong class="num">#12</strong></p><p>Score <strong class="num">742</strong></p><p>Penalty <strong class="num">1240</strong></p>${btn("View results", { variant: "outline", nav: "results" })}` : `<p class="secondary">${active ? "The round is in progress. Official standings appear here after they are published." : "Results appear here after the round is published."}</p>`}</article></div>`,
  });
}

addScreen({ id: "contests", order: 900, group: "09 Contests", title: "Contest list", links: [["Upcoming", "contest-detail"], ["Active", "contest-active"], ["Completed", "contest-done"], ["Empty", "contests-empty"]], render() {
  const groups = [["Upcoming", DATA.contests.filter((c) => c.status === "Upcoming")], ["Active", []], ["Completed", DATA.contests.filter((c) => c.status === "Completed")]];
  return appShell({ active: "contests", crumbs: [["Contests"]], content: pageHead("Contests") + groups.map(([name, items]) => `<section class="stack"><h2>${name}</h2>${items.length ? `<div class="grid-2">${items.map((c) => `<article class="card stack"><div class="cluster">${badge(statusKind(c.status), c.status)}${c.invited ? badge("info", "Invited") : ""}</div><h3>${c.title}</h3><p class="caption">${c.platform} · ${c.date} · ${c.time}<br>${c.duration}</p>${btn(c.status === "Completed" ? "View results" : "Open contest", { variant: "outline", size: "sm", nav: c.status === "Completed" ? "results" : "contest-detail" })}</article>`).join("")}</div>` : `<p class="secondary">No ${name.toLowerCase()} contests.</p>`}</section>`).join("") });
}});

addScreen({ id: "contest-detail", order: 910, group: "09 Contests", title: "Contest details", links: [["Results", "results"], ["Active state", "contest-active"]], render: () => contestBody("upcoming") });
addScreen({ id: "contest-active", order: 920, group: "09 Contests", title: "Active contest", links: [["Details", "contest-detail"]], render: () => contestBody("active") });
addScreen({ id: "contest-done", order: 930, group: "09 Contests", title: "Completed contest", links: [["Results", "results"]], render: () => contestBody("done") });
addScreen({ id: "contests-empty", order: 940, group: "09 Contests", title: "No contests", links: [["List", "contests"]], render: () => appShell({ active: "contests", crumbs: [["Contests"]], content: pageHead("Contests") + emptyBlock("No contests available.", "Invitations show up here when a round is published.") }) });

addScreen({
  id: "results", order: 1000, group: "10 Contest results", title: "Leaderboard",
  links: [["Contest", "contest-done"], ["Empty", "results-empty"]],
  render() {
    const rows = DATA.board.map((r) => ({ className: r[1] === "Ibrahim Kedir" ? "is-me" : "", cells: [`#${r[0]}`, r[1], `<span class="mono">${r[2]}</span>`, `<span class="num">${r[3]}</span>`, `<span class="num">${r[4]}</span>`] }));
    return appShell({
      active: "results", crumbs: [["Results"]],
      content: pageHead("NCC_DSA Weekly Contest #03", "Sunday, Oct 12, 2026 · 42 participants") + `<div class="grid-3"><article class="card mini"><p class="stat-label">Your rank</p><p class="stat-value num">#12</p></article><article class="card mini"><p class="stat-label">Your score</p><p class="stat-value num">742</p></article><article class="card mini"><p class="stat-label">Penalty</p><p class="stat-value num">1240</p></article></div><p class="secondary">Your row is highlighted. Contest score is one input to rating, together with problem solving and attendance.</p><div class="toolbar">${searchBox("Search participant")}</div>${smartTable(["Rank", "Participant", "Handle", "Score", "Penalty"], rows, 680)}${pager("Showing 1–15 of 42")}`,
    });
  },
});

addScreen({ id: "results-empty", order: 1010, group: "10 Contest results", title: "No results", links: [["Results", "results"]], render: () => appShell({ active: "results", crumbs: [["Results"]], content: pageHead("Contest results") + emptyBlock("No results available yet.", "Standings appear after they are published.") }) });

function topic() {
  return DATA.topics.find((t) => t.id === STATE.topic) || DATA.topics[2];
}

addScreen({
  id: "progress", order: 1100, group: "11 Progress", title: "Progress",
  links: [["Dynamic programming", "topic"], ["Empty solved", "progress-empty"]],
  render() {
    const u = DATA.user;
    const pct = Math.round((u.solved / u.total) * 100);
    return appShell({
      active: "progress", crumbs: [["Progress"]],
      content: pageHead("Problem progress", "Topics and counts are the ones created by admins.") + `<article class="card stack"><div class="spread"><strong>Solved</strong><span class="num">${u.solved} / ${u.total}</span></div>${bar(pct)}<p class="caption">${pct}% · current topic on your sheet: Dynamic Programming</p></article><div class="grid-2">${DATA.topics.map((t) => { const p = Math.round((t.solved / t.total) * 100); return `<article class="card stack"><h2>${t.name}</h2><p class="num">${t.solved} / ${t.total} solved</p>${bar(p)}<a data-nav="topic" data-topic="${t.id}" href="#topic">Open topic</a></article>`; }).join("")}</div>`,
    });
  },
});

addScreen({
  id: "topic", order: 1110, group: "11 Progress", title: "Topic problems",
  links: [["Problem", "problem"], ["Progress", "progress"]],
  render() {
    const t = topic();
    const problems = DATA.problems[t.id] || [];
    const rows = problems.map((p) => ({ cells: [p.title, String(p.value), p.platform, badge(statusKind(p.status === "Not solved" ? "Not solved" : p.status === "Solved" ? "Solved" : "Verification pending"), p.status), p.status === "Solved" ? badge("solved", "Solved") : btn("I solved this", { size: "sm", nav: "problem" })] }));
    return appShell({
      active: "progress", crumbs: [["Progress", "progress"], [t.name]],
      content: pageHead(t.name, `${t.solved} / ${t.total} solved`) + bar(Math.round((t.solved / t.total) * 100)) + smartTable(["Problem", "Value", "Platform", "Status", "Action"], rows, 760),
    });
  },
});

addScreen({ id: "progress-empty", order: 1120, group: "11 Progress", title: "No solved problems", links: [["Progress", "progress"]], render: () => appShell({ active: "progress", crumbs: [["Progress"]], content: pageHead("Problem progress") + emptyBlock("No verified problems yet.", "Start solving to build your progress.") }) });
addScreen({ id: "problems-empty", order: 1130, group: "11 Progress", title: "No problems", links: [["Progress", "progress"]], render: () => appShell({ active: "progress", crumbs: [["Progress", "progress"], ["Topic"]], content: pageHead("Dynamic Programming") + emptyBlock("No problems found.", "Problems show up after an admin adds them to this topic.") }) });

addScreen({
  id: "problem", order: 1200, group: "12 Problem verification", title: "Problem details",
  links: [["Verifying", "verify-pending"], ["Solved", "verify-ok"], ["Not solved", "verify-fail"], ["No account", "verify-unlink"]],
  render() {
    return appShell({
      active: "progress", crumbs: [["Progress", "progress"], ["Dynamic Programming", "topic"], ["0/1 Knapsack"]],
      content: pageHead("0/1 Knapsack") + `<article class="card stack"><dl class="kv"><dt>Topic</dt><dd>Dynamic Programming</dd><dt>Platform</dt><dd>Codeforces</dd><dt>Value</dt><dd>10</dd><dt>Link</dt><dd><a href="https://codeforces.com/problemset">Open problem</a></dd><dt>Status</dt><dd>${badge("unsolved", "Not solved")}</dd></dl>${btn("I solved this", { nav: "verify-pending" })}<div class="callout"><strong>Verification</strong>Clicking this button does not automatically mark the problem as solved. Your account will be checked on the supported platform.</div></article>`,
    });
  },
});

addScreen({ id: "verify-pending", order: 1210, group: "12 Problem verification", title: "Verifying", links: [["Solved", "verify-ok"], ["Not solved", "verify-fail"]], render: () => appShell({ active: "progress", crumbs: [["Progress", "progress"], ["0/1 Knapsack"]], content: `<article class="card status-panel"><span class="spinner"></span><h2>Verifying your solution...</h2><p class="secondary">Please wait.</p></article>` }) });
addScreen({ id: "verify-ok", order: 1220, group: "12 Problem verification", title: "Successfully solved", links: [["Progress", "progress"]], render: () => appShell({ active: "progress", crumbs: [["Progress", "progress"], ["Frog Jumps"]], content: `<article class="card status-panel"><span class="badge badge-ok"><i></i>Solved</span><h2>Successfully solved</h2><p>Verified on Codeforces</p><p class="secondary">Solved at: September 20, 2026</p></article>` }) });
addScreen({ id: "verify-fail", order: 1230, group: "12 Problem verification", title: "Not solved", links: [["Try again", "verify-pending"]], render: () => appShell({ active: "progress", crumbs: [["Progress", "progress"], ["0/1 Knapsack"]], content: `<article class="card status-panel"><h2>Problem not solved</h2><p class="secondary">We could not verify this problem on your linked account.</p>${btn("Try again", { nav: "verify-pending" })}</article>` }) });
addScreen({ id: "verify-unlink", order: 1240, group: "12 Problem verification", title: "Account not linked", links: [["Link handles", "link-handles"]], render: () => appShell({ active: "progress", crumbs: [["Progress", "progress"], ["0/1 Knapsack"]], content: `<article class="card status-panel"><h2>Codeforces account not linked</h2><p class="secondary">Link your Codeforces account to verify your progress.</p>${btn("Link account", { nav: "link-handles" })}</article>` }) });

addScreen({
  id: "link-handles", order: 1520, group: "15 Profile", title: "Link handles",
  links: [["Profile", "profile"], ["Verify", "problem"]],
  render() {
    return appShell({
      active: "profile", crumbs: [["Profile", "profile"], ["Handles"]],
      content: pageHead("Linked handles", "Used only to check solves on Codeforces and LeetCode.") + `<form class="card stack" style="max-width:560px">${field({ label: "Codeforces handle", value: "ibrahimkediramdela2211" })}${field({ label: "LeetCode handle", value: "ibro_man" })}${btn("Save handles", { nav: "profile" })}</form>`,
    });
  },
});
