"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, loggerLink } from "@trpc/client";
import { trpcReact } from "@admin/src/utils/trpcReact";
import { env } from "@admin/src/env/client.mjs";

function TrpcProvider(props: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpcReact.createClient({
			links: [
				loggerLink({
					enabled: () => !!env.NEXT_PUBLIC_DEV,
				}),

				!!env.NEXT_PUBLIC_DEV
					? // Use httpLink in dev so tests work
					  httpLink({
							url: "/admin/api/trpc",
					  })
					: httpBatchLink({
							url: "/admin/api/trpc",
					  }),
			],
		})
	);
	return (
		<trpcReact.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
		</trpcReact.Provider>
	);
}

export default TrpcProvider;
