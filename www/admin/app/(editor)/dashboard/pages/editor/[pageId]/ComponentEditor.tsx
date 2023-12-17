import type { Component } from "./types";
import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import {
	Input,
	type FormFieldProps,
	FormField,
	FormItem,
	FormControl,
	FormLabel,
	Checkbox,
	FormError,
} from "@/src/components/ui/client";
import { TypographyMuted } from "@/src/components/ui/server";
import { usePageEditor, type ComponentUI } from "@/src/data/stores/pageEditor";
import { cn } from "@/src/utils/styling";

type Input = Record<string, string>; // fieldId: data
const DEBOUNCE_TIME = 250;

export function ComponentEditor(props: { component: Component }) {
	const form = useForm<Input>({
		defaultValues: props.component.fields.reduce<Input>((acc, field) => {
			acc[field.id] = field.data;
			return acc;
		}, {}),
	});

	const { currentComponents: components, setComponents: editComponents } = usePageEditor();
	const onSubmit: SubmitHandler<Input> = useCallback(
		(data: Input) => {
			const changedComponents: ComponentUI[] = components.map((component) => {
				if (component.id === props.component.id) {
					return {
						...component,
						fields: component.fields.map((field) => ({
							...field,
							data: data[field.id]!,
						})),
						diff: "edited",
					};
				} else {
					return component;
				}
			});
			editComponents(changedComponents);
		},
		[components, props.component.id, editComponents],
	);

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		const { unsubscribe } = form.watch(() => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(form.handleSubmit(onSubmit), DEBOUNCE_TIME);
		});

		return unsubscribe;
	}, [form, onSubmit]);

	return props.component.fields.length > 0 ? (
		<FormProvider {...form}>
			<form className="flex flex-col gap-4">
				{props.component.fields.map((componentField) => (
					<FormField
						key={componentField.id}
						control={form.control}
						name={componentField.id}
						render={({ field: formField }) => (
							<FormItem
								className={cn(componentField.type === "SWITCH" && "flex-row gap-4")}
							>
								<FormLabel>{componentField.name}</FormLabel>
								<FormControl>
									<Field fieldType={componentField.type} {...formField} />
								</FormControl>
								<FormError />
							</FormItem>
						)}
					/>
				))}
			</form>
		</FormProvider>
	) : (
		<TypographyMuted className="text-center">This component has no fields.</TypographyMuted>
	);
}

// TODO: Spinner when debouncing
// TODO: Button to restore to original values
interface FieldProps extends FormFieldProps<string> {
	fieldType: Component["fields"][number]["type"];
}
const Field = forwardRef<HTMLInputElement | HTMLButtonElement, FieldProps>(
	({ fieldType, value, onChange, ...rest }, ref) => {
		switch (fieldType) {
			case "TEXT": {
				return (
					<Input
						ref={ref as React.RefObject<HTMLInputElement>}
						type="text"
						value={value}
						onChange={(e) => onChange(e.currentTarget.value)}
						{...rest}
					/>
				);
			}
			case "NUMBER": {
				return (
					<Input
						ref={ref as React.RefObject<HTMLInputElement>}
						type="number"
						step="any"
						value={value}
						onChange={(e) => onChange(e.currentTarget.value)}
						{...rest}
					/>
				);
			}
			case "SWITCH": {
				return (
					<Checkbox
						ref={ref as React.RefObject<HTMLButtonElement>}
						checked={value === "true"}
						onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
						{...rest}
					/>
				);
			}
		}
	},
);
Field.displayName = "Field";