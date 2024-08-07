"use client";

import { usePathname } from "next/navigation";
import type { NavMenuRoute } from "@/src/routes/navMenu";
import { getRoute } from "@/src/routes/shared";
import { TypographyH1, TypographyMuted } from "./ui/server/typography";

export function PageTitle({ routes }: { routes: NavMenuRoute[] }) {
	const route = getRoute(usePathname(), routes)!;

	return (
		<header className="flex flex-col gap-1">
			<TypographyH1 className="text-3xl md:text-4xl">{route.label}</TypographyH1>
			<TypographyMuted className="text-base">{route.description}</TypographyMuted>
		</header>
	);
}
