// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env/client.mjs";
import "./src/env/server.mjs";

/** @type {import("next").NextConfig} */
const config = {
	basePath: "/admin",
	reactStrictMode: true,
	swcMinify: true,

	redirects: async () => [
		{
			source: "/",
			destination: "/dashboard",
			permanent: true,
		},
	],
};
export default config;
