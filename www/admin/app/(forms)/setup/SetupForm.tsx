"use client";

import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { InfoTooltip } from "@/src/components/InfoTooltip";
import { Button } from "@/src/components/ui/client/Button";
import { FormField, FormItem, FormLabel, FormControl } from "@/src/components/ui/client/Form";
import { Input } from "@/src/components/ui/client/Input";
import { Textarea } from "@/src/components/ui/client/Textarea";
import { TypographyCode } from "@/src/components/ui/server/typography";
import { trpc } from "@/src/utils/trpc";
import { SinglePageForm } from "../SinglePageForm";

const schema = z.object({
	title: z.string().min(1),
	description: z.string(),
	language: z.string().min(1),
});

type Inputs = z.infer<typeof schema>;

export function SetupForm() {
	const router = useRouter();

	const setSeoSettingsMutation = trpc.settings.setSeoSettings.useMutation();
	const setupMutation = trpc.settings.setup.useMutation();

	const form = useForm<Inputs>({ resolver: zodResolver(schema) });
	const onSubmit: SubmitHandler<Inputs> = (data) => {
		setSeoSettingsMutation.mutate(data, {
			onSuccess: async () => {
				await setupMutation.mutateAsync();
				router.replace("/dashboard/pages");
			},
			onError: (err) => {
				if (err.data?.code === "BAD_REQUEST") {
					form.setError("language", {});
				}
			},
		});
	};

	return (
		<SinglePageForm
			className="sm:w-96"
			onSubmit={form.handleSubmit(onSubmit)}
			titleText={
				<span className="bg-gradient-to-b from-foreground/70 to-foreground bg-clip-text text-transparent dark:bg-gradient-to-t">
					Set up website
				</span>
			}
			submitButton={
				<Button
					type="submit"
					size="lg"
					icon={<ArrowRightIcon className="w-5" />}
					className="ml-auto shadow-lg shadow-primary/25"
					loading={setSeoSettingsMutation.isLoading || setupMutation.isLoading}
				>
					Finish
				</Button>
			}
			formData={form}
			data-testid="setup-form"
		>
			<FormField
				control={form.control}
				name="title"
				render={({ field }) => (
					<FormItem>
						<FormLabel size="lg" withAsterisk>
							Title
						</FormLabel>
						<FormControl>
							<Input
								size="lg"
								placeholder="My awesome website"
								aria-required
								{...field}
							/>
						</FormControl>
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel size="lg">
							Description&nbsp;
							<InfoTooltip>Used for social media previews</InfoTooltip>
						</FormLabel>
						<FormControl>
							<Textarea
								placeholder="This website is very awesome and fun!"
								minRows={3}
								maxRows={10}
								size="lg"
								{...field}
							/>
						</FormControl>
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="language"
				render={({ field }) => (
					<FormItem>
						<FormLabel size="lg" withAsterisk>
							Language&nbsp;
							<InfoTooltip>
								Used in the <TypographyCode>lang</TypographyCode> attribute of the{" "}
								<TypographyCode>&lt;html&gt;</TypographyCode> tag
							</InfoTooltip>
						</FormLabel>
						<FormControl>
							<Input size="lg" placeholder="en-US" aria-required {...field} />
						</FormControl>
					</FormItem>
				)}
			/>
		</SinglePageForm>
	);
}
