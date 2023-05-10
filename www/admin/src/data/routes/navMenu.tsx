import type { Route as NextRoute } from "next";
import {
	HomeIcon,
	Cog6ToothIcon,
	Square2StackIcon,
	RectangleGroupIcon,
	CircleStackIcon,
} from "@heroicons/react/24/outline";

export interface NavMenuRoute {
	label: string;
	path: NextRoute;
	description: string;
	icon?: React.ReactNode;
	hasChildren?: boolean;
}

export const routes: NavMenuRoute[] = [
	{
		label: "Dashboard",
		path: "/dashboard",
		description: "asd",
		icon: <HomeIcon className="w-5" />,
	},
	{
		label: "Pages",
		path: "/dashboard/pages",
		description: "Create and manage your pages.",
		icon: <Square2StackIcon className="w-5" />,
	},
	{
		label: "Layouts",
		path: "/dashboard/layouts" as NextRoute,
		description: "View your page layouts.",
		icon: <RectangleGroupIcon className="w-5" />,
	},
	{
		label: "Content",
		path: "/dashboard/content" as NextRoute,
		description: "Manage your content blocks.",
		icon: <CircleStackIcon className="w-5" />,
	},
	{
		label: "Settings",
		path: "/dashboard/settings",
		description: "Manage your website settings.",
		icon: <Cog6ToothIcon className="w-5" />,
		hasChildren: true,
	},
];

export function getRoute(path: string): NavMenuRoute | undefined {
	for (const route of routes) {
		if (route.path === path) {
			return route;
		}

		if (route.hasChildren && path.startsWith(route.path)) {
			return route;
		}
	}
}
