import type { ComponentFieldType } from "@prisma/client";
import { expect, type Locator, type Page } from "@playwright/test";
import { test } from "@/e2e/fixtures";
import { prisma } from "@/prisma/client";

const URL = "/admin/dashboard/components";

interface FieldDefinition {
	name: string;
	type: ComponentFieldType;
}
async function fillAddCompDefDialog(
	page: Page,
	name: string,
	fields?: FieldDefinition[],
	submit = true,
) {
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeInViewport();

	await dialog.locator("input[type='text']").first().fill(name);
	for (const field of fields ?? []) {
		await dialog.locator("input[name='name']").nth(1).fill(field.name);
		await dialog.getByRole("combobox").first().click();
		await page.getByRole("listbox").locator(`div[data-value='${field.type}']`).click();
		await dialog.locator("button[type='button']", { hasText: "Add" }).click();
	}
	if (submit) {
		await dialog.locator("button[type='submit']").click();
	}

	return dialog;
}
async function fillAddEditGroupDialog(page: Page, name: string) {
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeInViewport();
	await dialog.locator("input[type='text']").first().fill(name);
	await dialog.locator("button[type='submit']").click();

	return dialog;
}
async function fillEditCompDefDialog(page: Page, name?: string, fields?: FieldDefinition[]) {
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeInViewport();

	if (name) {
		await dialog.locator("input[type='text']").first().fill(name);
	}
	for (const field of fields ?? []) {
		await dialog.locator("input[name='name']").nth(1).fill(field.name);
		await dialog.getByRole("combobox").click();
		await page.getByRole("listbox").locator(`div[data-value='${field.type}']`).click();
		await dialog.locator("button[type='button']", { hasText: "Add" }).click();
	}
	// await dialog.locator("button[type='submit']").click();

	return dialog;
}
async function selectAction(page: Page, rowIndex: number, actionLabel: string) {
	await page.locator("tbody > tr").nth(rowIndex).locator("td").last().click();
	await page.getByRole("menu").getByRole("menuitem", { name: actionLabel }).click();
}

function getRow(page: Page, rowIndex: number) {
	return page.locator("tbody > tr").nth(rowIndex);
}
async function checkRow(
	page: Page,
	rowIndex: number,
	name: string,
	type: "Component Definition" | "Group",
) {
	const row = getRow(page, rowIndex);
	await expect(row.locator("td").nth(1)).toHaveText(name);
	await expect(row.locator("td").nth(3)).toHaveText(type);

	return row;
}
async function checkFieldDefs(page: Page, fieldDefs: FieldDefinition[]) {
	const fieldDefDivs = page.getByTestId("component-fields").locator("> div");
	for (const [i, fieldDef] of fieldDefs.entries()) {
		const fieldDefLabel = fieldDefDivs.nth(i).locator("span");
		await expect(fieldDefLabel.first()).toHaveText(fieldDef.name);
		await expect(fieldDefLabel.nth(1)).toHaveText(fieldDef.type, { ignoreCase: true });
	}
}

function getFieldDefCard(page: Page, nth: number): Locator {
	return page.getByTestId("component-fields").locator("> div").nth(nth);
}
async function editFieldDef(
	page: Page,
	nth: number,
	newName?: string,
	newType?: FieldDefinition["type"],
	save?: boolean,
): Promise<Locator> {
	const fieldDefCard = getFieldDefCard(page, nth);
	await fieldDefCard.click();

	const editFieldDefStep = page.getByRole("dialog");

	if (newName) {
		await editFieldDefStep.locator("input[name='name']").nth(2).fill(newName);
	}
	if (newType) {
		await editFieldDefStep.getByRole("combobox").click();
		await editFieldDefStep.getByRole("listbox").locator(`div[data-value='${newType}']`).click();
	}

	if (save) {
		await editFieldDefStep.locator("button[type='submit']").click();
		// If type changed warning dialog appears, confirm it
		if ((await page.getByRole("dialog").count()) > 1) {
			await page.locator("button[type='submit']").nth(1).click();
			await page.getByRole("dialog").nth(1).waitFor({ state: "hidden" });
		}
	}

	await editFieldDefStep.getByTestId("back-btn").click();

	return fieldDefCard;
}

test.afterEach(async () => {
	await prisma.componentDefinitionGroup.deleteMany();
});

test("displays message when no pages added", async ({ authedPage: page }) => {
	await page.goto(URL);
	await expect(page.base.locator("text=No results.")).toBeInViewport();
});

test("breadcrumbs", async ({ authedPage: page }) => {
	const rootGroup = await prisma.componentDefinitionGroup.findFirst();
	const group1 = await prisma.componentDefinitionGroup.create({
		data: {
			name: "Group 1",
			parent_group_id: rootGroup!.id,
		},
	});
	const group2 = await prisma.componentDefinitionGroup.create({
		data: {
			name: "Group 2",
			parent_group_id: group1.id,
		},
	});
	await prisma.componentDefinitionGroup.create({
		data: {
			name: "Group 3",
			parent_group_id: group2.id,
		},
	});

	await page.goto(URL);
	await expect(page.base.getByTestId("breadcrumbs")).toHaveCount(0);
	await page.base.getByRole("link", { name: "Group 1" }).click();
	await page.base.waitForURL(URL + "/" + group1.id);
	await page.base.getByRole("link", { name: "Group 2" }).click();
	await page.base.waitForURL(URL + "/" + group2.id);

	const breadcrumbs = page.base.getByTestId("breadcrumbs");
	await expect(breadcrumbs).toContainText("Group 1 Group 2");

	await breadcrumbs.getByRole("link", { name: "Group 1" }).click();
	await expect(page.base).toHaveURL(URL + "/" + group1.id);
	await expect(breadcrumbs).toContainText("Group 1");

	await breadcrumbs.getByRole("link").first().click();
	await expect(page.base).toHaveURL(URL);
	await expect(breadcrumbs).toHaveCount(0);
});

test("searchbox filters items", async ({ authedPage: page }) => {
	const rootGroup = await prisma.componentDefinitionGroup.findFirst();
	await prisma.componentDefinitionGroup.create({
		data: {
			name: "Group 1",
			parent_group_id: rootGroup!.id,
		},
	});
	await prisma.componentDefinition.create({
		data: {
			name: "Component 1",
			group_id: rootGroup!.id,
		},
	});

	await page.goto(URL);
	await expect(page.base.locator("tbody > tr")).toHaveCount(2);

	await page.base.locator("input[type='search']").type("Component");
	await expect(page.base.locator("tbody > tr")).toHaveCount(1);
	await checkRow(page.base, 0, "Component 1", "Component Definition");
});

test.describe("component definition", () => {
	test("adds component definition, invalid or duplicate name errors", async ({
		authedPage: page,
	}) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const existingComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: rootGroup!.id,
			},
		});

		await page.goto(URL);
		await page.base.getByTestId("add-item").click();

		const dialog = await fillAddCompDefDialog(page.base, existingComp.name, [
			{ name: "Label", type: "TEXT" },
		]);
		await expect(dialog.locator("input[name='name']").first()).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		await expect(dialog.locator("strong")).toHaveText(existingComp.name);

		await fillAddCompDefDialog(page.base, "  ", undefined, false);
		await expect(dialog.locator("input[name='name']").first()).toHaveAttribute(
			"aria-invalid",
			"true",
		);

		await fillAddCompDefDialog(page.base, "Test 2");

		await checkRow(page.base, 1, "Test 2", "Component Definition");
		const newComp = await prisma.componentDefinition.findFirst({
			where: { name: "Test 2" },
			include: {
				field_definitions: {
					select: { name: true, type: true },
				},
			},
		});
		expect(newComp!.field_definitions).toMatchObject([
			{
				name: "Label",
				type: "TEXT",
			} satisfies FieldDefinition,
		]);
	});

	test("deletes component definition", async ({ authedPage: page }) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: rootGroup!.id,
			},
		});

		await page.goto(URL);
		await selectAction(page.base, 0, "Delete");
		await page.base.getByRole("dialog").locator("button[type='submit']").click();

		await expect(page.base.locator("text=No results.")).toBeInViewport();
	});

	test("edits component definition (name & fields), shows field type changed warning", async ({
		authedPage: page,
	}) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const originalComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: rootGroup!.id,
				field_definitions: {
					createMany: {
						data: [
							{
								name: "Label",
								display_name: "Label",
								type: "TEXT",
								order: 0,
							},
							{
								name: "Description",
								display_name: "Description",
								type: "TEXT",
								order: 1,
							},
						],
					},
				},
			},
			include: {
				field_definitions: true,
			},
		});
		await page.goto(URL);
		const dialog = page.base.getByRole("dialog");

		await selectAction(page.base, 0, "Edit");
		await checkFieldDefs(page.base, originalComp.field_definitions);

		await dialog.locator("input[name='name']").first().fill("Edited name");
		const fieldDefCard = await editFieldDef(page.base, 0, "Switch", "SWITCH", false);
		await expect(fieldDefCard).toHaveAttribute("data-test-diff", "edited");
		await dialog.locator("button[type='submit']").click();
		await page.base.getByRole("dialog").nth(1).locator("button[type='submit']").click();
		await dialog.nth(1).waitFor({ state: "hidden" });
		await dialog.getByTestId("close-btn").click();

		const editedCompDef = await prisma.componentDefinition.findFirst({
			include: {
				field_definitions: {
					orderBy: { order: "asc" },
				},
			},
		});
		expect(editedCompDef?.name).toBe("Edited name");
		expect(editedCompDef!.field_definitions).toMatchObject([
			{
				name: "Switch",
				type: "SWITCH",
			} satisfies FieldDefinition,
			{
				name: "Description",
				type: "TEXT",
			} satisfies FieldDefinition,
		]);

		await checkRow(page.base, 0, "Edited name", "Component Definition");
		await selectAction(page.base, 0, "Edit");
		await checkFieldDefs(page.base, editedCompDef!.field_definitions);
	});
	test("edits component definition (name), duplicate name errors", async ({
		authedPage: page,
	}) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const existingComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: rootGroup!.id,
			},
		});
		const comp = await prisma.componentDefinition.create({
			data: {
				name: "Test 2",
				group_id: rootGroup!.id,
			},
		});

		await page.goto(URL);
		await selectAction(page.base, 1, "Edit");
		const dialog = page.base.getByRole("dialog");
		await dialog.locator("input[name='name']").first().fill(existingComp.name);
		await dialog.locator("button[type='submit']").click();

		await expect(dialog.locator("input[name='name']").first()).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		await expect(dialog.locator("strong")).toHaveText(existingComp.name);

		await dialog.locator("input[name='name']").first().fill("Test 3");
		await dialog.locator("button[type='submit']").click();

		await checkRow(page.base, 0, existingComp.name, "Component Definition");
		await checkRow(page.base, 1, comp.name, "Component Definition");
	});

	test("moves component definition", async ({ authedPage: page }) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const compDef = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: rootGroup!.id,
			},
		});
		const destination = await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 1",
				parent_group_id: rootGroup!.id,
			},
			include: {
				groups: true,
			},
		});

		await page.goto(URL);
		await selectAction(page.base, 1, "Move");

		const dialog = page.base.getByRole("dialog");
		await expect(dialog.getByRole("heading")).toHaveText(
			`Move component definition "${compDef.name}"`,
		);

		const combobox = dialog.getByRole("combobox");
		await combobox.click();

		const option = dialog.getByRole("option", { name: destination.name });
		await expect(option.locator("p > span")).toHaveText(
			`in ${rootGroup!.name}, contains ${destination.groups.length} items`,
		);
		await option.click();

		await dialog.locator("button[type='submit']").click();
		await page.base.waitForResponse("**/api/private/components.editComponentDefinition**");

		await getRow(page.base, 0).locator("td a").first().click();
		await checkRow(page.base, 0, compDef.name, "Component Definition");
	});

	test("duplicates component definition, duplicate name errors", async ({ authedPage: page }) => {
		const existingComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
			},
		});

		await page.goto(URL);
		await selectAction(page.base, 0, "Duplicate");
		const dialog = await fillAddCompDefDialog(page.base, existingComp.name, [
			{ name: "Label", type: "TEXT" },
		]);
		await expect(getFieldDefCard(page.base, 0)).not.toHaveAttribute("data-test-diff", "added");
		await expect(dialog.locator("input[name='name']").first()).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		await expect(dialog.locator("strong")).toHaveText(existingComp.name);

		await fillAddCompDefDialog(page.base, "Test 2", undefined, false);

		await dialog.locator("button[type='submit']").click();
		await dialog.waitFor({ state: "hidden" });

		const newComp = await prisma.componentDefinition.findFirst({
			where: { name: "Test 2" },
			include: {
				field_definitions: {
					select: { name: true, type: true },
				},
			},
		});
		expect(newComp!.field_definitions).toMatchObject([
			{
				name: "Label",
				type: "TEXT",
			} satisfies FieldDefinition,
		]);

		await checkRow(page.base, 1, "Test 2", "Component Definition");
	});
});

test.describe("field definition", () => {
	test("edits field definition but restores edit", async ({ authedPage: page }) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const originalComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: rootGroup!.id,
				field_definitions: {
					createMany: {
						data: [
							{
								name: "Label",
								display_name: "Label",
								type: "TEXT",
								order: 0,
							},
						],
					},
				},
			},
			include: {
				field_definitions: true,
			},
		});
		await page.goto(URL);

		await selectAction(page.base, 0, "Edit");
		const fieldDefCard = await editFieldDef(page.base, 0, "Switch", "SWITCH");

		await expect(fieldDefCard).toHaveAttribute("data-test-diff", "edited");
		await checkFieldDefs(page.base, [{ name: "Switch", type: "SWITCH" }]);

		await fieldDefCard.getByTestId("restore-field-btn").click();
		await page.base.getByRole("dialog").getByTestId("close-btn").click();
		await checkFieldDefs(page.base, originalComp.field_definitions);

		const editedButRestoredCompDef = await prisma.componentDefinition.findFirst({
			include: {
				field_definitions: {
					orderBy: { order: "asc" },
				},
			},
		});
		expect(editedButRestoredCompDef!.field_definitions).toMatchObject(
			originalComp.field_definitions,
		);

		await selectAction(page.base, 0, "Edit");
		await checkFieldDefs(page.base, editedButRestoredCompDef!.field_definitions);
	});

	test("adds field definition", async ({ authedPage: page }) => {
		await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
			},
		});
		await page.goto(URL);
		await selectAction(page.base, 0, "Edit");

		const dialog = await fillEditCompDefDialog(page.base, undefined, [
			{ name: "Label", type: "TEXT" },
		]);

		const fieldDef = getFieldDefCard(page.base, 0);
		await expect(fieldDef).toHaveAttribute("data-test-diff", "added");

		await dialog.locator("button[type='submit']").click();
		await page.base.waitForResponse("**/api/private/components.editComponentDefinition**");
		await page.base.waitForTimeout(100); // Webkit moment XD
		await dialog.getByTestId("close-btn").click();

		const addedCompDef = await prisma.componentDefinition.findFirst({
			include: {
				field_definitions: {
					orderBy: { order: "asc" },
				},
			},
		});
		expect(addedCompDef!.field_definitions).toMatchObject([
			{
				name: "Label",
				type: "TEXT",
			} satisfies FieldDefinition,
		]);

		await selectAction(page.base, 0, "Edit");
		await checkFieldDefs(page.base, addedCompDef!.field_definitions);
	});
	test("added field definition doesn't implement diff history", async ({ authedPage: page }) => {
		await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
			},
		});
		await page.goto(URL);
		await selectAction(page.base, 0, "Edit");

		await fillEditCompDefDialog(page.base, undefined, [{ name: "Label", type: "TEXT" }]);
		const fieldDef = getFieldDefCard(page.base, 0);

		// After edit its diff state doesn't change
		await editFieldDef(page.base, 0, "Edited", "NUMBER");
		await expect(fieldDef).toHaveAttribute("data-test-diff", "added");

		// After delete it is removed instantly
		await fieldDef.getByTestId("delete-field-btn").click();
		await expect(fieldDef).toBeHidden();
	});

	test("deletes field definition", async ({ authedPage: page }) => {
		await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
				field_definitions: {
					createMany: {
						data: [
							{
								name: "Label",
								display_name: "Label",
								type: "TEXT",
								order: 0,
							},
							{
								name: "Description",
								display_name: "Description",
								type: "TEXT",
								order: 1,
							},
						],
					},
				},
			},
			include: {
				field_definitions: true,
			},
		});
		await page.goto(URL);

		await selectAction(page.base, 0, "Edit");
		const fieldDef = getFieldDefCard(page.base, 0);
		await fieldDef.getByTestId("delete-field-btn").click({ clickCount: 2 });
		await expect(fieldDef).toHaveAttribute("data-test-diff", "deleted");

		const dialog = page.base.getByRole("dialog");
		await dialog.locator("button[type='submit']").click();
		await page.base.waitForResponse("**/api/private/components.editComponentDefinition**");
		await page.base.waitForTimeout(100);
		await dialog.getByTestId("close-btn").click();

		const editedCompDef = await prisma.componentDefinition.findFirst({
			include: {
				field_definitions: {
					orderBy: { order: "asc" },
				},
			},
		});
		expect(editedCompDef!.field_definitions).toMatchObject([
			{
				name: "Description",
				type: "TEXT",
			} satisfies FieldDefinition,
		]);

		await selectAction(page.base, 0, "Edit");
		await checkFieldDefs(page.base, editedCompDef!.field_definitions);
	});
	test("deletes field definition but restores", async ({ authedPage: page }) => {
		const originalComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
				field_definitions: {
					createMany: {
						data: [
							{
								name: "Label",
								display_name: "Label",
								type: "TEXT",
								order: 0,
							},
							{
								name: "Description",
								display_name: "Description",
								type: "TEXT",
								order: 1,
							},
						],
					},
				},
			},
			include: {
				field_definitions: true,
			},
		});
		await page.goto(URL);
		await selectAction(page.base, 0, "Edit");

		const fieldDef = getFieldDefCard(page.base, 0);
		await fieldDef.getByTestId("delete-field-btn").click({ clickCount: 2 });
		await expect(fieldDef).toHaveAttribute("data-test-diff", "deleted");
		await fieldDef.getByTestId("restore-field-btn").click();
		await expect(fieldDef).not.toHaveAttribute("data-test-diff", "deleted");

		const dialog = page.base.getByRole("dialog");
		await expect(dialog.locator("button[type='submit']")).toBeDisabled();
		await dialog.getByTestId("close-btn").click();

		const editedCompDef = await prisma.componentDefinition.findFirst({
			include: {
				field_definitions: {
					orderBy: { order: "asc" },
				},
			},
		});
		expect(editedCompDef!.field_definitions).toMatchObject(originalComp.field_definitions);

		await selectAction(page.base, 0, "Edit");
		await checkFieldDefs(page.base, originalComp.field_definitions);
	});

	test("traverses field definitions diff history", async ({ authedPage: page }) => {
		const originalComp = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
				field_definitions: {
					createMany: {
						data: [
							{
								name: "Label",
								display_name: "Label",
								type: "TEXT",
								order: 0,
							},
						],
					},
				},
			},
			include: {
				field_definitions: true,
			},
		});
		await page.goto(URL);

		await selectAction(page.base, 0, "Edit");
		await editFieldDef(page.base, 0, "Switch", "SWITCH");
		const fieldDefCard = getFieldDefCard(page.base, 0);
		await fieldDefCard.getByTestId("restore-field-btn").click();
		await expect(fieldDefCard).toHaveAttribute("data-test-diff", "none");

		await fieldDefCard.getByTestId("delete-field-btn").click();
		await expect(fieldDefCard).toHaveAttribute("data-test-diff", "deleted");
		await fieldDefCard.getByTestId("restore-field-btn").click();
		await expect(fieldDefCard).toHaveAttribute("data-test-diff", "none");

		await checkFieldDefs(page.base, [
			{
				name: originalComp.field_definitions[0]!.name,
				type: originalComp.field_definitions[0]!.type,
			},
		]);

		await checkFieldDefs(page.base, originalComp.field_definitions);
	});

	test("reorders field definitions", async ({ authedPage: page }) => {
		const compDef = await prisma.componentDefinition.create({
			data: {
				name: "Test",
				group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
				field_definitions: {
					createMany: {
						data: [
							{
								name: "Label",
								display_name: "Label",
								type: "TEXT",
								order: 0,
							},
							{
								name: "Description",
								display_name: "Description",
								type: "TEXT",
								order: 1,
							},
							{
								name: "State",
								display_name: "State",
								type: "SWITCH",
								order: 2,
							},
						],
					},
				},
			},
			include: {
				field_definitions: true,
			},
		});
		await page.goto(URL);

		await selectAction(page.base, 0, "Edit");
		const handle = getFieldDefCard(page.base, 2).locator("> div").first().getByRole("button");
		await handle.hover();
		await page.base.mouse.down();
		await getFieldDefCard(page.base, 1).locator("> div").first().hover();
		await page.base.mouse.up();

		await checkFieldDefs(page.base, [
			compDef.field_definitions[0]!,
			compDef.field_definitions[2]!,
			compDef.field_definitions[1]!,
		]);

		const dialog = page.base.getByRole("dialog");
		await dialog.locator("button[type='submit']").click();
		await page.base.waitForResponse("**/api/private/components.editComponentDefinition**");

		const reorderedCompDef = await prisma.componentDefinition.findFirst({
			include: {
				field_definitions: {
					orderBy: { order: "asc" },
				},
			},
		});
		expect(reorderedCompDef!.field_definitions).toMatchObject([
			compDef.field_definitions[0]!,
			{
				...compDef.field_definitions[2]!,
				order: 1,
			},
			{
				...compDef.field_definitions[1]!,
				order: 2,
			},
		]);
	});
});

test.describe("group", () => {
	test("adds group, invalid name errors", async ({ authedPage: page }) => {
		await page.goto(URL);
		await page.base.getByTestId("add-group").click();

		const dialog = await fillAddEditGroupDialog(page.base, "  ");
		await expect(dialog.locator("input[name='name']").first()).toHaveAttribute(
			"aria-invalid",
			"true",
		);

		await fillAddEditGroupDialog(page.base, "Group 1");
		await dialog.waitFor({ state: "hidden" });

		const addedGroup = await prisma.componentDefinitionGroup.findFirst({
			where: { name: "Group 1" },
		});
		await getRow(page.base, 0).getByRole("link").click();
		await page.base.waitForURL(URL + `/${addedGroup!.id}`);
		const breadcrumbs = page.base.getByTestId("breadcrumbs");
		await expect(breadcrumbs).toContainText("Group 1");
	});

	test("edits group", async ({ authedPage: page }) => {
		await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 1",
				parent_group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
			},
		});
		await page.goto(URL);

		await selectAction(page.base, 0, "Edit");
		const dialog = await fillAddEditGroupDialog(page.base, "Group 2");
		await dialog.waitFor({ state: "hidden" });

		await checkRow(page.base, 0, "Group 2", "Group");
	});

	test("moves group", async ({ authedPage: page }) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const group = await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 1",
				parent_group_id: rootGroup!.id,
			},
		});
		const destination = await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 2",
				parent_group_id: rootGroup!.id,
			},
			include: {
				groups: true,
			},
		});

		await page.goto(URL);
		await selectAction(page.base, 0, "Move");

		const dialog = page.base.getByRole("dialog");
		await expect(dialog.getByRole("heading")).toHaveText(`Move group "${group.name}"`);

		const combobox = dialog.getByRole("combobox");
		await combobox.click();

		const option = dialog.getByRole("option", { name: destination.name });
		await expect(option.locator("p > span")).toHaveText(
			`in ${rootGroup!.name}, contains ${destination.groups.length} items`,
		);
		await option.click();

		await dialog.locator("button[type='submit']").click();
		await dialog.waitFor({ state: "hidden" });

		await getRow(page.base, 0).locator("td a").first().click();
		await checkRow(page.base, 0, group.name, "Group");
	});

	test("deletes group", async ({ authedPage: page }) => {
		await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 1",
				parent_group_id: (await prisma.componentDefinitionGroup.findFirst())!.id,
			},
		});
		await page.goto(URL);

		await selectAction(page.base, 0, "Delete");
		await page.base.getByRole("dialog").locator("button[type='submit']").click();

		await expect(page.base.locator("text=No results.")).toBeInViewport();
	});
});

test.describe("bulk", () => {
	test("deletes items and their children", async ({ authedPage: page }) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 1",
				parent_group_id: rootGroup!.id,
			},
		});
		await prisma.componentDefinition.create({
			data: {
				name: "Component Definition 1",
				group_id: rootGroup!.id,
			},
		});

		await page.goto(URL);
		await getRow(page.base, 0).locator("td").first().click();
		await getRow(page.base, 1).locator("td").first().click();

		await page.base.locator("thead > tr > th").last().click();
		await page.base.getByRole("menu").getByRole("menuitem", { name: "Delete" }).click();
		await page.base.getByRole("dialog").locator("button[type='submit']").click();

		await expect(page.base.locator("text=No results.")).toBeInViewport();
	});

	test("moves items and their children", async ({ authedPage: page }) => {
		const rootGroup = await prisma.componentDefinitionGroup.findFirst();
		const group = await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 1",
				parent_group_id: rootGroup!.id,
			},
		});
		const destination = await prisma.componentDefinitionGroup.create({
			data: {
				name: "Group 2",
				parent_group_id: rootGroup!.id,
			},
		});
		const compDef = await prisma.componentDefinition.create({
			data: {
				name: "Component Definition 1",
				group_id: rootGroup!.id,
			},
		});

		await page.goto(URL);
		await getRow(page.base, 0).locator("td").first().click();
		await getRow(page.base, 1).locator("td").first().click();

		await page.base.locator("thead > tr > th").last().click();
		await page.base.getByRole("menu").getByRole("menuitem", { name: "Move" }).click();

		const dialog = page.base.getByRole("dialog");
		await dialog.getByRole("combobox").click();
		await dialog.getByRole("option", { name: destination.name }).click();
		await dialog.locator("button[type='submit']").click();
		await dialog.waitFor({ state: "hidden" });

		await getRow(page.base, 0).locator("td a").first().click();
		await checkRow(page.base, 0, compDef.name, "Component Definition");
		await checkRow(page.base, 1, group.name, "Group");
	});
});
