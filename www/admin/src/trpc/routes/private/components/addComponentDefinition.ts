import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { privateProcedure } from "@/src/trpc";
import { displayNameRegex } from "@/src/utils/regex";
import { fieldDefSchema } from "./types";

export const addComponentDefinition = privateProcedure
	.input(
		z.object({
			name: z.string().regex(displayNameRegex),
			groupId: z.string().cuid(),
			fields: z.array(fieldDefSchema),
		}),
	)
	.mutation(async ({ input }) => {
		const alreadyExists = await prisma.componentDefinition.findUnique({
			where: {
				name: input.name,
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

		await prisma.$transaction(async (tx) => {
			const { id: componentDefinitionId } = await tx.componentDefinition.create({
				data: {
					name: input.name,
					group_id: input.groupId,
				},
			});
			await tx.componentDefinitionField.createMany({
				data: input.fields.map((field, i) => ({
					name: field.name,
					display_name: field.displayName,
					type: field.type,
					order: i,
					component_definition_id: componentDefinitionId,
					array_item_type: field.arrayItemType,
				})),
			});
		});
	});
