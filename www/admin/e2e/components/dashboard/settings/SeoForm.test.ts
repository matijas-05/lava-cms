import { expect } from "@playwright/test";
import { test } from "@admin/e2e/fixtures";
import { init } from "api/server";
import { start, stop } from "@admin/e2e/mocks/trpc";
import { websiteSettingsMock } from "@admin/e2e/mocks/data";
import { trpc } from "@admin/src/utils/trpc";

const TEST_ID = "seo-form";

test.beforeAll(async () => {
	await start(await init());
});
test.afterAll(async () => {
	await stop();
});

test("light theme visual comparison", async ({ authedPage: page }) => {
	await page.emulateMedia({ colorScheme: "light" });
	await page.goto("/admin/dashboard/settings", { waitUntil: "networkidle" });

	expect(await page.getByTestId(TEST_ID).screenshot()).toMatchSnapshot();
});
test("dark theme visual comparison", async ({ authedPage: page }) => {
	await page.emulateMedia({ colorScheme: "dark" });
	await page.goto("/admin/dashboard/settings", { waitUntil: "networkidle" });

	expect(await page.getByTestId(TEST_ID).screenshot()).toMatchSnapshot();
});

test("website config displayed", async ({ authedPage: page }) => {
	await page.goto("/admin/dashboard/settings");

	const element = page.getByTestId(TEST_ID);
	await expect(element).toBeInViewport();
	await expect(element.locator("input[type='text']").first()).toHaveValue(
		websiteSettingsMock.title
	);
	await expect(element.locator("textarea")).toHaveValue(websiteSettingsMock.description);
	await expect(element.locator("input[type='text']").last()).toHaveValue(
		websiteSettingsMock.language
	);
});
test("website config updates", async ({ authedPage: page }) => {
	await page.goto("/admin/dashboard/settings", { waitUntil: "networkidle" });

	const element = page.getByTestId(TEST_ID);
	await element.locator("input[type='text']").first().fill("My new website");
	await element.locator("textarea").fill("My new website description");
	await element.locator("input[type='text']").last().fill("pl");
	await element.locator("button[type='submit']").click();

	await page.waitForResponse((res) => res.url().includes("/trpc/config"));

	const config = await trpc.config.getConfig.query();
	expect(config.title).toBe("My new website");
	expect(config.description).toBe("My new website description");
	expect(config.language).toBe("pl");

	await expect(page.locator("li[role=status]")).toContainText("Success");
});

test("notification shows error when error occurs", async ({ authedPage: page }) => {
	await page.goto("/admin/dashboard/settings", { waitUntil: "networkidle" });

	await page.route("**/trpc/config**", (route) => route.fulfill({ status: 500 }));
	const element = page.getByTestId(TEST_ID);
	await element.locator("input[type='text']").first().fill("My new website");
	await element.locator("textarea").fill("My new website description");
	await element.locator("input[type='text']").last().fill("pl");
	await element.locator("button[type='submit']").click();

	await expect(page.locator("li[role=alert]")).toContainText("Error");
});
test("shows field required errors", async ({ authedPage: page }) => {
	await page.goto("/admin/dashboard/settings", { waitUntil: "networkidle" });
	const element = page.getByTestId(TEST_ID);

	await element.locator("input[type='text']").first().fill("");
	await element.locator("textarea").fill("");
	await element.locator("input[type='text']").last().fill("");
	await element.locator("button[type='submit']").click();

	await expect(element.locator("input[type='text']").first()).toHaveAttribute(
		"aria-invalid",
		"true"
	);
	await expect(element.locator("input[type='text']").last()).toHaveAttribute(
		"aria-invalid",
		"true"
	);

	await expect(element).toHaveScreenshot();
});
test("shows error when language code invalid", async ({ authedPage: page }) => {
	await page.goto("/admin/dashboard/settings", { waitUntil: "networkidle" });

	const languageInput = page.locator("input[type='text']").nth(1);
	await languageInput.fill("invalid");
	await page.locator("button[type='submit']").click();

	await expect(languageInput).toHaveAttribute("aria-invalid", "true");
});