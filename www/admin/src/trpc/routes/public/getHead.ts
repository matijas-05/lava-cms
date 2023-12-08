import { publicProcedure } from "@admin/src/trpc";
import { prisma } from "@admin/prisma/client";

export const getHead = publicProcedure.query(async () => {
	const config = await prisma.settingsSeo.findFirstOrThrow();
	const { id, ...rest } = config;

	return rest;
});