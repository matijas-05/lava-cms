import { useOs } from "@mantine/hooks";
import {
	MARK_BOLD,
	MARK_CODE,
	MARK_ITALIC,
	MARK_STRIKETHROUGH,
	MARK_SUBSCRIPT,
	MARK_SUPERSCRIPT,
	MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import { useEditorReadOnly } from "@udecode/plate-common";
import { ListStyleType } from "@udecode/plate-indent-list";
import React from "react";

import { AlignDropdownMenu } from "./AlignDropdownMenu";
import { icons } from "./icons";
import { IndentListToolbarButton } from "./IndentListToolbarButton";
import { InsertDropdownMenu } from "./InsertDropdownMenu";
import { LineHeightDropdownMenu } from "./LineHeightDropdownMenu";
import { LinkToolbarButton } from "./LinkToolbarButton";
import { MarkToolbarButton } from "./MarkToolbarButton";
import { MediaToolbarButton } from "./MediaToolbarButton";
import { TableDropdownMenu } from "./TableDropdownMenu";
import { ToolbarGroup } from "./Toolbar";
import { TurnIntoDropdownMenu } from "./TurnIntoDropdownMenu";

export function FixedToolbarButtons() {
	const readOnly = useEditorReadOnly();
	const os = useOs();
	const modifierKey = os === "macos" ? "⌘" : "Ctrl";

	return (
		<div className="w-full overflow-hidden">
			<div
				className="flex flex-wrap"
				style={{
					transform: "translateX(calc(-1px))",
				}}
			>
				{!readOnly && (
					<>
						<ToolbarGroup noSeparator biggerGap>
							<InsertDropdownMenu />
							<TurnIntoDropdownMenu />
						</ToolbarGroup>

						<ToolbarGroup>
							<MarkToolbarButton
								tooltip={`Bold (${modifierKey}+B)`}
								nodeType={MARK_BOLD}
							>
								<icons.Bold />
							</MarkToolbarButton>
							<MarkToolbarButton
								tooltip={`Italic (${modifierKey}+I)`}
								nodeType={MARK_ITALIC}
							>
								<icons.Italic />
							</MarkToolbarButton>
							<MarkToolbarButton
								tooltip={`Underline (${modifierKey}+U)`}
								nodeType={MARK_UNDERLINE}
							>
								<icons.Underline />
							</MarkToolbarButton>
							<MarkToolbarButton
								tooltip={`Strikethrough (${modifierKey}+Shift+M)`}
								nodeType={MARK_STRIKETHROUGH}
							>
								<icons.Strikethrough />
							</MarkToolbarButton>
							<MarkToolbarButton
								tooltip={`Code (${modifierKey}+E)`}
								nodeType={MARK_CODE}
							>
								<icons.Code />
							</MarkToolbarButton>
							<MarkToolbarButton tooltip="Superscript" nodeType={MARK_SUPERSCRIPT}>
								<icons.Superscript />
							</MarkToolbarButton>
							<MarkToolbarButton tooltip="Subscript" nodeType={MARK_SUBSCRIPT}>
								<icons.Subscript />
							</MarkToolbarButton>
						</ToolbarGroup>

						<ToolbarGroup>
							<AlignDropdownMenu />
							<LineHeightDropdownMenu />
							<IndentListToolbarButton nodeType={ListStyleType.Disc} />
							<IndentListToolbarButton nodeType={ListStyleType.Decimal} />
						</ToolbarGroup>

						<ToolbarGroup>
							<LinkToolbarButton tooltip={`Link (${modifierKey}+K)`} />
							<MediaToolbarButton tooltip="Image" />
							<TableDropdownMenu />
							{/* <MarkToolbarButton */}
							{/* 	tooltip="Embed" */}
							{/* 	nodeType={ELEMENT_MEDIA_EMBED} */}
							{/* 	onClick={() => */}
							{/* 		insertMedia(editor, { */}
							{/* 			type: ELEMENT_MEDIA_EMBED, */}
							{/* 		}) */}
							{/* 	} */}
							{/* > */}
							{/* 	<icons.Embed /> */}
							{/* </MarkToolbarButton> */}
						</ToolbarGroup>
					</>
				)}
			</div>
		</div>
	);
}
