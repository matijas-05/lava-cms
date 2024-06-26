import { prisma } from "@/prisma/client";
import { privateProcedure } from "@/src/trpc";

export const getSeoSettings = privateProcedure.query(async () => {
	const settings = await prisma.settingsSeo.findFirstOrThrow({ omit: { id: true } });
	return settings;
});
