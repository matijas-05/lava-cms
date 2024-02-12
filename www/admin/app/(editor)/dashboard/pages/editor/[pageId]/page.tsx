import type { Metadata } from "next";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { prisma } from "@/prisma/client";
import { ActionIcon } from "@/src/components/ui/client/ActionIcon";
import { UserMenu } from "@/src/components/UserMenu";
import { caller } from "@/src/trpc/routes/private/_private";
import { Inspector } from "./Inspector";
import { PagePreview } from "./PagePreview";
import { ResetButton } from "./ResetButton";
import { SaveButton } from "./SaveButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: { pageId: string };
}): Promise<Metadata> {
	const page = await prisma.page.findUniqueOrThrow({ where: { id: params.pageId } });
	return {
		title: `Editing "${page.name}" - Lava CMS`,
	};
}

export default async function Editor({ params }: { params: { pageId: string } }) {
	const page = await prisma.page.findUniqueOrThrow({ where: { id: params.pageId } });
	const { developmentUrl: baseUrl } = await caller.settings.getConnectionSettings();
	const pageUrl = page.url.slice(1);

	const data = await caller.pages.getPageComponents({
		id: params.pageId,
	});

	return (
		<div className="flex h-full flex-col">
			<nav className="flex w-full items-center justify-between gap-4 border-b border-border p-5 py-3">
				<Link href={"/dashboard/pages"}>
					<ActionIcon variant={"outline"} aria-label="Go back to dashboard">
						<ArrowUturnLeftIcon className="w-5" />
						Return
					</ActionIcon>
				</Link>

				<div className="flex items-center gap-4">
					<UserMenu small />
					<ResetButton />
					<SaveButton pageId={params.pageId} />
				</div>
			</nav>

			<main className="grid h-full w-full flex-1 grid-cols-[1fr_auto] overflow-hidden">
				<PagePreview baseUrl={baseUrl} pageUrl={pageUrl} />
				<Inspector page={page} serverData={data} />
			</main>
		</div>
	);
}
