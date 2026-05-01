import type { HTTPEvent } from "@h3js/h3";
import { HTTPError } from "@h3js/h3";
import type { Token, TokenStore } from "../src/mod.ts";

export interface Auth {
    requireAuth(event: HTTPEvent): Promise<Token>;
    requireAdmin(event: HTTPEvent): Promise<Token>;
}

export function createAuth(tokens: TokenStore): Auth {
    async function requireAuth(event: HTTPEvent): Promise<Token> {
        const token = await _extractToken(tokens, event);
        if (!token) throw new HTTPError("Unauthorized", { status: 401 });
        return token;
    }

    async function requireAdmin(event: HTTPEvent): Promise<Token> {
        const token = await requireAuth(event);
        if (!token.isAdmin) throw new HTTPError("Forbidden", { status: 403 });
        return token;
    }

    return { requireAuth, requireAdmin };
}

async function _extractToken(tokens: TokenStore, event: HTTPEvent): Promise<Token | null> {
    const auth = event.req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    return await tokens.verify(auth.slice(7));
}
