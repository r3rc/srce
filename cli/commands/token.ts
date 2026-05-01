import { defineCommand } from "@unjs/citty";
import type { Token } from "../../src/mod.ts";
import { apiCall, resolveAuth } from "../client.ts";

const listCmd = defineCommand({
    meta: { description: "List all tokens" },
    async run() {
        const config = await resolveAuth();
        const tokens = await apiCall<Token[]>(config, "GET", "/tokens");
        for (const t of tokens) {
            console.log(`${t.hash}  ${t.isAdmin ? "admin" : "user"}  ${t.description}`);
        }
    }
});

const createCmd = defineCommand({
    meta: { description: "Create a new token" },
    args: {
        description: { type: "string", description: "Token description", required: true },
        admin: { type: "boolean", description: "Grant admin privileges", default: false }
    },
    async run({ args }) {
        const config = await resolveAuth();
        const { raw } = await apiCall<{ raw: string }>(config, "POST", "/tokens", {
            body: JSON.stringify({ description: args.description, isAdmin: args.admin }),
            contentType: "application/json"
        });
        console.log(`Token: ${raw}`);
    }
});

const revokeCmd = defineCommand({
    meta: { description: "Revoke a token by hash" },
    args: {
        hash: { type: "string", description: "Token hash", required: true }
    },
    async run({ args }) {
        const config = await resolveAuth();
        await apiCall(config, "DELETE", `/tokens/${args.hash}`);
        console.log("Token revoked.");
    }
});

export const tokenCmd = defineCommand({
    meta: { description: "Manage API tokens" },
    subCommands: {
        list: listCmd,
        create: createCmd,
        revoke: revokeCmd
    }
});
