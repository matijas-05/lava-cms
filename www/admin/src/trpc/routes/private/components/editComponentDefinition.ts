import { z } from "zod";
import { privateProcedure } from "@admin/src/trpc";
import { ComponentFieldDefinitionSchema } from "@admin/prisma/generated/zod";
import { prisma } from "@admin/prisma/client";
import { TRPCError } from "@trpc/server";

export const editComponentDefinition = privateProcedure
	.input(
		z.object({
			id: z.string().cuid(),
			newName: z.string().optional(),
			newGroupId: z.string().cuid().optional(),
			addedFields: z
				.array(ComponentFieldDefinitionSchema.pick({ name: true, type: true, order: true }))
				.optional(),
			editedFields: z
				.array(ComponentFieldDefinitionSchema.omit({ component_definition_id: true }))
				.optional(),
			deletedFieldIds: z.array(z.string().cuid()).optional(),
		}),
	)
	.mutation(async ({ input }) => {
		// If editing, not moving the component definition
		if (input.newName && !input.newGroupId) {
			const alreadyExists = await prisma.componentDefinition.findUnique({
				where: {
					name: input.newName,
				},
				include: {
					group: true,
				},
			});
			if (alreadyExists) {
				throw new TRPCError({
					code: "CONFLICT",
					message: JSON.stringify({
						name: alreadyExists.group.name,
						id: alreadyExists.group_id,
					}),
				});
			}
		}

		await prisma.componentDefinition.update({
			where: { id: input.id },
			data: {
				name: input.newName,
				group_id: input.newGroupId,
				field_definitions: {
					create: input.addedFields,
					update: input.editedFields?.map((field) => ({
						where: { id: field.id },
						data: field,
					})),
					delete: input.deletedFieldIds?.map((id) => ({ id })),
				},
				last_update: new Date(),
			},
		});
	});
