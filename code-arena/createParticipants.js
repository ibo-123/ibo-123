// createParticipants.js
const axios = require("axios");

// ============================================================
// CONFIG
// ============================================================
const BASE_URL = "http://localhost:8080/api";
const TOURNAMENT_ID = "6aaf5e0c1be78dbd7944d794";
const PASSWORD = "Test123!";

// Admin credentials — set these so we can approve participants
// If left empty, participants are registered but NOT approved.
const ADMIN_USERNAME = "ibrahim";
const ADMIN_PASSWORD = "YOUR_ADMIN_PASSWORD";

// Behaviour flags
const AUTO_APPROVE = true; // Set to false to skip approval step
const SKIP_EXISTING = true; // If a user already exists, log in instead of failing
const DELAY_MS = 300; // Delay between users to avoid rate-limiting

// Codeforces participants from Gym 709424 standings
const handles = [
  "Seid11",
  "amiiines",
  "HayatAbdulfetah",
  "hanifesmail4466",
  "fk_cp",
  "asmau_usman",
  "salimm",
  "zikraimamusultan",
  "Suha_endris",
  "moonlight1170",
  "_Hafsa44",
  "Ferah_123",
  "asliiiisaa5",
  "emu-1803",
  "Assuu",
  "Emunabdus",
  "Awels",
  "tesnim-flow",
  "sume2",
  "MiftahMoh99",
];

// ============================================================
// Build user objects
// ============================================================
const users = handles.map((handle) => ({
  username: handle,
  password: PASSWORD,
  email: `${handle.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
  name: handle,
  codeforcesUsername: handle,
}));

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ============================================================
// API client
// ============================================================
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

// ============================================================
// API helpers
// ============================================================

async function registerUser(user) {
  const res = await api.post("/auth/register", user);
  return res.data;
}

async function loginUser(username, password) {
  const res = await api.post("/auth/login", { username, password });
  if (!res.data?.token) {
    throw new Error("Login returned no token");
  }
  return res.data.token;
}

async function joinTournament(token) {
  const res = await api.post(
    `/tournaments/${TOURNAMENT_ID}/join`,
    null,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function getAdminToken() {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return null;
  try {
    return await loginUser(ADMIN_USERNAME, ADMIN_PASSWORD);
  } catch (err) {
    console.warn(
      "⚠️  Could not log in as admin — approval step will be skipped"
    );
    return null;
  }
}

async function getParticipants(adminToken) {
  const res = await api.get(
    `/tournaments/${TOURNAMENT_ID}/participants`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return res.data.participants || [];
}

async function approveParticipant(adminToken, participantId) {
  const res = await api.patch(
    `/admin/tournaments/${TOURNAMENT_ID}/participants/${participantId}/approve`,
    null,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return res.data;
}

// ============================================================
// Main
// ============================================================

(async function main() {
  console.log(`🚀 Creating ${users.length} participants...`);
  console.log(`   Tournament: ${TOURNAMENT_ID}`);
  console.log(`   Auto-approve: ${AUTO_APPROVE ? "yes" : "no"}`);
  console.log(`   Skip existing: ${SKIP_EXISTING ? "yes" : "no"}`);
  console.log("");

  // ---- 1. Register + login + join each user --------------------------
  const results = [];

  for (const [i, user] of users.entries()) {
    const prefix = `[${String(i + 1).padStart(2, " ")}/${users.length}]`;

    try {
      // Register — but tolerate "already exists"
      let registered = false;
      try {
        await registerUser(user);
        registered = true;
        process.stdout.write(`${prefix} ✅ Registered ${user.username}`);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message;

        if (SKIP_EXISTING && (status === 409 || /exists/i.test(msg))) {
          process.stdout.write(`${prefix} ℹ️  Already exists: ${user.username}`);
        } else {
          throw err;
        }
      }

      // Login (works whether we just registered or the user already existed)
      const token = await loginUser(user.username, user.password);
      process.stdout.write(` | 🔑 Logged in`);

      // Join the tournament
      let joined = false;
      try {
        await joinTournament(token);
        joined = true;
        process.stdout.write(` | 🎯 Joined`);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message;

        if (status === 409 || /already/i.test(msg)) {
          process.stdout.write(` | ℹ️  Already joined`);
          joined = true;
        } else {
          throw err;
        }
      }

      console.log("");
      results.push({
        username: user.username,
        codeforcesUsername: user.codeforcesUsername,
        registered: registered ? "new" : "existing",
        joined: joined ? "yes" : "no",
        approved: "",
        status: "success",
      });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      console.log("");
      console.error(
        `${prefix} ❌ Failed ${user.username}: ${status ? `[${status}] ` : ""}${msg}`
      );

      results.push({
        username: user.username,
        codeforcesUsername: user.codeforcesUsername,
        registered: "no",
        joined: "no",
        approved: "",
        status: "failed",
        error: msg,
      });
    }

    await delay(DELAY_MS);
  }

  // ---- 2. Approve participants (optional) ----------------------------
  if (AUTO_APPROVE) {
    console.log("\n🛡️  Approving participants...");
    const adminToken = await getAdminToken();

    if (!adminToken) {
      console.warn("⚠️  No admin token — skipping approval");
    } else {
      const participants = await getParticipants(adminToken);
      const pending = participants.filter(
        (p) => p.registrationStatus === "PENDING"
      );

      console.log(
        `   Found ${participants.length} participants, ${pending.length} pending`
      );

      for (const p of pending) {
        try {
          await approveParticipant(adminToken, p._id);
          const username = p.user?.username || p.username || p._id;
          console.log(`   ✅ Approved ${username}`);

          const row = results.find((r) => r.username === username);
          if (row) row.approved = "yes";
        } catch (err) {
          const msg = err.response?.data?.message || err.message;
          console.error(`   ❌ Failed to approve ${p._id}: ${msg}`);
        }

        await delay(DELAY_MS);
      }
    }
  }

  // ---- 3. Summary ----------------------------------------------------
  console.log("\n📊 Summary:");

  const success = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "failed");
  const approved = results.filter((r) => r.approved === "yes");

  console.log(`   Total:    ${results.length}`);
  console.log(`   Success:  ${success.length}`);
  console.log(`   Failed:   ${failed.length}`);
  if (AUTO_APPROVE) {
    console.log(`   Approved: ${approved.length}`);
  }

  console.log("");
  console.table(results);

  if (failed.length > 0) {
    console.log("\n❌ Failed users:");
    failed.forEach((r) => {
      console.log(`   • ${r.username}: ${r.error}`);
    });
  }

  console.log("\n✨ Done.");
})().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});