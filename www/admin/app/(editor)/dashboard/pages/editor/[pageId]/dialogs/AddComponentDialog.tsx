"use client";

import { ChevronRightIcon, CubeIcon, FolderIcon, HomeIcon } from "@heroicons/react/24/outline";
import cuid from "cuid";
import { useEffect, useState } from "react";
import type { ComponentsTableItem } from "@/app/(dashboard)/dashboard/components/ComponentsTable";
import { ActionIcon } from "@/src/components/ui/client/ActionIcon";
import { Button } from "@/src/components/ui/client/Button";
import {
	DialogHeader,
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/src/components/ui/client/Dialog";
import { Input } from "@/src/components/ui/client/Input";
import { Separator } from "@/src/components/ui/client/Separator";
import { Skeleton } from "@/src/components/ui/server/Skeleton";
import { Stepper } from "@/src/components/ui/server/Stepper";
import { TypographyMuted } from "@/src/components/ui/server/typography";
import type { ComponentUI } from "@/src/stores/pageEditor";
import { getInitialValue } from "@/src/stores/utils";
import { cn } from "@/src/utils/styling";
import { trpc, trpcFetch } from "@/src/utils/trpc";

export async function createComponentInstance(
	definitionId: string,
	data: Pick<ComponentUI, "pageId" | "parentFieldId" | "parentArrayItemId" | "order">,
	currentComponent?: ComponentUI,
): Promise<ComponentUI> {
	const definition = await trpcFetch.components.getComponentDefinition.query({
		id: definitionId,
	});
	return {
		// When replacing component, keep the id
		id: currentComponent?.id ?? cuid(),
		definition: {
			id: definition.id,
			name: definition.name,
		},
		fields: definition.field_definitions.map((fieldDef) => {
			const data = getInitialValue(fieldDef.type) as string;

			return {
				id: cuid(),
				name: fieldDef.name,
				displayName: fieldDef.display_name,
				data,
				serializedRichText: fieldDef.type === "RICH_TEXT" ? "" : null,
				definitionId: fieldDef.id,
				order: fieldDef.order,
				type: fieldDef.type,
				arrayItemType: fieldDef.array_item_type,
			};
		}),
		order: data.order,
		pageId: data.pageId,
		parentFieldId: data.parentFieldId,
		parentArrayItemId: data.parentArrayItemId,
		diff: currentComponent ? "replaced" : "added",
	};
}

interface Props {
	open: boolean;
	setOpen: (value: boolean) => void;
	onSubmit: (id: string) => void;
}
// Consider abstracting this type of a dialog out to a hook or a component if it needs to be copied on more time
export function AddComponentDialog(props: Props) {
	const [groupId, setGroupId] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const { data, refetch } = trpc.components.getGroup.useQuery(groupId ? { id: groupId } : null, {
		enabled: props.open,
	});
	const list = data?.items;

	useEffect(() => {
		if (props.open) {
			setGroupId(null);
			setSearch("");
		}
	}, [props.open]);

	function openGroup(id: string | null) {
		setGroupId(id);
		void refetch();
	}

	return (
		<Dialog open={props.open} onOpenChange={props.setOpen}>
			<DialogContent className="flex max-h-[66vh] flex-col">
				<DialogHeader>
					<DialogTitle>Add component</DialogTitle>
				</DialogHeader>

				<Input
					type="search"
					placeholder="Search this group..."
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							const item = list?.find((item) =>
								item.name.toLowerCase().includes(search.toLowerCase()),
							);
							if (!item) {
								return;
							}

							if (!item.isGroup) {
								props.onSubmit(item.id);
								props.setOpen(false);
							} else {
								openGroup(item.id);
								setSearch("");
							}
						}
					}}
				/>

				{/* Breadcrumbs */}
				{data && data.breadcrumbs.length > 0 && (
					<Stepper
						className="-mb-1"
						firstIsIcon
						steps={[
							<ActionIcon
								key={0}
								className="text-foreground"
								variant={"simple"}
								onClick={() => openGroup(null)}
							>
								<HomeIcon className="w-5" />
							</ActionIcon>,
							...data.breadcrumbs.map((breadcrumb, i) => (
								<Button
									key={i + 1}
									variant={"link"}
									className={cn(
										"whitespace-nowrap font-normal",
										i < data.breadcrumbs.length - 1 && "text-muted-foreground",
									)}
									onClick={() => openGroup(breadcrumb.id)}
								>
									{breadcrumb.name}
								</Button>
							)),
						]}
						currentStep={data.breadcrumbs.length}
						separator={<ChevronRightIcon className="w-4" />}
					/>
				)}

				{/* Items list */}
				{list ? (
					list.length > 0 ? (
						<ul className="max-h-full overflow-auto">
							{list.map((item, i) => {
								if (!item.name.toLowerCase().includes(search.toLowerCase())) {
									return null;
								}
								return (
									<ListItem
										key={item.id}
										item={item}
										groupClick={() => openGroup(item.id)}
										componentClick={() => {
											props.onSubmit(item.id);
											props.setOpen(false);
										}}
										isLast={i === list.length - 1}
									/>
								);
							})}
						</ul>
					) : (
						<TypographyMuted>No results.</TypographyMuted>
					)
				) : (
					<div className="space-y-2">
						<Skeleton className="h-[48.25px] w-full" />
						<Skeleton className="h-[48.25px] w-full" />
						<Skeleton className="h-[48.25px] w-full" />
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

interface ListItemProps {
	item: ComponentsTableItem;
	groupClick: () => void;
	componentClick: () => void;
	isLast: boolean;
}
function ListItem(props: ListItemProps) {
	return (
		<li className="mt-1">
			<Separator className="mb-1" />
			<Button
				className="w-full justify-start px-3 outline-0"
				variant={"outline"}
				size={"lg"}
				onClick={props.item.isGroup ? props.groupClick : props.componentClick}
			>
				{props.item.isGroup ? <FolderIcon className="w-5" /> : <CubeIcon className="w-5" />}
				{props.item.name}
			</Button>
			{props.isLast && <Separator className="mt-1" />}
		</li>
	);
}
