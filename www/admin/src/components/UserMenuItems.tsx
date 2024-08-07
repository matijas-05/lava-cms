"use client";

import { ArrowLeftEndOnRectangleIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/src/components/ui/client/DropdownMenu";
import { Loader } from "@/src/components/ui/server/Loader";
import { useColorThemeStore } from "@/src/stores/colorTheme";
import { trpc, type ClientMeta } from "@/src/utils/trpc";

export const ThemeSwitchItem = () => {
	const { colorTheme, setColorTheme } = useColorThemeStore((state) => ({
		colorTheme: state.colorTheme,
		setColorTheme: state.setColorTheme,
	}));

	return (
		<DropdownMenuItem onSelect={() => setColorTheme(colorTheme === "dark" ? "light" : "dark")}>
			{colorTheme === "dark" ? <MoonIcon className="w-4" /> : <SunIcon className="w-4" />}
			<span>Switch theme</span>
		</DropdownMenuItem>
	);
};

export const LogoutItem = () => {
	const mutation = trpc.auth.signOut.useMutation({
		meta: {
			noInvalidate: true,
		} satisfies ClientMeta,
	});
	const router = useRouter();

	return (
		<DropdownMenuItem
			className="text-destructive"
			onClick={async (e) => {
				e.preventDefault();
				await mutation.mutateAsync();
				router.replace("/signin");
			}}
		>
			{mutation.isLoading || mutation.isSuccess ? (
				<Loader className="w-4" />
			) : (
				<ArrowLeftEndOnRectangleIcon className="w-4" />
			)}
			<span>Sign out</span>
		</DropdownMenuItem>
	);
};
