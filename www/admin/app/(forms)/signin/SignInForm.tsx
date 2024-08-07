"use client";

import {
	LockClosedIcon,
	EnvelopeIcon,
	ExclamationCircleIcon,
	ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/src/components/ui/client/Button";
import {
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormError,
} from "@/src/components/ui/client/Form";
import { Input } from "@/src/components/ui/client/Input";
import { Alert, AlertTitle } from "@/src/components/ui/server/Alert";
import { env } from "@/src/env/client.mjs";
import { useAlertDialog } from "@/src/hooks/useAlertDialog";
import { trpc } from "@/src/utils/trpc";
import { SinglePageForm } from "../SinglePageForm";

const schema = z.object({
	email: z.string().min(1, " ").email("The e-mail you provided is invalid."),
	password: z.string().min(1),
});
type Inputs = z.infer<typeof schema>;

export function SignInForm() {
	const mutation = trpc.auth.signIn.useMutation();
	const router = useRouter();

	const form = useForm<Inputs>({
		resolver: zodResolver(schema),
	});
	const onSubmit: SubmitHandler<Inputs> = (data) => {
		mutation.mutate(data, {
			onSuccess: () => router.replace("/dashboard/pages"),
			onError: (err) => {
				if (err.data?.code === "UNAUTHORIZED") {
					form.setError("root", {
						message: "Your credentials are invalid.",
					});
				} else {
					form.setError("root", {
						message: "Something went wrong. Try again later.",
					});
				}
			},
		});
	};

	const demoCredentialsDialog = useAlertDialog();
	useEffect(() => {
		if (env.NEXT_PUBLIC_DEMO) {
			demoCredentialsDialog.open({
				title: "Demo user credentials",
				description: (
					<>
						<p>e-mail: {env.NEXT_PUBLIC_DEMO_EMAIL}</p>
						<p>password: {env.NEXT_PUBLIC_DEMO_PASSWORD}</p>
						<p className="mt-2">Website data resets every UTC hour!</p>
					</>
				),
				yesMessage: "OK",
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<SinglePageForm
			onSubmit={form.handleSubmit(onSubmit)}
			className="max-w-sm"
			titleText={
				<>
					<span className="bg-gradient-to-b from-foreground/70 to-foreground bg-clip-text text-transparent dark:bg-gradient-to-t">
						Sign in to{" "}
					</span>
					<span className="bg-gradient-to-b from-orange-300 to-orange-600 bg-clip-text text-transparent">
						Lava
					</span>
				</>
			}
			submitButton={
				<Button
					type="submit"
					size="lg"
					icon={<ArrowRightStartOnRectangleIcon className="w-5" />}
					className="ml-auto shadow-lg shadow-primary/25"
					loading={mutation.isLoading || mutation.isSuccess}
				>
					Sign in
				</Button>
			}
			formData={form}
			data-testid="sign-in"
		>
			{form.formState.errors.root && (
				<Alert variant="destructive" icon={<ExclamationCircleIcon className="w-5" />}>
					<AlertTitle className="mb-0">{form.formState.errors.root.message}</AlertTitle>
				</Alert>
			)}

			<FormField
				control={form.control}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel size="lg">E-mail</FormLabel>
						<FormControl>
							<Input
								type="email"
								placeholder="user@domain.com"
								size="lg"
								icon={<EnvelopeIcon />}
								autoFocus
								aria-required
								{...field}
							/>
						</FormControl>
						<FormError />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel size="lg">Password</FormLabel>
						<FormControl>
							<Input
								type="password"
								size="lg"
								icon={<LockClosedIcon />}
								aria-required
								{...field}
							/>
						</FormControl>
					</FormItem>
				)}
			/>
		</SinglePageForm>
	);
}
