import type { H3 } from "@h3js/h3";
import { getRouterParam, HTTPError, readBody } from "@h3js/h3";
import type { TokenStore } from "../../src/mod.ts";
import type { Auth } from "../auth.ts";

export function registerTokensRoutes(app: H3, tokens: TokenStore, auth: Auth): void {
    app.get("/tokens", async (event) => {
        await auth.requireAdmin(event);
        return tokens.list();
    });

    app.post("/tokens", async (event) => {
        await auth.requireAdmin(event);
        const body = await readBody<{ description?: string; isAdmin?: boolean }>(event);
        if (!body?.description) throw new HTTPError("description is required", { status: 400 });
        const raw = await tokens.create(body.description, body.isAdmin ?? false);
        return { raw };
    });

    app.delete("/tokens/:hash", async (event) => {
        await auth.requireAdmin(event);
        const hash = getRouterParam(event, "hash") ?? "";
        tokens.revoke(hash);
        return new Response(null, { status: 204 });
    });
}
