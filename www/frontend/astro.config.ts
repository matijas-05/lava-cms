import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import { lavaCmsAstro } from "@lavacms/astro";

const { CMS_URL, CMS_TOKEN } = loadEnv(import.meta.env.MODE, process.cwd(), "") as ImportMetaEnv;

export default defineConfig({
	server: {
		host: true,
	},
	integrations: [
		lavaCmsAstro({
			url: CMS_URL,
			token: CMS_TOKEN,
			log: import.meta.env.DEV,
			components: {
				Author: "./src/components/Author.astro",
				Button: "./src/components/Button.astro",
				Quote: "./src/components/Quote.astro",
				Random: "./src/components/Random.astro",
				"Array test": "./src/components/Array test.astro",
				"Array test 2": "./src/components/Array test 2.astro",
				Paragraph: "./src/components/Paragraph.astro",
			},
			enableFallbackComponent: true,
		}),
	],
});
