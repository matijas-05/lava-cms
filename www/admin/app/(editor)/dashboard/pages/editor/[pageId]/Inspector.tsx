"use client";

import type { Page } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import { ChevronRightIcon, CubeIcon, DocumentIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useHotkeys, usePrevious, useViewportSize, useWindowEvent } from "@mantine/hooks";
import { Resizable } from "re-resizable";
import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "react-spring";
import { Button } from "@/src/components/ui/client/Button";
import { Stepper } from "@/src/components/ui/server/Stepper";
import { TypographyH1, TypographyMuted } from "@/src/components/ui/server/typography";
import {
	usePageEditorStore,
	type ArrayItemUI,
	type Step as StepType,
	type ComponentUI,
} from "@/src/stores/pageEditor";
import type { PrivateRouter } from "@/src/trpc/routes/private/_private";
import { cn } from "@/src/utils/styling";
import { trpc } from "@/src/utils/trpc";
import { ComponentEditor } from "./ComponentEditor";
import { AddComponentDialog, createComponentInstance } from "./dialogs/AddComponentDialog";
import { RootComponents } from "./RootComponents";

export const MIN_WIDTH = 300;
const DEFAULT_WIDTH = MIN_WIDTH * 1.75;

// Placeholder component to avoid undefined error when saving and current step's
// component id hasn't been swapped to backend's id yet
const COMPONENT_PLACEHOLDER: ComponentUI = {
	id: "",
	definition: {
		id: "",
		name: "<Missing>",
	},
	order: 0,
	fields: [],
	pageId: "",
	parentFieldId: null,
	parentArrayItemId: null,
	diff: "none",
};

const animationOpen: Parameters<typeof useSpring>[0] = {
	from: { x: 200, opacity: -0.5 },
	to: { x: 0, opacity: 1 },
	config: {
		duration: 100,
	},
};

interface Props {
	page: Page;
	serverData: inferRouterOutputs<PrivateRouter>["pages"]["getPageComponents"];
}
export function Inspector(props: Props) {
	const [openAdd, setOpenAdd] = useState(false);
	const [width, setWidth] = useState(DEFAULT_WIDTH);
	const { width: windowWidth } = useViewportSize();

	const { init, components, setComponents, nestedComponents, steps, setSteps, isDirty, save } =
		usePageEditorStore((state) => ({
			init: state.init,
			components: state.components,
			setComponents: state.setComponents,
			nestedComponents: state.nestedComponents,
			steps: state.steps,
			setSteps: state.setSteps,
			isDirty: state.isDirty,
			save: state.save,
		}));

	const { data } = trpc.pages.getPageComponents.useQuery(
		{ id: props.page.id },
		{ initialData: props.serverData },
	);
	useEffect(() => {
		init(
			data.components.map((comp) => ({ ...comp, diff: "none" }) satisfies ComponentUI),
			data.nestedComponents.map((comp) => ({ ...comp, diff: "none" }) satisfies ComponentUI),
			data.arrayItems.map((item) => ({ ...item, diff: "none" }) satisfies ArrayItemUI),
		);
	}, [data, init]);

	const saveMutation = trpc.pages.editPageComponents.useMutation();
	useHotkeys([["mod+s", () => save(saveMutation, props.page.id)]], []);
	useWindowEvent("beforeunload", (e) => {
		if (isDirty) {
			// Display a confirmation dialog
			e.preventDefault();
		}
	});

	const resizableRef = useRef<Resizable | null>(null);
	useEffect(() => {
		const resizable = resizableRef.current!.resizable!;
		const handle = document.getElementById("handle-left")!.parentNode! as HTMLDivElement;

		const onScroll = () => (handle.style.top = `${resizable?.scrollTop}px`);
		resizable.addEventListener("scroll", onScroll);

		return () => resizable.removeEventListener("scroll", onScroll);
	}, [resizableRef]);

	const [animStyles, animation] = useSpring(() => animationOpen);
	// Run animation on initial render
	useEffect(() => {
		void animation.start(animationOpen);
	}, [animation]);

	const [addingComponent, setAddingComponent] = useState(false);
	async function addComponent(id: string) {
		const lastComponent = components.at(-1);
		setAddingComponent(true);
		const newComponent = await createComponentInstance(id, {
			pageId: props.page.id,
			parentFieldId: null,
			parentArrayItemId: null,
			order: lastComponent ? lastComponent.order + 1 : 0,
		});
		setAddingComponent(false);

		setComponents((components) => [...components, newComponent]);
	}

	function getComponent(id: string): ComponentUI {
		return components.find((comp) => comp.id === id) ?? COMPONENT_PLACEHOLDER;
	}
	function getNestedComponent(id: string): ComponentUI {
		return nestedComponents.find((comp) => comp.id === id) ?? COMPONENT_PLACEHOLDER;
	}

	return (
		<>
			<Resizable
				ref={resizableRef}
				// Use flex instead of space-y-5, because Resizable adds a div when resizing which messes up the spacing
				className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden p-4 max-md:hidden"
				minWidth={MIN_WIDTH}
				maxWidth={windowWidth !== 0 ? windowWidth * (2 / 3) : undefined} // `windowWidth` is 0 when SSR
				size={{ width, height: "100%" }}
				enable={{ left: true }}
				handleComponent={{
					left: (
						<div
							id="handle-left"
							className="mx-auto h-full w-px bg-border transition-colors group-hover:w-[3px] group-hover:bg-brand group-active:w-[3px] group-active:bg-brand"
						/>
					),
				}}
				handleClasses={{ left: "group" }}
				handleStyles={{ left: { width: 16, left: -8 } }}
				onResizeStop={(_, __, ___, delta) => setWidth(width + delta.width)}
			>
				<header>
					<TypographyH1 className="text-4xl">{props.page.name}</TypographyH1>
					<TypographyMuted className="text-base">{props.page.url}</TypographyMuted>
				</header>

				{steps.length > 1 && (
					<Stepper
						className="flex-wrap"
						firstIsIcon
						steps={[
							<Button
								key={0}
								variant={"link"}
								className="gap-1 font-normal text-muted-foreground"
								onClick={() => {
									// Run animation when going back to components list
									void animation.start(animationOpen);
									setSteps([{ name: "components" }]);
								}}
							>
								<DocumentIcon className="w-4" />
								{props.page.name}
							</Button>,
							...steps.slice(1).map((step, i) => (
								<Button
									key={i + 1}
									variant={"link"}
									className={cn(
										"gap-1 whitespace-nowrap font-normal",
										i + 1 < steps.length - 1 && "text-muted-foreground",
									)}
									onClick={() => setSteps((steps) => steps.slice(0, i + 2))}
								>
									<CubeIcon className="w-4" />
									{step.name === "edit-component" &&
										getComponent(step.componentId).definition.name}
									{step.name === "edit-nested-component" &&
										getNestedComponent(step.nestedComponentId).definition.name}
								</Button>
							)),
						]}
						currentStep={steps.length}
						separator={<ChevronRightIcon className="w-4" />}
					/>
				)}

				<animated.div className="space-y-5" style={animStyles}>
					<Step
						step={steps.at(-1)!}
						// Avoid showing no components before hydration
						components={
							components.length > 0
								? components
								: props.serverData.components.map(
										(c) =>
											({
												...c,
												diff: "none",
											}) satisfies ComponentUI,
									)
						}
						openAddComponentDialog={() => setOpenAdd(true)}
						addingComponent={addingComponent}
						getComponent={getComponent}
						getNestedComponent={getNestedComponent}
					/>
				</animated.div>
			</Resizable>

			<AddComponentDialog open={openAdd} setOpen={setOpenAdd} onSubmit={addComponent} />
		</>
	);
}

interface StepProps {
	step: StepType;
	components: ComponentUI[];
	getComponent: (id: string) => ComponentUI;
	getNestedComponent: (id: string) => ComponentUI;
	openAddComponentDialog: () => void;
	addingComponent: boolean;
}

function Step(props: StepProps) {
	const { setSteps, setComponents, setNestedComponents, isSaving } = usePageEditorStore(
		(state) => ({
			setSteps: state.setSteps,
			setComponents: state.setComponents,
			setNestedComponents: state.setNestedComponents,
			isSaving: state.isSaving,
		}),
	);

	const prevIsSaving = usePrevious(isSaving);
	const [styles, animation] = useSpring(() => animationOpen, [props.step]);

	useEffect(() => {
		// Weird condition to avoid running the animation after save (because id in step changes from frontend's to backend's)
		if (prevIsSaving === isSaving) {
			void animation.start(animationOpen);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.step]);

	// Typescript is stupid and doesn't properly narrow the type of `props.step` in the switch statement
	const step = props.step;
	switch (step.name) {
		case "components": {
			return (
				<div className="flex flex-col gap-5">
					<RootComponents
						components={props.components}
						onComponentClicked={(id) =>
							setSteps((steps) => [
								...steps,
								{ name: "edit-component", componentId: id },
							])
						}
					/>
					<Button
						className="w-full"
						variant={"outline"}
						icon={<PlusIcon className="w-5" />}
						onClick={props.openAddComponentDialog}
						loading={props.addingComponent}
					>
						Add component
					</Button>
				</div>
			);
		}
		case "edit-component": {
			return (
				<animated.div style={styles}>
					<ComponentEditor
						component={props.getComponent(step.componentId)}
						onChange={(data) => {
							const changedComponents: ComponentUI[] = props.components.map(
								(component) => {
									if (component.id === step.componentId) {
										return {
											...component,
											fields: component.fields.map((field) => ({
												...field,
												data: data[field.id]!,
											})),
											diff: component.diff,
										};
									} else {
										return component;
									}
								},
							);
							setComponents(changedComponents);
						}}
					/>
				</animated.div>
			);
		}
		case "edit-nested-component": {
			return (
				<animated.div style={styles}>
					<ComponentEditor
						component={props.getNestedComponent(step.nestedComponentId)}
						onChange={(data) => {
							// Don't know why, but when using nestedComponents from the usePageEditor hook,
							// the components are outdated and when NestedComponentField changes nestedComponents,
							// the changes get overwritten by the code below. So we use the state directly.
							const nestedComponents = usePageEditorStore.getState().nestedComponents;
							const changedComponents: ComponentUI[] = nestedComponents.map(
								(component) => {
									if (component.id === step.nestedComponentId) {
										return {
											...component,
											fields: component.fields.map((field) => ({
												...field,
												data: data[field.id]!,
											})),
											diff: component.diff,
										};
									} else {
										return component;
									}
								},
							);
							setNestedComponents(changedComponents);
						}}
					/>
				</animated.div>
			);
		}
	}
}
