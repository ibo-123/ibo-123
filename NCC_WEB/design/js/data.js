const DATA = {
  user: {
    name: "Ibrahim Kedir",
    first: "Ibrahim",
    initials: "IK",
    email: "ibrahim.kedir@ncc.edu",
    cf: "ibrahimkediramdela2211",
    lc: "ibro_man",
    rating: 4.27,
    previous: 3.95,
    change: 0.32,
    streak: 12,
    longest: 21,
    solved: 82,
    total: 120,
    attendancePct: 91,
    attended: 41,
    missed: 4,
    lectures: 45,
    contestsJoined: 6,
    lastActivity: "Verified solve · Oct 12, 2026",
  },
  admin: { name: "Marta Alemu", initials: "MA", email: "marta.alemu@ncc.edu" },
  announcements: [
    { title: "Summer tournament seating", date: "Oct 11, 2026", type: "Important", status: "Published", body: "Arrive 20 minutes early for NCC_DSA Summer Time Tournament check-in. Bring the Codeforces handle linked on your profile.", nav: "announcement-important" },
    { title: "Weekly Contest #04 invitation", date: "Oct 10, 2026", type: "Contest", status: "Published", body: "You are invited to NCC_DSA Weekly Contest #04 on Sunday at 3:30 PM. The contest runs on Codeforces.", nav: "announcement-detail" },
    { title: "Dynamic programming lecture notes", date: "Oct 8, 2026", type: "Lecture", status: "Published", body: "Slides and the practice sheet for Introduction to Dynamic Programming are on the lecture page.", nav: "announcement-detail" },
    { title: "Attendance window reminder", date: "Oct 6, 2026", type: "Attendance", status: "Published", body: "Attendance codes are valid only while the session is open. Submit the 4-digit code from the lecture room.", nav: "announcement-detail" },
  ],
  lectures: [
    { title: "Binary Search Patterns", desc: "Lower bound, upper bound, and the predicate form used in contest problems.", date: "Tue, Oct 13, 2026", time: "4:00 PM", status: "Live", resources: true, attendance: "Open", nav: "lecture-live" },
    { title: "Introduction to Dynamic Programming", desc: "States, transitions, and how to read a DP problem before coding.", date: "Fri, Oct 17, 2026", time: "2:00 PM", status: "Upcoming", resources: true, attendance: "Open", nav: "lecture-detail" },
    { title: "Graph Traversal Workshop", desc: "BFS, DFS, and when each one is the right first move.", date: "Sat, Oct 18, 2026", time: "10:00 AM", status: "Starting soon", resources: true, attendance: "Not open", nav: "lecture-soon" },
    { title: "Arrays and Prefix Sums", desc: "Prefix sums, difference arrays, and common contest patterns.", date: "Mon, Oct 6, 2026", time: "4:00 PM", status: "Completed", resources: true, attendance: "Attended", nav: "lecture-done" },
  ],
  contests: [
    { title: "NCC_DSA Weekly Contest #04", platform: "Codeforces", date: "Sun, Oct 19, 2026", time: "3:30 PM", duration: "2 hours", status: "Upcoming", invited: true, id: "123456", nav: "contest-detail" },
    { title: "NCC_DSA Weekly Contest #03", platform: "Codeforces", date: "Sun, Oct 12, 2026", time: "3:30 PM", duration: "2 hours", status: "Completed", invited: false, id: "123401", nav: "contest-done" },
    { title: "NCC_DSA Summer Time Tournament", platform: "Codeforces", date: "Sat, Aug 16, 2026", time: "1:00 PM", duration: "3 hours", status: "Completed", invited: false, id: "118820", nav: "contest-done" },
    { title: "NCC_DSA Weekly Contest #02", platform: "Codeforces", date: "Sun, Oct 5, 2026", time: "3:30 PM", duration: "2 hours", status: "Completed", invited: false, id: "123220", nav: "contest-done" },
  ],
  topics: [
    { id: "arrays", name: "Arrays", solved: 22, total: 28 },
    { id: "binary-search", name: "Binary Search", solved: 16, total: 20 },
    { id: "dp", name: "Dynamic Programming", solved: 12, total: 20 },
    { id: "graphs", name: "Graphs", solved: 18, total: 30 },
    { id: "math", name: "Mathematics", solved: 14, total: 22 },
  ],
  problems: {
    dp: [
      { title: "Frog Jumps", platform: "Codeforces", value: 5, status: "Solved" },
      { title: "0/1 Knapsack", platform: "Codeforces", value: 10, status: "Not solved" },
      { title: "LIS Basics", platform: "LeetCode", value: 8, status: "Verification pending" },
      { title: "Grid Paths", platform: "Codeforces", value: 12, status: "Not solved" },
    ],
    arrays: [
      { title: "Prefix Sum Range", platform: "Codeforces", value: 5, status: "Solved" },
      { title: "Sliding Window Max", platform: "LeetCode", value: 8, status: "Solved" },
    ],
    "binary-search": [
      { title: "First True Predicate", platform: "Codeforces", value: 6, status: "Solved" },
      { title: "Search on Answer", platform: "Codeforces", value: 10, status: "Not solved" },
    ],
    graphs: [
      { title: "BFS Shortest Path", platform: "Codeforces", value: 7, status: "Solved" },
      { title: "Cycle Detection", platform: "LeetCode", value: 9, status: "Not solved" },
    ],
    math: [
      { title: "Modular Exponent", platform: "Codeforces", value: 6, status: "Solved" },
      { title: "GCD Applications", platform: "Codeforces", value: 5, status: "Not solved" },
    ],
  },
  board: [
    ["1", "Hana Tesfaye", "hana_t", "1280", "210"],
    ["2", "Yonas Alemu", "yonas_a", "1210", "340"],
    ["3", "Meron Bekele", "meron_b", "1104", "510"],
    ["4", "Dawit Haile", "dawit_h", "980", "640"],
    ["5", "Sara Mohammed", "sara_m", "940", "700"],
    ["6", "Liya Mekonnen", "liya_m", "910", "820"],
    ["7", "Kaleb Tadesse", "kaleb_t", "870", "860"],
    ["8", "Naomi Getachew", "naomi_g", "840", "910"],
    ["9", "Samuel Desta", "sam_d", "810", "980"],
    ["10", "Ruth Assefa", "ruth_a", "790", "1040"],
    ["11", "Abel Girma", "abel_g", "760", "1120"],
    ["12", "Ibrahim Kedir", "ibrahimkediramdela2211", "742", "1240"],
    ["13", "Helen Worku", "helen_w", "700", "1300"],
    ["14", "Biruk Solomon", "biruk_s", "660", "1410"],
    ["15", "Mahiya Nur", "mahiya_n", "620", "1500"],
  ],
  history: [
    { x: "Sep 1", y: 3.2 },
    { x: "Sep 8", y: 3.45 },
    { x: "Sep 15", y: 3.9 },
    { x: "Sep 18", y: 3.72 },
    { x: "Sep 25", y: 4.05 },
    { x: "Oct 2", y: 3.95 },
    { x: "Oct 9", y: 4.27 },
  ],
  historyRows: [
    ["Oct 9, 2026", "3.95", "4.27", "+0.32", "Scheduled recalculation"],
    ["Oct 2, 2026", "4.05", "3.95", "−0.10", "Scheduled recalculation"],
    ["Sep 25, 2026", "3.72", "4.05", "+0.33", "Scheduled recalculation"],
    ["Sep 18, 2026", "3.90", "3.72", "−0.18", "Scheduled recalculation"],
    ["Sep 15, 2026", "3.45", "3.90", "+0.45", "Scheduled recalculation"],
    ["Sep 8, 2026", "3.20", "3.45", "+0.25", "Scheduled recalculation"],
    ["Sep 1, 2026", "—", "3.20", "—", "Initial rating"],
  ],
  users: [
    ["Ibrahim Kedir", "ibrahim.kedir@ncc.edu", "Student", "4.27", "Active", "91%"],
    ["Hana Tesfaye", "hana.tesfaye@ncc.edu", "Student", "4.62", "Active", "96%"],
    ["Yonas Alemu", "yonas.alemu@ncc.edu", "Student", "4.41", "Active", "88%"],
    ["Meron Bekele", "meron.bekele@ncc.edu", "Student", "3.88", "Active", "79%"],
    ["Liya Mekonnen", "liya.mekonnen@ncc.edu", "Student", "1.84", "Restricted", "62%"],
    ["Dawit Haile", "dawit.haile@ncc.edu", "Student", "3.54", "Active", "84%"],
    ["Marta Alemu", "marta.alemu@ncc.edu", "Admin", "—", "Active", "—"],
    ["Sara Mohammed", "sara.mohammed@ncc.edu", "Student", "4.05", "Active", "90%"],
  ],
  activity: [
    ["Solved problem", "Frog Jumps · Dynamic Programming", "Oct 12, 2026"],
    ["Contest result", "Weekly Contest #03 · Rank 12 · 742 points", "Oct 12, 2026"],
    ["Attendance", "Arrays and Prefix Sums", "Oct 6, 2026"],
    ["Rating change", "3.95 → 4.27", "Oct 9, 2026"],
  ],
  adminActivity: [
    ["Lecture published", "Binary Search Patterns", "Today, 9:10 AM"],
    ["Contest created", "NCC_DSA Weekly Contest #04", "Oct 10, 2026"],
    ["Attendance session started", "Arrays and Prefix Sums", "Oct 6, 2026"],
    ["Contest results fetched", "Weekly Contest #03 · 42 participants", "Oct 12, 2026"],
    ["Problem added", "Grid Paths · Dynamic Programming", "Oct 9, 2026"],
    ["Rating recalculated", "128 student accounts", "Oct 9, 2026"],
    ["User restricted", "Liya Mekonnen", "Oct 3, 2026"],
    ["User reopened", "Abel Girma", "Sep 28, 2026"],
  ],
  attendanceHistory: [
    ["Binary Search Patterns", "Oct 13, 2026", "Open", "Not submitted"],
    ["Arrays and Prefix Sums", "Oct 6, 2026", "Closed", "Present · 4:12 PM"],
    ["Graph Traversal Workshop", "Sep 28, 2026", "Closed", "Present · 10:06 AM"],
    ["Mathematics Warm-up", "Sep 21, 2026", "Closed", "Missed"],
  ],
  resources: [
    ["Lecture slides", "PDF", "Open"],
    ["Practice sheet", "Link", "Open"],
    ["Sample code", "File", "Download"],
  ],
};

DATA.heat = Array.from({ length: 18 * 7 }, (_, i) => {
  const day = i % 7;
  const week = Math.floor(i / 7);
  const n = (week * 3 + day * 5) % 9;
  if (n < 2) return 0;
  if (n < 4) return 1;
  if (n < 6) return 2;
  if (n < 8) return 3;
  return 4;
});
