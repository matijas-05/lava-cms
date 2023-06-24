import { expect } from "@playwright/test";
import { prisma } from "@admin/prisma/client";
import { test } from "@admin/e2e/fixtures";
import { userMock } from "@admin/e2e/mocks/data";

const NAME = "John";
const LAST_NAME = "Doe";
const EMAIL = "johndoe@domain.com";
const PASSWORD = "Zaq1@wsx";

test.describe("sign up step", () => {
	test.afterAll(async () => {
		await prisma.user.deleteMany();
	});

	test("light theme visual comparison", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/admin/setup", { waitUntil: "networkidle" });
		await expect(page).toHaveScreenshot();
	});
	test("dark theme visual comparison", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/admin/setup", { waitUntil: "networkidle" });
		await expect(page).toHaveScreenshot();
	});

	test("shows 'field required' errors", async ({ page }) => {
		await page.goto("/admin/setup");
		await page.click("button[type='submit']");
		await expect(page).toHaveScreenshot();
	});

	test("shows error when email invalid", async ({ page }) => {
		await page.goto("/admin/setup");
		await page.locator("input[type='email']").type("invalid@domain");
		await page.locator("button[type='submit']").click();

		await expect(page.locator("text=The e-mail you provided is invalid.")).toBeInViewport();
	});

	test("shows error when password invalid", async ({ page }) => {
		await page.goto("/admin/setup");

		await page.locator("button[type='submit']").click();
		const passwordField = page.locator("input[type='password']").first();

		passwordField.first().fill("pass");
		await expect(
			page.locator("text=The password must be at least 8 characters long.")
		).toBeInViewport();

		passwordField.first().fill("12345678");
		await expect(
			page.locator("text=The password must contain at least one lowercase letter.")
		).toBeInViewport();

		passwordField.first().fill("password");
		await expect(
			page.locator("text=The password must contain at least one uppercase letter.")
		).toBeInViewport();

		passwordField.first().fill("Password");
		await expect(
			page.locator("text=The password must contain at least one digit.")
		).toBeInViewport();

		passwordField.first().fill("Password1");
		await expect(page.locator("input[type='password']").first()).toHaveAttribute(
			"aria-invalid",
			"false"
		);
	});

	test("shows error when passwords don't match", async ({ page }) => {
		await page.goto("/admin/setup");

		await page.locator("button[type='submit']").click();
		await page.locator("input[type='password']").nth(1).type("password");

		await expect(page.locator("text=The passwords do not match.")).toBeInViewport();
	});

	test("goes to the next step when info is valid", async ({ page }) => {
		await page.goto("/admin/setup");

		await page.locator("input[type='email']").type(EMAIL);
		await page.locator("input[type='text']").first().type(NAME);
		await page.locator("input[type='text']").nth(1).type(LAST_NAME);
		await page.locator("input[type='password']").first().type(PASSWORD);
		await page.locator("input[type='password']").nth(1).type(PASSWORD);
		await page.locator("button[type='submit']").click();

		await page.waitForSelector("text='Set up website'");
		await expect(page.getByTestId("setup-form")).toBeInViewport();
		expect(page.url()).toMatch(/\/admin\/setup/);
	});
});

test.describe("setup website step", () => {
	test.beforeAll(async () => {
		await prisma.user.create({
			data: {
				...userMock,
			},
		});
	});
	test.afterEach(async () => {
		await prisma.page.deleteMany();
	});
	test.afterAll(async () => {
		await prisma.user.deleteMany();
		await prisma.config.deleteMany();
		await prisma.page.deleteMany();
	});

	test("light theme visual comparison", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/admin/setup", { waitUntil: "networkidle" });
		await expect(page).toHaveScreenshot();
	});
	test("dark theme visual comparison", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/admin/setup", { waitUntil: "networkidle" });
		await expect(page).toHaveScreenshot();
	});

	test("shows 'field required' errors", async ({ page }) => {
		await page.goto("/admin/setup");
		await page.click("button[type='submit']");
		await expect(page).toHaveScreenshot();
	});

	test("shows error when language code invalid", async ({ page }) => {
		await page.goto("/admin/setup");
		await page.locator("input[type='text']").first().type("My website");

		const languageInput = page.locator("input[type='text']").nth(1);
		await languageInput.type("invalid");
		await page.locator("button[type='submit']").click();

		await expect(languageInput).toHaveAttribute("aria-invalid", "true");
	});

	test("go to dashboard when info is valid", async ({ authedPage }) => {
		// authedPage fixture automatically creates a config and a Root page
		// we don't want that for this test because if it exists
		// then it will redirect to /dashboard
		await prisma.config.deleteMany();
		await prisma.page.deleteMany();

		await authedPage.goto("/admin/setup", { waitUntil: "networkidle" });
		await authedPage.locator("input[type='text']").first().type("My website");
		await authedPage.locator("input[type='text']").nth(1).type("en");
		await authedPage.locator("button[type='submit']").click();
		await authedPage.waitForURL(/dashboard/);

		expect(authedPage.url()).toMatch(/dashboard/);
		await expect(authedPage.locator("#content").first()).toBeInViewport();
	});
});
