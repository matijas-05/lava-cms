"use client";

import { Navbar, Drawer, MediaQuery } from "@mantine/core";
import { useMenuStore } from "@admin/src/data/stores/dashboard";
import MenuLinks from "./MenuLinks";
import { getCardColor } from "@admin/src/utils/colors";

export default function Menu({ version }: { version: string }) {
	const menuStore = useMenuStore();
	const WIDTH = 300;

	return (
		<>
			<MediaQuery largerThan={"md"} styles={{ display: "none" }}>
				<Drawer
					size={WIDTH}
					withCloseButton={false}
					opened={menuStore.isOpen}
					onClose={() => menuStore.toggle()}
					padding={0}
					styles={(theme) => ({
						content: {
							backgroundColor: getCardColor(theme),
						},
					})}
				>
					<MenuLinks version={version} />
				</Drawer>
			</MediaQuery>

			<MediaQuery smallerThan={"md"} styles={{ display: "none" }}>
				<Navbar
					sx={(theme) => ({
						width: WIDTH,
						flexShrink: 0,
						height: "100vh",
						overflow: "auto",
						backgroundColor: getCardColor(theme),
					})}
				>
					<MenuLinks version={version} />
				</Navbar>
			</MediaQuery>
		</>
	);
}
