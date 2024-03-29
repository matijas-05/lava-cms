import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { privateProcedure } from "@/src/trpc";
import { urlRegex } from "@/src/utils/regex";

export const editPage = privateProcedure
	.input(
		z.object({
			id: z.string().cuid(),
			newName: z.string(),
			newUrl: z.string().regex(urlRegex),
		}),
	)
	.mutation(async ({ input }) => {
		const page = await prisma.page.findFirst({
			where: { id: input.id },
		});

		if (!page) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		try {
			await prisma.$transaction([
				prisma.page.update({
					where: { id: input.id },
					data: {
						name: input.newName,
						url: input.newUrl,
						last_update: new Date(),
					},
				}),
				prisma.$executeRaw`UPDATE page SET "url" = REPLACE("url", ${page.url} || '/', ${input.newUrl} || '/'), "last_update" = Now() WHERE "url" LIKE ${page.url} || '/%';`,
			]);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					throw new TRPCError({ code: "CONFLICT" });
				}
			} else throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
		}
	});
