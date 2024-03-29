import cuid from "cuid";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { privateProcedure } from "@/src/trpc";
import { arrayItemSchema, componentSchema } from "./types";

const addedComponentSchema = z.object({
	frontendId: z.string().cuid(),
	pageId: z.string().cuid(),
	parentFieldId: z.string().cuid().nullable(),
	parentArrayItemId: z.string().cuid().nullable(),
	definition: z.object({
		id: z.string().cuid(),
		name: z.string(),
	}),
	order: z.number(),
	fields: z.array(
		z.object({
			frontendId: z.string().cuid(),
			data: z.string(),
			serializedRichText: z.string().nullable(),
			definitionId: z.string().cuid(),
		}),
	),
});

const addedArrayItemSchema = arrayItemSchema.omit({ id: true }).extend({
	frontendId: z.string().cuid(),
});

export const editPageComponents = privateProcedure
	.input(
		z.object({
			pageId: z.string().cuid(),

			addedComponents: z.array(addedComponentSchema),
			editedComponents: z.array(componentSchema),
			deletedComponentIds: z.array(z.string().cuid()),

			addedArrayItems: z.array(addedArrayItemSchema),
			editedArrayItems: z.array(arrayItemSchema),
			deletedArrayItemIds: z.array(z.string().cuid()),
		}),
	)
	.mutation(async ({ input }): Promise<Record<string, string>> => {
		const addedComponentIds: Record<string, string> = {};
		for (const comp of input.addedComponents) {
			addedComponentIds[comp.frontendId] = cuid();
		}

		const addedArrayItemIds: Record<string, string> = {};
		for (const item of input.addedArrayItems) {
			addedArrayItemIds[item.frontendId] = cuid();
		}

		const addedFieldIds: Record<string, string> = {};
		for (const comp of input.addedComponents) {
			for (const field of comp.fields) {
				addedFieldIds[field.frontendId] = cuid();
			}
		}

		// NOTE: We don't have to manually delete any nested components (even when they're inside array items) when their parents are deleted,
		// because those components have parentArrayItemId/parentFieldId set. So when the parent component is deleted (and its fields),
		// all components/array items which reference any of its fields are also deleted all the way down the tree.
		await prisma.$transaction(async (tx) => {
			// Has to be before the added components because otherwise when replacing a component, parent_field_id unique constraint would fail
			// Delete components
			await tx.componentInstance.deleteMany({
				where: {
					id: {
						in: input.deletedComponentIds,
					},
				},
			});

			// Add new components
			const addedComponents = input.addedComponents.map((component) => {
				let parentFieldId = component.parentFieldId;
				if (parentFieldId !== null && parentFieldId in addedFieldIds) {
					parentFieldId = addedFieldIds[parentFieldId]!;
				}

				return tx.componentInstance.create({
					data: {
						id: addedComponentIds[component.frontendId],
						page_id: component.pageId,
						parent_field_id: parentFieldId,
						parent_array_item_id: null, // Updates after creating array items to prevent circular dependency foreign key error
						definition_id: component.definition.id,
						order: component.order,
						fields: {
							createMany: {
								data: component.fields.map((field) => ({
									id: addedFieldIds[field.frontendId],
									data: field.data,
									serialized_rich_text: field.serializedRichText,
									field_definition_id: field.definitionId,
								})),
							},
						},
					},
				});
			});
			await Promise.all(addedComponents);

			// Edit existing components
			const editedComponents = input.editedComponents.map((component) =>
				tx.componentInstance.update({
					where: { id: component.id },
					data: {
						order: component.order,
						definition_id: component.definition.id,
						parent_field_id: component.parentFieldId,
						fields: {
							updateMany: component.fields.map((field) => ({
								where: { id: field.id },
								data: {
									data: field.data,
									serialized_rich_text: field.serializedRichText,
								},
							})),
						},
					},
				}),
			);
			await Promise.all(editedComponents);

			// Add new array items
			await tx.arrayItem.createMany({
				data: input.addedArrayItems.map((item) => ({
					id: addedArrayItemIds[item.frontendId],
					data: item.data,
					order: item.order,
					parent_field_id:
						item.parentFieldId in addedFieldIds
							? addedFieldIds[item.parentFieldId]!
							: item.parentFieldId,
				})),
			});

			// Update parent_array_item_id for added components (couldn't do it earlier because of circular dependency foreign key error)
			const updatedParentArrayItemIds = input.addedComponents
				.filter((item) => item.parentArrayItemId)
				.map((item) =>
					tx.componentInstance.update({
						where: { id: addedComponentIds[item.frontendId] },
						data: {
							parent_array_item_id:
								addedArrayItemIds[item.parentArrayItemId!] ??
								item.parentArrayItemId, // If replacing a component in an array item, there is not added array item
						},
					}),
				);
			await Promise.all(updatedParentArrayItemIds);

			// Edit existing array items
			const editedArrayItems = input.editedArrayItems.map((item) =>
				tx.arrayItem.update({
					where: { id: item.id },
					data: {
						data: item.data,
						order: item.order,
					},
				}),
			);
			await Promise.all(editedArrayItems);

			// Delete array items
			await tx.arrayItem.deleteMany({
				where: {
					id: {
						in: input.deletedArrayItemIds,
					},
				},
			});

			await tx.page.update({
				where: { id: input.pageId },
				data: {
					last_update: new Date(),
				},
			});
		});

		return addedComponentIds;
	});
