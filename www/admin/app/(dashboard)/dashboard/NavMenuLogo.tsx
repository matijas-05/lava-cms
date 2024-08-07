"use client";

import type { NextFont } from "next/dist/compiled/@next/font";
import { IconVolcano } from "@tabler/icons-react";
import Link from "next/link";
import { TypographyH1, TypographyMuted } from "@/src/components/ui/server/typography";
import { useNavMenuStore } from "@/src/stores/navMenu";
import { cn } from "@/src/utils/styling";

export function NavMenuLogo({ version, font }: { version: string; font: NextFont }) {
	const { setIsOpen } = useNavMenuStore((state) => ({ setIsOpen: state.setIsOpen }));

	return (
		<Link
			onClick={() => setTimeout(() => setIsOpen(false))}
			href="/dashboard/pages"
			className="mb-8 flex items-center justify-center gap-2"
			aria-label="Logo link"
		>
			<IconVolcano size={56} aria-label="Logo image" />
			<TypographyH1 className={cn("relative select-none text-4xl", font.className)}>
				Lava
				<TypographyMuted className="absolute -right-5 -top-[3px] rotate-[20deg] font-sans text-xs font-bold tracking-normal">
					v{version}
				</TypographyMuted>
			</TypographyH1>
		</Link>
	);
}
