import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import dotenv from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: ".env.test" });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
	testDir: "./e2e",
	/* Maximum time one test can run for. */
	timeout: 30000,
	expect: {
		/**
		 * Maximum time expect() should wait for the condition to be met.
		 * For example in `await expect(locator).toHaveText();`
		 */
		timeout: 5000,
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
		},
		toMatchSnapshot: {
			maxDiffPixelRatio: 0.01,
		},
	},
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	retries: 1,
	/* Opt out of parallel tests. */
	workers: 1,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [["html", { open: process.env.CI ? "never" : "on-failure" }]],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		baseURL: "http://localhost:3001",
		trace: "on-first-retry",
		video: "on-first-retry",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				contextOptions: {
					permissions: ["clipboard-read", "clipboard-write"],
				},
			},
		},

		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
			},
		},

		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
			},
			retries: 2,
		},

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: {
		//     ...devices['Pixel 5'],
		//   },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: {
		//     ...devices['iPhone 12'],
		//   },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: {
		//     channel: 'msedge',
		//   },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: {
		//     channel: 'chrome',
		//   },
		// },
	],

	/* Folder for test artifacts such as screenshots, videos, traces, etc. */
	// outputDir: 'test-results/',

	/* Run your local dev server before starting the tests */
	webServer: {
		// Run only the admin server
		command: process.env.CI ? "pnpm start" : "pnpm dev",
		url: "http://localhost:3001/admin/api/health",
		reuseExistingServer: false,
	},
};

export default config;
