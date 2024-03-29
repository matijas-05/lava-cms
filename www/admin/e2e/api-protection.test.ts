import { expect } from "@playwright/test";
import { test } from "./fixtures";
import {
	DEFAULT_SESSION_COOKIE_NAME,
	connectionSettingsMock,
	createMockUser,
	deleteMockUser,
} from "./mocks";

test.beforeAll(async () => {
	await createMockUser();
});
test.afterAll(async () => {
	await deleteMockUser();
});

test.describe("private API", () => {
	test("returns 401 if no or invalid cookie is provided", async ({ request }) => {
		const res = await request.get("/admin/api/private/auth.getToken", {
			headers: {
				Cookie: `${DEFAULT_SESSION_COOKIE_NAME}=invalid`,
			},
		});
		expect(res.status()).toBe(401);
	});

	test("returns 200 if valid cookie is provided", async ({ authedRequest: request }) => {
		const res = await request.get("/admin/api/private/auth.getToken");
		expect(res.status()).toBe(200);
	});
});

test.describe("public API", () => {
	test("returns 401 if no or invalid token provided", async ({ request }) => {
		const res = await request.get("/admin/api/public/getHead");
		expect(res.status()).toBe(401);

		const res2 = await request.get("/admin/api/public/getHead", {
			headers: {
				Authorization: "Bearer token",
			},
		});
		expect(res2.status()).toBe(401);
	});

	test("returns 200 if valid token is provided", async ({ authedRequest: request }) => {
		const res = await request.get("/admin/api/public/getHead", {
			headers: { Authorization: `Bearer ${connectionSettingsMock.token}` },
		});
		expect(res.status()).toBe(200);
	});
});
