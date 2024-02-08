"use client";

import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { withProps } from "@udecode/cn";
import { createAlignPlugin } from "@udecode/plate-alignment";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
	MARK_BOLD,
	MARK_CODE,
	MARK_ITALIC,
	MARK_STRIKETHROUGH,
	MARK_SUBSCRIPT,
	MARK_SUPERSCRIPT,
	MARK_UNDERLINE,
	createBasicMarksPlugin,
} from "@udecode/plate-basic-marks";
import { ELEMENT_BLOCKQUOTE, createBlockquotePlugin } from "@udecode/plate-block-quote";
import { createSoftBreakPlugin } from "@udecode/plate-break";
import { createCaptionPlugin } from "@udecode/plate-caption";
import {
	Plate,
	createPlugins,
	type Value,
	PlateLeaf,
	type RenderAfterEditable,
	ELEMENT_DEFAULT,
	insertNodes,
	setNodes,
	type PlateEditor,
} from "@udecode/plate-common";
import { isSelectionAtBlockStart } from "@udecode/plate-common";
import { createDndPlugin } from "@udecode/plate-dnd";
import {
	ELEMENT_H1,
	ELEMENT_H2,
	ELEMENT_H3,
	ELEMENT_H4,
	ELEMENT_H5,
	ELEMENT_H6,
	createHeadingPlugin,
} from "@udecode/plate-heading";
import { ELEMENT_HR, createHorizontalRulePlugin } from "@udecode/plate-horizontal-rule";
import { createIndentPlugin } from "@udecode/plate-indent";
import { createIndentListPlugin } from "@udecode/plate-indent-list";
import { createLineHeightPlugin } from "@udecode/plate-line-height";
import { ELEMENT_LINK, createLinkPlugin } from "@udecode/plate-link";
import { ELEMENT_IMAGE, createImagePlugin } from "@udecode/plate-media";
import { createNodeIdPlugin } from "@udecode/plate-node-id";
import { ELEMENT_PARAGRAPH, createParagraphPlugin } from "@udecode/plate-paragraph";
import { createResetNodePlugin } from "@udecode/plate-reset-node";
import { createSelectOnBackspacePlugin } from "@udecode/plate-select";
import { createDeserializeMdPlugin } from "@udecode/plate-serializer-md";
import {
	ELEMENT_TABLE,
	ELEMENT_TD,
	ELEMENT_TH,
	ELEMENT_TR,
	createTablePlugin,
} from "@udecode/plate-table";
import React, { useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { pageEditorStore } from "../data/stores/pageEditor";
import { cn } from "../utils/styling";
import {
	Editor,
	BlockquoteElement,
	HeadingElement,
	ParagraphElement,
	FixedToolbar,
	FixedToolbarButtons,
	CodeLeaf,
	LinkElement,
	LinkFloatingToolbar,
	ImageElement,
	TableElement,
	TableRowElement,
	TableCellElement,
	TableCellHeaderElement,
	HrElement,
} from "./plate-ui";
import { withPlaceholders } from "./plate-ui/Placeholder";
import { withDraggables } from "./plate-ui/withDraggable";
import { ActionIcon, type FormFieldProps } from "./ui/client";

const resetBlockTypesCommonRule = {
	types: [
		ELEMENT_H1,
		ELEMENT_H2,
		ELEMENT_H3,
		ELEMENT_H4,
		ELEMENT_H5,
		ELEMENT_H6,
		ELEMENT_BLOCKQUOTE,
	],
	defaultType: ELEMENT_PARAGRAPH,
};

export const plugins = [
	createParagraphPlugin(),
	createHeadingPlugin(),
	createBlockquotePlugin(),
	createBasicMarksPlugin(),
	createAlignPlugin({
		inject: {
			props: {
				validTypes: [
					ELEMENT_H1,
					ELEMENT_H2,
					ELEMENT_H3,
					ELEMENT_H4,
					ELEMENT_H5,
					ELEMENT_H6,
					ELEMENT_PARAGRAPH,
					ELEMENT_BLOCKQUOTE,
					ELEMENT_IMAGE,
				],
			},
		},
	}),
	createLineHeightPlugin({
		inject: {
			props: {
				defaultNodeValue: 1.5,
				validNodeValues: [1, 1.2, 1.5, 2, 3],
				validTypes: [ELEMENT_PARAGRAPH, ELEMENT_H1, ELEMENT_H2, ELEMENT_H3],
			},
		},
	}),
	createIndentPlugin({
		inject: {
			props: {
				validTypes: [
					ELEMENT_PARAGRAPH,
					ELEMENT_H1,
					ELEMENT_H2,
					ELEMENT_H3,
					ELEMENT_BLOCKQUOTE,
				],
			},
		},
	}),
	createIndentListPlugin({
		inject: {
			props: {
				validTypes: [
					ELEMENT_PARAGRAPH,
					ELEMENT_H1,
					ELEMENT_H2,
					ELEMENT_H3,
					ELEMENT_BLOCKQUOTE,
				],
			},
		},
	}),
	createLinkPlugin({
		renderAfterEditable: LinkFloatingToolbar as RenderAfterEditable,
	}),
	createSoftBreakPlugin({
		options: {
			rules: [
				{ hotkey: "shift+enter" },
				{
					hotkey: "enter",
					query: {
						allow: [ELEMENT_BLOCKQUOTE, ELEMENT_TD],
					},
				},
			],
		},
	}),
	createResetNodePlugin({
		options: {
			rules: [
				{
					...resetBlockTypesCommonRule,
					hotkey: "Backspace",
					predicate: isSelectionAtBlockStart,
				},
			],
		},
	}),
	createImagePlugin({
		serializeHtml: ({ element, className }) => {
			const caption = element.caption as Array<{ text: string }>;
			const align = element.align as "left" | "center" | "right" | "justify";

			let justifyContent = "";
			if (align === "left") {
				justifyContent = "flex-start";
			} else if (align === "center") {
				justifyContent = "center";
			} else if (align === "right") {
				justifyContent = "flex-end";
			}

			return (
				<div
					style={{
						width: "100%",
						display: "flex",
						justifyContent,
					}}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img className={className} src={element.url as string} alt={caption[0]?.text} />
				</div>
			);
		},
	}),
	createCaptionPlugin({
		options: {
			pluginKeys: [ELEMENT_IMAGE],
		},
	}),
	createDeserializeMdPlugin(),
	createTablePlugin({
		options: {
			enableMerging: true,
		},
	}),
	createHorizontalRulePlugin(),
	createSelectOnBackspacePlugin({
		options: {
			query: {
				allow: [ELEMENT_IMAGE, ELEMENT_HR],
			},
		},
	}),
	createAutoformatPlugin({
		options: {
			rules: [
				{
					mode: "block",
					type: ELEMENT_HR,
					match: ["---", "—-", "___ "],
					format: (editor) => {
						setNodes(editor, { type: ELEMENT_HR });
						insertNodes(editor, {
							type: ELEMENT_DEFAULT,
							children: [{ text: "" }],
						});
					},
				},
			],
		},
	}),
	createNodeIdPlugin(),
	createDndPlugin({
		options: {
			enableScroller: true,
		},
	}),
];
export const components = {
	// createBasicElementsPlugin()
	[ELEMENT_H1]: withProps(HeadingElement, { variant: "h1" }),
	[ELEMENT_H2]: withProps(HeadingElement, { variant: "h2" }),
	[ELEMENT_H3]: withProps(HeadingElement, { variant: "h3" }),
	[ELEMENT_H4]: withProps(HeadingElement, { variant: "h4" }),
	[ELEMENT_H5]: withProps(HeadingElement, { variant: "h5" }),
	[ELEMENT_H6]: withProps(HeadingElement, { variant: "h6" }),
	[ELEMENT_PARAGRAPH]: ParagraphElement,
	[ELEMENT_BLOCKQUOTE]: BlockquoteElement,
	[ELEMENT_HR]: HrElement,

	// createBasicMarksPlugin()
	[MARK_BOLD]: withProps(PlateLeaf, { as: "strong" }),
	[MARK_ITALIC]: withProps(PlateLeaf, { as: "em" }),
	[MARK_UNDERLINE]: withProps(PlateLeaf, { as: "u" }),
	[MARK_STRIKETHROUGH]: withProps(PlateLeaf, { as: "s" }),
	[MARK_CODE]: CodeLeaf,

	[ELEMENT_LINK]: LinkElement,
	[MARK_SUPERSCRIPT]: withProps(PlateLeaf, { as: "sup" }),
	[MARK_SUBSCRIPT]: withProps(PlateLeaf, { as: "sub" }),

	[ELEMENT_IMAGE]: ImageElement,

	[ELEMENT_TABLE]: TableElement,
	[ELEMENT_TR]: TableRowElement,
	[ELEMENT_TD]: TableCellElement,
	[ELEMENT_TH]: TableCellHeaderElement,
};

const pluginsWithDnd = createPlugins(plugins, {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	components: withPlaceholders(withDraggables(components)),
});

interface Props extends FormFieldProps<Value> {
	originalValue: Value | undefined;
	edited: boolean;
	onRestore: () => void;
	pageId: string;
}

let lastValidValue: Value | null = null;
export function RichTextEditor(props: Props) {
	const editorRef = useRef<PlateEditor<Value>>(null);

	// Stupid workaround for reapplying value after saving a new component,
	// because on the first render value is still a string for some reason
	useEffect(() => {
		if (typeof props.value === "object") {
			lastValidValue = props.value;
		}
		if (lastValidValue && typeof props.value === "string") {
			editorRef.current!.children = lastValidValue;
		}
	}, [editorRef, props.value]);

	// Reset editor when the global Reset button is pressed
	useEffect(() => {
		if (props.originalValue) {
			pageEditorStore.setState({
				onReset: () => (editorRef.current!.children = props.originalValue!),
			});
		}
	}, [editorRef, props.originalValue]);

	return (
		<DndProvider backend={HTML5Backend}>
			<Plate
				editorRef={editorRef}
				plugins={pluginsWithDnd}
				value={props.value}
				onChange={props.onChange}
			>
				<div
					className={cn(
						// Block selection
						"[&_.slate-start-area-left]:!w-[64px] [&_.slate-start-area-right]:!w-[64px] [&_.slate-start-area-top]:!h-4",
						"relative",
					)}
				>
					<FixedToolbar className={cn(props.edited && "border-brand border-b-border")}>
						<FixedToolbarButtons />
					</FixedToolbar>

					<Editor
						className={cn(
							"rounded-t-none border-t-0 px-6 py-4",
							props.edited && "border-b-brand border-l-brand border-r-brand",
						)}
						focusRing={false}
						pageId={props.pageId}
					/>

					{props.edited && (
						<ActionIcon
							className="absolute bottom-1 right-1 bg-background/50"
							onClick={() => {
								editorRef.current!.children = props.originalValue!;
								props.onRestore();
							}}
							tooltip={"Restore"}
						>
							<ArrowUturnLeftIcon className="w-4" />
						</ActionIcon>
					)}
				</div>
			</Plate>
		</DndProvider>
	);
}
