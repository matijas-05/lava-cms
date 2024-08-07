import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Body } from "@/src/components/Body";
import { DemoReset } from "@/src/components/DemoReset";
import { AlertDialogProvider } from "@/src/components/providers/AlertDialogProvider";
import { ColorThemeStoreProvider } from "@/src/components/providers/ColorThemeStoreProvider";
import { TrpcProvider } from "@/src/components/providers/TrpcProvider";
import { Toaster } from "@/src/components/ui/client/Toaster";
import { TooltipProvider } from "@/src/components/ui/client/Tooltip";
import { colorThemeSchema, type CookieName } from "@/src/utils/cookies";
import "@/src/styles/globals.css";

export const metadata: Metadata = {
	icons: ["/admin/favicon.ico"],
	robots: {
		index: false,
		follow: false,
	},
};

const regularFont = Inter({
	weight: "variable",
	subsets: ["latin"],
	variable: "--font-sans",
});
const headerFont = Poppins({
	weight: "700",
	subsets: ["latin"],
	variable: "--font-heading",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const colorTheme = await colorThemeSchema
		.nullable()
		.parseAsync(cookies().get("color-theme" satisfies CookieName)?.value ?? null);

	return (
		<html lang="en-US">
			<ColorThemeStoreProvider colorTheme={colorTheme}>
				<AlertDialogProvider>
					<Body fonts={[regularFont, headerFont]}>
						<TooltipProvider delayDuration={0}>
							<TrpcProvider>
								<DemoReset>{children}</DemoReset>
							</TrpcProvider>
						</TooltipProvider>

						<Toaster />
					</Body>
				</AlertDialogProvider>
			</ColorThemeStoreProvider>
		</html>
	);
}
