import type { Metadata } from "next";
import { SignInForm } from "./SignInForm";
import { redirect } from "next/navigation";
import { caller } from "@admin/src/trpc/routes/private/_private";
import { getCurrentUser } from "@admin/src/auth";

export const metadata: Metadata = {
	title: "Sign in - Lava CMS",
};

export default async function SignIn() {
	const { reason } = await caller.auth.setupRequired();

	if (reason) {
		redirect("/setup");
	}
	if (await getCurrentUser()) {
		redirect("/dashboard");
	}

	return <SignInForm />;
}
