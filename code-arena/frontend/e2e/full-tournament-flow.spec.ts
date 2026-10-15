// frontend/e2e/full-tournament-flow.spec.ts
import { test, expect } from "@playwright/test";
import { registerViaApi, loginAsAdmin, loginViaUi, logout } from "./helpers";

test.describe("Full tournament lifecycle", () => {
  test.setTimeout(300_000);

  test("admin creates tournament, participant joins, completes flow", async ({
    page,
    request,
  }) => {
    const admin = await loginAsAdmin(request);

    const now = Date.now();
    const tournamentName = `E2E Tournament ${now}`;

    // ----------------------------------------------------------
    // Setup — create tournament + 4 participants via API
    // ----------------------------------------------------------
    const tournamentRes = await request.post(
      "http://localhost:5000/api/admin/tournaments",
      {
        headers: { Authorization: `Bearer ${admin.token}` },
        timeout: 30_000,
        data: {
          name: tournamentName,
          description: "Playwright end-to-end test",
          registrationStart: new Date(now - 60_000).toISOString(),
          registrationEnd: new Date(now + 24 * 3_600_000).toISOString(),
          tournamentStart: new Date(now + 25 * 3_600_000).toISOString(),
          tournamentEnd: new Date(now + 48 * 3_600_000).toISOString(),
          maxParticipants: 4,
          numberOfGroups: 2,
          qualifiersPerGroup: 1,
          groupContests: 1,
          playoffFormat: "SINGLE_ELIMINATION",
        },
      }
    );
    expect(tournamentRes.ok()).toBeTruthy();
    const { tournament } = await tournamentRes.json();

    await request.patch(
      `http://localhost:5000/api/admin/tournaments/${tournament._id}`,
      {
        headers: { Authorization: `Bearer ${admin.token}` },
        timeout: 30_000,
        data: { status: "REGISTRATION" },
      }
    );

    const participants = await Promise.all(
      ["p1", "p2", "p3", "p4"].map(() => registerViaApi(request, "USER"))
    );

    for (const p of participants) {
      const res = await request.post(
        `http://localhost:5000/api/tournaments/${tournament._id}/join`,
        {
          headers: { Authorization: `Bearer ${p.token}` },
          timeout: 30_000,
        }
      );
      expect(res.ok()).toBeTruthy();
    }

    // ----------------------------------------------------------
    // Admin logs in, approves participants
    // ----------------------------------------------------------
    await loginViaUi(page, admin.username, admin.password);
    await page.goto("/admin/participants");

    await expect(
      page.getByText(new RegExp(`${tournamentName} · \\d+ registered`))
    ).toBeVisible({ timeout: 15_000 });

    // Click Approve once via UI to prove the button works
    const approveBtn = page
      .getByRole("button", { name: /^Approve$/i })
      .first();
    await expect(approveBtn).toBeVisible({ timeout: 15_000 });
    await approveBtn.click();
    await page.waitForTimeout(2000);

    // Approve the rest via API to guarantee state
    const listRes = await request.get(
      `http://localhost:5000/api/tournaments/${tournament._id}/participants`,
      {
        headers: { Authorization: `Bearer ${admin.token}` },
        timeout: 30_000,
      }
    );
    const { participants: list } = await listRes.json();

    for (const p of list) {
      if (p.registrationStatus === "PENDING") {
        await request.patch(
          `http://localhost:5000/api/admin/tournaments/${tournament._id}/participants/${p._id}/approve`,
          {
            headers: { Authorization: `Bearer ${admin.token}` },
            timeout: 30_000,
          }
        );
      }
    }

    // ----------------------------------------------------------
    // Admin creates + publishes a QUALIFICATION contest
    // ----------------------------------------------------------
    await page.goto("/admin/contests");
    await page.getByRole("button", { name: /add contest/i }).click();
    await page.getByLabel(/contest name/i).fill("E2E Qualification Round");
    await page
      .getByLabel(/invitation url/i)
      .fill("https://codeforces.com/contestInvitation/e2e123");
    await page.getByLabel(/stage/i).selectOption("QUALIFICATION");

    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const local = new Date(
      oneHourAgo.getTime() - oneHourAgo.getTimezoneOffset() * 60_000
    )
      .toISOString()
      .slice(0, 16);
    await page.getByLabel(/start date/i).fill(local);
    await page.getByLabel(/duration/i).fill("60");

    await page
      .getByRole("dialog")
      .getByRole("button", { name: /create contest/i })
      .click();

    await expect(page.getByText("E2E Qualification Round")).toBeVisible({
      timeout: 15_000,
    });

    // Publish — accept the browser confirm() dialog
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^publish$/i }).first().click();

    await page.waitForTimeout(1000);

    // ----------------------------------------------------------
    // Participant submits video
    // ----------------------------------------------------------
    await logout(page);
    await loginViaUi(page, participants[0].username, participants[0].password);

    await page.goto(`/dashboard/tournaments/${tournament._id}/contests`);
    await expect(page.getByText("E2E Qualification Round")).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByRole("button", { name: /joined on codeforces/i })
      .click();

    await expect(
      page.getByPlaceholder(/youtube\.com|streamable/i)
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByPlaceholder(/youtube\.com|streamable/i)
      .fill("https://www.youtube.com/watch?v=e2etest123");
    await page.getByRole("button", { name: /submit video/i }).click();

    await expect(page.getByText(/pending review/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // ----------------------------------------------------------
    // Admin approves video
    // ----------------------------------------------------------
    await logout(page);
    await loginViaUi(page, admin.username, admin.password);
    await page.goto("/admin/videos");

    // Select the E2E contest in the dropdown by reading its options
    const contestSelect = page.locator("select").first();
    if (await contestSelect.isVisible().catch(() => false)) {
      const optionValue = await contestSelect.evaluate(
        (select, name) => {
          const el = select as HTMLSelectElement;
          const match = Array.from(el.options).find((o) =>
            o.textContent?.includes(name as string)
          );
          return match?.value ?? null;
        },
        "E2E Qualification Round"
      );

      if (optionValue) {
        await contestSelect.selectOption(optionValue);
        await page.waitForTimeout(1500);
      }
    }

    // Filter chips use "Pending N" — no anchors
    await page.getByRole("button", { name: /pending/i }).first().click();

    // Wait for the review button
    const reviewBtn = page
      .getByRole("button", { name: /review submission|^review$/i })
      .first();
    await expect(reviewBtn).toBeVisible({ timeout: 15_000 });
    await reviewBtn.click();

    // Approve within the modal
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /approve/i })
      .click();

    await expect(page.getByText(/video approved/i)).toBeVisible({
      timeout: 15_000,
    });

    // ----------------------------------------------------------
    // Admin enters results — navigate directly to the results URL
    // ----------------------------------------------------------
    const contestId = await getContestId(request, admin.token, tournament._id);
    await page.goto(`/admin/contests/${contestId}/results`);

    // Wait for the roster table
    const solvedInputs = page.locator('input[type="number"]');
    await expect(solvedInputs.first()).toBeVisible({ timeout: 15_000 });

    // First participant: solved=3, penalty=10
    await solvedInputs.nth(0).fill("3");
    await solvedInputs.nth(1).fill("10");
    await page.getByRole("button", { name: /^save$/i }).nth(0).click();

    await expect(page.getByText(/result saved/i)).toBeVisible({
      timeout: 5_000,
    });

    // ----------------------------------------------------------
    // Final: admin dashboard shows the tournament
    // ----------------------------------------------------------
    await page.goto("/admin");
    await expect(page.getByText(tournamentName).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

/**
 * Helper — get the contest ID for the E2E contest via the admin API.
 */
async function getContestId(
  request: any,
  token: string,
  tournamentId: string
): Promise<string> {
  const res = await request.get(
    `http://localhost:5000/api/admin/tournaments/${tournamentId}/contests`,
    { headers: { Authorization: `Bearer ${token}` }, timeout: 30_000 }
  );
  const data = await res.json();
  const contest = (data.contests || []).find(
    (c: any) => c.name === "E2E Qualification Round"
  );
  if (!contest) throw new Error("E2E Qualification Round not found");
  return contest._id;
}