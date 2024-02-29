"use client";

import type { StoreApi } from "zustand";
import { useRef } from "react";
import {
	ColorThemeStoreContext,
	type ColorThemeState,
	createColorThemeStore,
} from "@/src/data/stores/colorTheme";
import type { ColorTheme } from "@/src/utils/cookies";

export const ColorThemeStoreProvider = ({
	colorTheme,
	children,
}: {
	children: React.ReactNode;
	colorTheme: ColorTheme | null;
}) => {
	const storeRef = useRef<StoreApi<ColorThemeState>>();
	if (!storeRef.current) {
		storeRef.current = createColorThemeStore(colorTheme);
	}

	return (
		<ColorThemeStoreContext.Provider value={storeRef.current}>
			{children}
		</ColorThemeStoreContext.Provider>
	);
};
