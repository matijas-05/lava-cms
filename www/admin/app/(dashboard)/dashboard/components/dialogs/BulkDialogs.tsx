import type { ComponentsTableItem } from "../ComponentsTable";
import { FolderArrowDownIcon, FolderIcon, TrashIcon } from "@heroicons/react/24/outline";
import * as React from "react";
import { useForm, type SubmitHandler, FormProvider } from "react-hook-form";
import { AlertDialog } from "@/src/components/AlertDialog";
import {
	type ItemGroup,
	type MoveDialogInputs,
	NewGroupSelect,
} from "@/src/components/DataTableDialogs";
import { Button } from "@/src/components/ui/client/Button";
import {
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/src/components/ui/client/Dialog";
import { FormField, FormItem, FormControl } from "@/src/components/ui/client/Form";
import { trpc } from "@/src/utils/trpc";

interface Props {
	items: ComponentsTableItem[];
	open: boolean;
	setOpen: (open: boolean) => void;
	onSubmit: () => void;
}

export function BulkDeleteDialog(props: Props) {
	const componentDefMutation = trpc.components.deleteComponentDefinition.useMutation();
	const groupMutation = trpc.components.deleteGroup.useMutation();
	const [loading, setLoading] = React.useState(false);

	async function handleSubmit() {
		const promises = props.items.map((item) =>
			item.isGroup
				? groupMutation.mutateAsync({ id: item.id })
				: componentDefMutation.mutateAsync({ id: item.id }),
		);
		setLoading(true);
		await Promise.all(promises);
		setLoading(false);

		props.setOpen(false);
		props.onSubmit();
	}

	return (
		<AlertDialog
			open={props.open}
			setOpen={props.setOpen}
			loading={loading}
			icon={<TrashIcon className="w-5" />}
			title={`Delete ${props.items.length} items?`}
			description={`Are you sure you want to delete ${props.items.length} items? This action cannot be undone!`}
			noMessage="No, don't delete"
			yesMessage="Delete"
			onSubmit={handleSubmit}
		/>
	);
}

export function BulkMoveDialog(props: Props) {
	const componentDefMutation = trpc.components.editComponentDefinition.useMutation();
	const groupMutation = trpc.components.editGroup.useMutation();
	const [loading, setLoading] = React.useState(false);

	const allGroups = trpc.components.getAllGroups.useQuery(undefined, {
		enabled: props.open,
	}).data;
	const groups = React.useMemo(
		() =>
			allGroups
				?.filter(
					(group) =>
						props.items.every(
							(item) => item.parentGroupId !== group.id && item.id !== group.id,
						) &&
						props.items.reduce(
							(acc, curr) => acc && !group.hierarchy.includes(curr.id),
							true,
						),
				)
				.map<ItemGroup>((group) => ({
					id: group.id,
					name: group.name,
					extraInfo: (
						<span className="flex items-center">
							{group.parent_group_name && (
								<>
									in&nbsp;
									<FolderIcon className="inline w-[14px]" />
									&nbsp;
									{group.parent_group_name},&nbsp;
								</>
							)}
							contains {group.children_count.toString()}{" "}
							{group.children_count === 1 ? "item" : "items"}
						</span>
					),
				})),
		[allGroups, props.items],
	);

	const form = useForm<MoveDialogInputs>();
	const onSubmit: SubmitHandler<MoveDialogInputs> = async (data) => {
		const promises = props.items.map((item) =>
			item.isGroup
				? groupMutation.mutateAsync({ id: item.id, newGroupId: data.newParentId })
				: componentDefMutation.mutateAsync({ id: item.id, newGroupId: data.newParentId }),
		);
		setLoading(true);
		await Promise.all(promises);
		setLoading(false);

		props.setOpen(false);
		props.onSubmit();
	};

	return (
		<Dialog open={props.open} onOpenChange={props.setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Move {props.items.length} items</DialogTitle>
				</DialogHeader>

				<FormProvider {...form}>
					<form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="newParentId"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<NewGroupSelect groups={groups ?? []} {...field} />
									</FormControl>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="submit"
								disabled={!form.watch("newParentId")}
								loading={loading}
								icon={<FolderArrowDownIcon className="w-5" />}
							>
								Move
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
}
