import { defineCommand } from "@unjs/citty";
import { writeConfig } from "../config.ts";

export const loginCmd = defineCommand({
    meta: { description: "Save registry credentials to local config" },
    args: {
        registry: { type: "string", description: "Registry URL", required: true },
        token: { type: "string", description: "API token", required: true }
    },
    async run({ args }) {
        await writeConfig({ registryUrl: args.registry, token: args.token });
        console.log(`Logged in to ${args.registry}`);
    }
});
