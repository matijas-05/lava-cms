"use client";

import * as React from "react";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font";
import { cn } from "@admin/src/utils/styles";
import { useColorThemeStore } from "../data/stores/dashboard";

interface Props extends React.ComponentPropsWithRef<"body"> {
	fonts: NextFontWithVariable[];
}
export function Body({ children, fonts, ...props }: Props) {
	const store = useColorThemeStore();

	React.useEffect(() => {
		const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");

		if (!store.colorTheme) {
			store.set(matchMedia.matches ? "dark" : "light");
		}

		const onPreferenceChanged: (e: MediaQueryListEvent) => void = (e) => {
			store.set(e.matches ? "dark" : "light");
		};
		matchMedia.addEventListener("change", onPreferenceChanged);

		return () => matchMedia.removeEventListener("change", onPreferenceChanged);

		// Disable because we only want it to run when component mounts first
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<body
			className={cn(
				store.colorTheme,
				fonts.map((font) => font.variable)
			)}
			{...props}
		>
			{children}
		</body>
	);
}
