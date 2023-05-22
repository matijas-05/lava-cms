"use client";

import { useServerInsertedHTML } from "next/navigation";
import { Inter, Poppins } from "next/font/google";
import {
	useEmotionCache,
	MantineProvider,
	ColorSchemeProvider,
	type ColorScheme,
} from "@admin/src/components";
import { useColorScheme } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { setCookie } from "cookies-next";
import { getBackgroundColor } from "@admin/src/utils/colors";

export const poppins = Poppins({ weight: "700", subsets: ["latin"] });
const inter = Inter({ weight: "variable", subsets: ["latin"] });

interface Props {
	children: React.ReactNode;
	colorScheme?: ColorScheme;
}
export default function Mantine(props: Props) {
	const cache = useEmotionCache();
	cache.compat = true;
	useServerInsertedHTML(() => (
		<style
			data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
			dangerouslySetInnerHTML={{
				__html: Object.values(cache.inserted).join(" "),
			}}
		/>
	));

	const preferred = useColorScheme();
	const [colorScheme, setColorScheme] = useState<ColorScheme>(props.colorScheme ?? preferred);

	useEffect(() => {
		// Preferred color scheme is always 'light' the first time because of SSR
		// so we have to wait until the client takes over and only then set the theme automatically
		if (!props.colorScheme) {
			setColorScheme(preferred);
			setCookie("color-scheme", preferred, { sameSite: "lax", expires: new Date(9999, 12) });
		}
	}, [preferred, props.colorScheme]);

	function toggleColorScheme() {
		const newColor = colorScheme === "dark" ? "light" : "dark";

		setCookie("color-scheme", newColor, { sameSite: "lax", expires: new Date(9999, 12) });
		setColorScheme(newColor);
	}

	return (
		<ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
			<MantineProvider
				withGlobalStyles
				withNormalizeCSS
				emotionCache={cache}
				theme={{
					colorScheme: colorScheme,
					fontFamily: inter.style.fontFamily,
					headings: {
						fontFamily: poppins.style.fontFamily,
					},
					globalStyles: (theme) => ({
						"#content": {
							backgroundColor: getBackgroundColor(theme),
							display: "flex",
							height: "100vh",
						},
					}),
				}}
			>
				<Notifications limit={10} />
				{props.children}
			</MantineProvider>
		</ColorSchemeProvider>
	);
}