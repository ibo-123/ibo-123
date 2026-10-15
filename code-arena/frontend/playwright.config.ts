import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
        testDir: "./e2e",
        fullyParallel: false,
        workers: 1,
        forbidOnly: !!process.env.CI,
        retries: process.env.CI ? 1 : 0,
        reporter: process.env.CI ? "line" : "list",

        use: {
                baseURL: "http://localhost:8080",
                trace: "on-first-retry",
                screenshot: "only-on-failure",
                video: "retain-on-failure",
                actionTimeout: 10_000,
                navigationTimeout: 15_000,

                // Only the Chromium launch arg — no `proxy:` line
                launchOptions: {
                        args: ["--no-proxy-server"],
                },
        },

        projects: [
                {
                        name: "chromium",
                        use: { ...devices["Desktop Chrome"] },
                },
        ],

        webServer: [
                {
                        command: "cd ../backend && npm run dev",
                        url: "http://localhost:5000/api/health",
                        reuseExistingServer: !process.env.CI,
                        timeout: 30_000,
                },
                {
                        command: "npm run dev",
                        url: "http://localhost:8080",
                        reuseExistingServer: !process.env.CI,
                        timeout: 30_000,
                },
        ],
});