import type { BrowserContextOptions, Page, Browser } from "@playwright/test";
import fs from "node:fs";
import { prisma } from "api/prisma/client";
import { init } from "api/server";
import { server, start, stop } from "@admin/e2e/mocks/trpc";
import { userMock, userPasswordDecrypted, websiteSettingsMock } from "@admin/e2e/mocks/data";

export const STORAGE_STATE_PATH = "./e2e/storageState.json";

export const authedPage = async (
	{ browser }: { browser: Browser },
	use: (r: Page) => Promise<void>
) => {
	// We have to check if the user exists because a test might create one
	const existingUser = await prisma.user.findFirst();
	const { id } =
		existingUser ??
		(await prisma.user.create({
			data: {
				...userMock,
			},
		}));

	if (!(await prisma.config.findFirst())) {
		await prisma.config.create({
			data: {
				...websiteSettingsMock,
			},
		});
	}
	await prisma.page.create({
		data: {
			name: "Root",
			url: "",
			is_group: true,
			parent_id: null,
		},
	});

	if (!fs.existsSync(STORAGE_STATE_PATH)) {
		await saveSignedInState(browser);
		console.log("Saved signed in state");
	}

	// Check if cookies are not expired
	const storageState: BrowserContextOptions["storageState"] = JSON.parse(
		fs.readFileSync(STORAGE_STATE_PATH, "utf-8")
	);

	if (typeof storageState !== "string" && typeof storageState !== "undefined") {
		const cookies = storageState.cookies;
		const expiredCookies = cookies.filter(
			(cookie) => cookie.expires !== -1 && cookie.expires * 1000 < Date.now()
		);

		if (expiredCookies.length > 0) {
			await saveSignedInState(browser);
			console.log("Cookies expired; saved signed in state.");
		}
	} else {
		throw new Error("Could not parse storage state");
	}

	const context = await browser.newContext({
		storageState: STORAGE_STATE_PATH,
	});
	const authedPage = await context.newPage();

	// Run test
	await use(authedPage);

	// We have to check if a user exists because a test
	// might delete an already created user
	if (await prisma.user.findFirst()) {
		await prisma.user.delete({ where: { id: id } });
	}
	if (await prisma.config.findFirst()) {
		await prisma.config.deleteMany();
	}
	await prisma.page.deleteMany();
};

async function saveSignedInState(browser: Browser) {
	let wasAlreadyStarted = false;

	if (!server) {
		await start(await init());
	} else {
		wasAlreadyStarted = true;
	}

	const page = await browser.newPage();

	await page.goto("/admin/signin", { waitUntil: "networkidle" });
	await page.locator("input[name='email']").type(userMock.email);
	await page.locator("input[name='password']").type(userPasswordDecrypted);
	await page.locator("button[type='submit']").click();

	await page.waitForURL(/\/admin\/dashboard/);

	const cookies = await page.context().cookies();
	const whitelist = ["next-auth.csrf-token", "next-auth.callback-url", "next-auth.session-token"];

	const cookiesToDelete = cookies
		.filter((cookie) => !whitelist.includes(cookie.name))
		.map((cookie) => cookies.indexOf(cookie));

	cookiesToDelete.forEach((index) => cookies.splice(index, 1));

	await page.context().clearCookies();
	await page.context().addCookies(cookies);

	await page.context().storageState({ path: STORAGE_STATE_PATH });
	await page.close();

	if (!wasAlreadyStarted) {
		await stop();
	}
}
