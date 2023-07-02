import { PrismaClient } from "@prisma/client";
import { env } from "@admin/src/env/server.mjs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		errorFormat: "colorless",
		log: ["query", "info", "warn", "error"],
	});

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;