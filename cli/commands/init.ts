import { join } from "@std/path";
import { defineCommand } from "@unjs/citty";
import { createDatabase, createTokenStore, migrateDatabase } from "../../src/mod.ts";

export const initCmd = defineCommand({
    meta: { description: "Initialize a new registry and print the first admin token" },
    args: {
        data: { type: "string", description: "Data directory", required: true }
    },
    async run({ args }) {
        await Deno.mkdir(args.data, { recursive: true });
        const db = createDatabase(join(args.data, "registry.db"));
        migrateDatabase(db);
        const tokens = createTokenStore(db);
        const raw = await tokens.create("admin", true);
        console.log("Registry initialized.");
        console.log(`Admin token: ${raw}`);
    }
});
