import { Page, expect } from "@playwright/test";

const API_URL = "http://localhost:5000/api";

export const unique = () =>
        `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface RegisterResult {
        username: string;
        password: string;
        email: string;
        token: string;
        userId: string;
}

export async function registerViaApi(
        request: any,
        role: "USER" | "ADMIN" = "USER"
): Promise<RegisterResult> {
        const suffix = unique();
        const username = `${role.toLowerCase()}_${suffix}`;
        const email = `${username}@test.com`;
        const password = "Password123!";

        const res = await request.post(`${API_URL}/auth/register`, {
                data: { username, email, password, name: `Test ${role}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        return {
                username,
                password,
                email,
                token: body.token,
                userId: body.user._id,
        };
}

export async function loginAsAdmin(request: any): Promise<RegisterResult> {
        const username = process.env.E2E_ADMIN_USERNAME || "admin";
        const password = process.env.E2E_ADMIN_PASSWORD || "admin123";

        const res = await request.post(`${API_URL}/auth/login`, {
                data: { username, password },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        return {
                username,
                password,
                email: body.user.email,
                token: body.token,
                userId: body.user._id,
        };
}

/**
 * Logs in via the UI.
 *
 * Selectors:
 *   - Username field: has `placeholder="Your username"`
 *   - Password field: no placeholder — matched by input[type="password"]
 *   - Submit button: "Sign In"
 */
export async function loginViaUi(
        page: Page,
        username: string,
        password: string
) {
        await page.goto("/login");

        await page.getByPlaceholder(/your username/i).fill(username);
        await page.locator('input[type="password"]').first().fill(password);

        await page.getByRole("button", { name: /sign in|sign-in|login/i }).click();

        await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
}

export async function logout(page: Page) {
        const candidates = [
                page.getByRole("button", { name: /logout|sign out/i }),
                page.getByRole("link", { name: /logout|sign out/i }),
        ];

        for (const btn of candidates) {
                if (await btn.isVisible().catch(() => false)) {
                        await btn.click();
                        await page.waitForTimeout(500);
                        return;
                }
        }

        // Fallback: clear localStorage and go home
        await page.evaluate(() => {
                localStorage.removeItem("code-arena-token");
                localStorage.removeItem("code-arena-user");
        });
        await page.goto("/");
}