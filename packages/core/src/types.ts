/* eslint-disable no-var */
import type { ApiClient } from "./client";

declare global {
	var client: ApiClient | undefined;
}

export interface ClientConfigBase {
	/**
	 * URL of your self-hosted CMS
	 * @example "https://lavacms.com/admin"
	 */
	url: string;
	/** Token copied from `Settings > Connection` */
	token: string;
	/** Log requests and responses to console */
	log?: boolean;
}
