import { TRPCError, initTRPC } from "@trpc/server";
import { headers } from "next/headers";
import { SuperJSON } from "superjson";
import { prisma } from "@/prisma/client";
import { auth, validateRequest } from "@/src/auth";
import { env } from "../env/server.mjs";

export interface ServerMeta {
	noAuth: boolean;
}

const t = initTRPC.meta<ServerMeta>().create({ transformer: SuperJSON });

export const router = t.router;

export const privateAuth = t.middleware(async (opts) => {
	// CSRF protection
	if (opts.type === "mutation") {
		if (!headers().has("Origin") && !headers().has("Referer")) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}

		const origin = new URL(headers().get("Origin") ?? headers().get("Referer")!).host;
		const allowedOrigins = env.ALLOWED_ORIGINS?.split(",").map(
			(origin) => new URL(origin).host,
		);

		if (origin !== headers().get("Host") && !allowedOrigins?.includes(origin)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
	}

	if (opts.meta?.noAuth || (await prisma.adminUser.count()) === 0) {
		return opts.next();
	}

	const { session } = await validateRequest();
	if (!session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return opts.next();
});
export const publicAuth = t.middleware(async (opts) => {
	const authHeader = headers().get("Authorization");
	if (!authHeader) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	const cookieToken = auth.readBearerToken(authHeader);
	if (!cookieToken || cookieToken !== (await prisma.settingsConnection.findFirst())?.token) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return opts.next();
});

export const privateProcedure = t.procedure.use(privateAuth);
export const publicProcedure = t.procedure.use(publicAuth);
