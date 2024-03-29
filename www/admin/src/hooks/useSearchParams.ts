import {
	useRouter,
	useSearchParams as useNextSearchParams,
	usePathname,
	type ReadonlyURLSearchParams,
} from "next/navigation";
import * as React from "react";
import "client-only";

interface Options {
	onChanged?: (value: ReadonlyURLSearchParams) => void;
	removeWhenValueIsEmptyString?: boolean;
	/** Uses `router.replace()` instead of `router.push()` */
	replace?: boolean;
}

export function useSearchParams(options?: Options): {
	searchParams: ReadonlyURLSearchParams;
	setSearchParams: (values: Record<string, unknown>) => void;
} {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useNextSearchParams();

	React.useEffect(
		() => {
			options?.onChanged?.(searchParams);
		},
		// If we include options in the dependency array, it will call it infinitely
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[searchParams],
	);

	function navigate(href: string) {
		if (options?.replace) {
			router.replace(href);
		} else {
			router.push(href);
		}
	}
	function setSearchParams(values: Record<string, unknown>) {
		const queryString = createQueryString(values);

		// If the query string is empty, remove it from the URL
		if (queryString === "") {
			navigate(pathname);
			return;
		}
		navigate(`${pathname}?${queryString}`);

		// Get a new searchParams string by merging the current
		// searchParams with a provided key/value pair
		function createQueryString(values: Record<string, unknown>) {
			const params = new URLSearchParams(searchParams.toString());

			for (const [key, value] of Object.entries(values)) {
				if (value !== undefined) {
					if (options?.removeWhenValueIsEmptyString && value === "") {
						params.delete(key);
					} else {
						params.set(key, value as string);
					}
				} else {
					params.delete(key);
				}
			}

			return params.toString();
		}
	}

	return { searchParams, setSearchParams };
}
