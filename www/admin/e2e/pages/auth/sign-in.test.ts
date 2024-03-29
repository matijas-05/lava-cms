import { expect } from "@playwright/test";
import { test } from "@/e2e/fixtures";
import { createMockUser, deleteMockUser, userMock, userPasswordDecrypted } from "@/e2e/mocks";
import { prisma } from "@/prisma/client";

test.beforeAll(async () => {
	await createMockUser();
	await prisma.settingsSeo.create({
		data: {
			title: "My website",
			description: "My website description",
			language: "en",
		},
	});
});
test.afterAll(async () => {
	await deleteMockUser();
	await prisma.settingsSeo.deleteMany();
});

test("light theme visual comparison", async ({ page }) => {
	await page.emulateMedia({ colorScheme: "light" });
	await page.goto("/admin/signin");
	await expect(page).toHaveScreenshot();
});
test("dark theme visual comparison", async ({ page }) => {
	await page.emulateMedia({ colorScheme: "dark" });
	await page.goto("/admin/signin");
	await expect(page).toHaveScreenshot();
});

test("shows 'field required' errors", async ({ page }) => {
	await page.goto("/admin/signin");
	await page.click("button[type=submit]");
	await expect(page).toHaveScreenshot();
});

test("shows error when invalid credentials", async ({ page }) => {
	await page.goto("/admin/signin");
	const emailInput = page.locator("input[type='email']");
	const passwordInput = page.locator("input[type='password']");
	const submitButton = page.locator("button[type='submit']");

	// Wrong email
	await emailInput.type("wrong@email.com");
	await passwordInput.type(userPasswordDecrypted);
	await submitButton.click();
	await expect(page.locator("text=Your credentials are invalid.")).toBeInViewport();
	await clearInputs();

	// Wrong password
	await emailInput.type(userMock.email);
	await passwordInput.type("wrongpassword");
	await submitButton.click();
	await expect(page.locator("text=Your credentials are invalid.")).toBeInViewport();
	await clearInputs();

	// Both wrong
	await emailInput.type("wrong@email.com");
	await passwordInput.type("wrongpassword");
	await submitButton.click();
	await expect(page.locator("text=Your credentials are invalid.")).toBeInViewport();

	await expect(page).toHaveScreenshot();

	async function clearInputs() {
		await emailInput.fill("");
		await passwordInput.fill("");
	}
});

test("shows error when server error", async ({ page }) => {
	await page.goto("/admin/signin");
	await page.locator("input[type='email']").type(userMock.email);
	await page.locator("input[type='password']").type(userPasswordDecrypted);
	await page.route("**/api/private/auth.signIn**", (route) =>
		route.fulfill({
			body: JSON.stringify({
				url: "http://localhost:3001/admin/api/auth/error?error=UnknownError&provider=credentials",
			}),
			status: 500,
		}),
	);
	await page.locator("button[type='submit']").click();

	await expect(page.getByRole("alert").first()).toContainText(
		"Something went wrong. Try again later.",
	);
	await expect(page).toHaveScreenshot();
});

test("shows error when email invalid", async ({ page }) => {
	await page.goto("/admin/signin");
	await page.click("button[type=submit]");
	await page.locator("input[type='email']").type("invalid@domain");

	await expect(page.locator("text=The e-mail you provided is invalid.")).toBeInViewport();
});

test("signs in when credentials are valid", async ({ authedPage: page }) => {
	// We need authedPage for properly initializing all required data in the database
	await page.base.context().clearCookies();

	await page.goto("/admin/signin");
	await page.base.locator("input[type='email']").fill(userMock.email);
	await page.base.locator("input[type='password']").fill(userPasswordDecrypted);
	await page.base.locator("button[type='submit']").click();

	await page.base.waitForURL(/\/admin\/dashboard/);

	await expect(page.base.locator("#content").first()).toBeInViewport();
});
