import * as argon2 from "argon2";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { auth } from "@/src/auth";
import { privateProcedure } from "@/src/trpc";

export const signUp = privateProcedure
	.input(
		z.object({
			name: z.string(),
			lastName: z.string(),
			email: z.string().email(),
			password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
		}),
	)
	.mutation(async ({ input }) => {
		const hashedPassword = await argon2.hash(input.password, {
			type: argon2.argon2id,
			memoryCost: 19 * 1024, // 19MiB
			timeCost: 2,
			parallelism: 1,
		});
		const newUser = await prisma.adminUser.create({
			data: {
				name: input.name,
				last_name: input.lastName,
				email: input.email,
				password: hashedPassword,
			},
		});

		const session = await auth.createSession(newUser.id, {});
		const sessionCookie = auth.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	});
