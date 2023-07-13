import { prisma } from "@admin/prisma/client";
import type { Page } from "@admin/prisma/types";
import { privateProcedure } from "@admin/src/trpc";

export const getAllGroups = privateProcedure.query(async (): Promise<Page[]> => {
	return prisma.page.findMany({
		where: { is_group: true },
	});
});
