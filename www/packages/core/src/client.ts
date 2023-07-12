import { createTRPCProxyClient, httpBatchLink, loggerLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { PublicRouter } from "@lavacms/types";
import type { ClientConfigBase, Component } from "./types";

export class ApiClient {
	private readonly connection;

	constructor(config: ClientConfigBase) {
		this.connection = createTRPCProxyClient<PublicRouter>({
			links: [
				loggerLink({ enabled: () => !!config.log }),
				httpBatchLink({
					url: config.url.replace(/\/$/, "") + "/api/public",
					headers: {
						Authorization: `Bearer ${config.token}`,
					},
				}),
			],
			transformer: SuperJSON,
		});
	}

	/**
	 * Configured in `Settings > SEO`
	 * @returns Selected HTML `<head>` tag properties
	 */
	public async getHead() {
		return await this.connection.getConfig.query();
	}

	/**
	 * @param path Path of the page to get. Recommended to use the [URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL) `pathname` property
	 * @returns Page name and its components
	 */
	public async getPage(path: string): Promise<{ name: string; components: Component[] }> {
		const page = await this.connection.getPage.query({ path });

		if (!page) {
			throw new Error(`Page with path '${path}' not added in CMS`);
		} else {
			const { name } = page;

			// TODO: Get from CMS
			const components: Component[] = [
				{
					name: "Card",
					data: {
						title: "Products",
						body: "Browse our products",
						href: "/products",
					},
				},
				{
					name: "Card",
					data: {
						title: "About",
						body: "Learn about our company",
						href: "/about",
					},
				},
				{
					name: "Parent Card",
					data: {
						title: "Card with children",
						body: "Card with the ability to have other components inside",
						href: "/card-with-children",
						children: [
							{
								name: "Card",
								data: {
									title: "Nested card 1",
									body: "Nested card body 1",
									href: "/nested-card-1",
								},
							},
							{
								name: "Parent Card",
								data: {
									title: "Nested card 2",
									body: "Nested card body 2",
									href: "/nested-card-2",
									children: [
										{
											name: "Card",
											data: {
												title: "Nested card 2.1",
												body: "Nested card body 2.1",
												href: "/nested-card-2-1",
											},
										},
									] satisfies Component[],
								},
							},
						] satisfies Component[],
					},
				},
			];

			return { name, components };
		}
	}

	/**
	 * Returns slugs of specified group's pages. Useful for statically generating dynamic routes
	 * @param groupUrl URL of the CMS page group
	 * @returns Slugs of the pages in the group
	 * @example getPaths("/products") -> ["product-1", "product-2", "product-3"]
	 */
	public async getPaths(groupUrl: string): Promise<string[]> {
		try {
			return await this.connection.getPaths.query({ groupUrl });
		} catch (error) {
			throw new Error(`Group with URL \`${groupUrl}\` not found`);
		}
	}
}

export function useLavaCms(): ApiClient {
	if (!globalThis.client) {
		throw new Error(
			"Lava CMS client not initialized! Are you using the correct adapter for your framework?"
		);
	} else {
		return globalThis.client;
	}
}
