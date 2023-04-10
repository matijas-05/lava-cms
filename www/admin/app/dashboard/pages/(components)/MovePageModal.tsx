import { type FormEventHandler, forwardRef, useMemo, useState } from "react";
import { Group, Modal, Select, Stack, Text } from "@mantine/core";
import { FolderArrowDownIcon } from "@heroicons/react/24/outline";
import type { Page } from "api/prisma/types";
import SubmitButton from "@admin/app/(components)/SubmitButton";
import { trpcReact } from "@admin/src/utils/trpcReact";
import type { PagesModalProps } from "./PageTree";

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
	image: string;
	label: string;
	description: string;
	page: Page;
}
const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
	({ image, label, description, page, ...others }: ItemProps, ref) => (
		<div ref={ref} {...others}>
			<Text>
				{page.name} <Text color="dimmed">{page.url}</Text>
			</Text>
		</div>
	)
);
SelectItem.displayName = "SelectItem";

export default function MovePageModal(props: PagesModalProps & { allPages: Page[] }) {
	const mutation = trpcReact.pages.movePage.useMutation();

	const data = useMemo(
		() =>
			props.allPages
				.filter((page) => {
					// If the current page is Root, then remove it if the page to be moved is a direct child of Root.
					// Else remove page if it is the page to be moved or if it is its child.
					if (page.url === "/") {
						return props.page.url.split("/").length > 2;
					} else {
						return (
							page.id !== props.page.id && !page.url.startsWith(props.page.url + "/")
						);
					}
				})
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((page) => ({
					label: page.name,
					value: page.id,
					page: page,
				})),
		[props.allPages, props.page]
	);

	const [destinationId, setDestinationId] = useState<string | null>(null);
	const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();

		await mutation.mutateAsync({
			id: props.page.id,
			slug: props.page.url.split("/").pop()!,
			newParentId: destinationId!,
		});
		props.onClose();
	};

	return (
		<Modal opened={props.isOpen} onClose={props.onClose} centered title="Move page">
			<form onSubmit={onSubmit}>
				<Stack>
					<Select
						value={destinationId}
						onChange={setDestinationId}
						label="Move to"
						maxDropdownHeight={window.innerHeight / 2.25}
						dropdownPosition="bottom"
						itemComponent={SelectItem}
						data={data}
						withinPortal
						searchable
						required
					/>
					<Group position="right">
						<SubmitButton
							leftIcon={<FolderArrowDownIcon className="w-5" />}
							isLoading={mutation.isLoading}
						>
							Move
						</SubmitButton>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
