import type { Metadata } from "next";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { trpc } from "@admin/src/utils/trpc";
import { Stepper } from "@admin/src/components/ui/server";
import { SignUpForm } from "./SignUpForm";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = {
	title: "Lava CMS - Setup",
};
export const dynamic = "force-dynamic";

const reasonFormMap: Record<
	NonNullable<Awaited<ReturnType<typeof trpc.auth.setupRequired.query>>["reason"]>,
	React.ReactNode
> = {
	"no-user": <SignUpForm />,
	"no-config": <SetupForm />,
};

export default async function SetupLayout() {
	const { reason } = await trpc.auth.setupRequired.query();

	return (
		<div>
			<Stepper
				className="mb-2 ml-1"
				steps={["Admin account", "Configuration"]}
				currentStep={Object.keys(reasonFormMap).indexOf(reason!)}
				separator={<ArrowRightIcon className="w-4" />}
			/>
			{reasonFormMap[reason!]}
		</div>
	);
}