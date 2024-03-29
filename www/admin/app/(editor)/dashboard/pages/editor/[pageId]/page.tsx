import type { Metadata } from "next";
import { prisma } from "@/prisma/client";
import { UserMenu } from "@/src/components/UserMenu";
import { caller } from "@/src/trpc/routes/private/_private";
import { BackButton } from "./buttons/BackButton";
import { ResetButton } from "./buttons/ResetButton";
import { SaveButton } from "./buttons/SaveButton";
import { Inspector } from "./Inspector";
import { PagePreview } from "./PagePreview";

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
				<BackButton />

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
