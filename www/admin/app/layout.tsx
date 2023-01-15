import React from "react";
import RootStyleRegistry from "./emotion";
import "@admin/src/styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<head />
			<body>
				<RootStyleRegistry>{children}</RootStyleRegistry>
			</body>
		</html>
	);
}
