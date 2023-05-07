"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@admin/src/utils/styles";
import { Loader } from "../server/Loader";

const buttonVariants = cva(
	"active:translate-y-px inline-flex gap-3 items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline: "border border-input hover:bg-accent hover:text-accent-foreground",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "underline-offset-4 hover:underline text-primary",
			},
			size: {
				default: "h-11 py-2 px-4",
				sm: "h-10 px-3 rounded-md text-sm",
				lg: "h-12 px-8 rounded-md",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	icon?: React.ReactNode;
	loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			type = "button",
			icon,
			children,
			loading,
			disabled,
			...props
		},
		ref
	) => {
		const Comp = asChild ? Slot : "button";

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				type={type}
				disabled={loading || disabled}
				{...props}
			>
				{asChild ? (
					<span>
						{loading ? <Loader /> : icon}
						{children}
					</span>
				) : (
					<>
						{loading ? <Loader /> : icon}
						{children}
					</>
				)}
			</Comp>
		);
	}
);
Button.displayName = "Button";

export { Button, buttonVariants };