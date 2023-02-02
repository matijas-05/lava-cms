import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { renderTrpcPanel } from "trpc-panel";
import { appRouter } from "@api/trpc/routes/_app";
import { env } from "@api/env/server";
import { mock } from "@api/mockServer";

export const app = express();
export type App = ReturnType<typeof init> extends Promise<infer T> ? T : never;
export const PORT = 4000;

export async function init(mockHandlers?: any) {
	if (mockHandlers) {
		mock(mockHandlers, app);
	}

	app.use(cors({ origin: "http://localhost:8080" }));
	app.use(
		"/trpc",
		createExpressMiddleware({
			router: appRouter,
		})
	);

	app.get("/trpcadmin", (_, res) => {
		if (env.NODE_ENV === "development") {
			res.send(renderTrpcPanel(appRouter, { url: "http://localhost:4000/trpc" }));
		}
	});

	return app;
}
