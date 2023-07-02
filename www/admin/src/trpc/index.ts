import { cookies } from "next/headers";
import { TRPCError, initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { auth } from "@admin/src/auth";
import { prisma } from "@admin/prisma/client";

interface Meta {
	noAuth: boolean;
}

const t = initTRPC.meta<Meta>().create({ transformer: SuperJSON });

export const router = t.router;

export const privateAuth = t.middleware(async (opts) => {
	const authReq = auth.handleRequest({
		request: null,
		cookies,
	});
	const session = await authReq.validate();
	const context = {
		setSession: authReq.setSession,
		session,
	};

	if (opts.meta?.noAuth || (await prisma.config.count()) === 0) {
		return opts.next({
			ctx: context,
		});
	}

	if (!session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return opts.next({
		ctx: context,
	});
});

export const privateProcedure = t.procedure.use(privateAuth);
export const publicProcedure = t.procedure;