import { z } from "zod";
import { prisma } from "@api/prisma/client";
import { publicProcedure } from "@api/trpc";

export const deletePage = publicProcedure
	.input(
		z.object({
			id: z.string().cuid(),
		})
	)
	.mutation(async ({ input }) => {
		await prisma.page.deleteMany({
			where: {
				OR: [{ id: input.id }, { parent_id: input.id }],
			},
		});
	});
