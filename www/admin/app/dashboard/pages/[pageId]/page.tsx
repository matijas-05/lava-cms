import { trpc } from "@admin/src/utils/trpc";
import { PagesTable } from "../PagesTable";
import { columns } from "../PagesTableColumns";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Group({ params }: { params: { pageId: string } }) {
	const { breadcrumbs, pages } = await trpc.pages.getGroup.query({ id: params.pageId });
	if (breadcrumbs.length === 0) {
		return notFound();
	}

	return <PagesTable columns={columns} data={pages} breadcrumbs={breadcrumbs} />;
}
