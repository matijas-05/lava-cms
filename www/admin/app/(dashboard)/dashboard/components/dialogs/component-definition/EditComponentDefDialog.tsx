import type { ComponentsTableComponentDef } from "../../ComponentsTable";
import * as React from "react";
import { Sheet } from "@/src/components/ui/client";
import { ComponentDefStep, type Step } from "./ComponentDefSteps";

interface Props {
	open: boolean;
	setOpen: (value: boolean) => void;
	componentDef: ComponentsTableComponentDef;
}
export function EditComponentDefDialog(props: Props) {
	const [steps, setSteps] = React.useState<Step[]>([
		{
			name: "component-definition",
			componentDef: props.componentDef,
		},
	]);
	React.useEffect(() => {
		setSteps([
			{
				name: "component-definition",
				componentDef: props.componentDef,
			},
		]);
	}, [props.componentDef]);

	const [isDirty, setIsDirty] = React.useState(false);
	const lastStep = steps.at(-1)!;

	switch (lastStep.name) {
		case "component-definition": {
			function handleSetOpen(value: boolean) {
				if (!isDirty) {
					props.setOpen(value);
				} else if (confirm("Are you sure you want to discard your changes?")) {
					props.setOpen(value);
				}
			}

			return (
				<Sheet open={props.open} onOpenChange={handleSetOpen}>
					<ComponentDefStep
						step={lastStep}
						setSteps={setSteps}
						open={props.open}
						setOpen={handleSetOpen}
						onSubmit={() => props.setOpen(false)}
						isDirty={isDirty}
						setIsDirty={setIsDirty}
						dialogType="edit"
					/>
				</Sheet>
			);
		}
		case "field-definition": {
			return (
				<Sheet open={props.open} onOpenChange={props.setOpen}>
					chuj
				</Sheet>
			);
		}
	}
}
