import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@api": ".",
		},
	},
});