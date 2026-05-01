import { defineCommand } from "@unjs/citty";
import { createTarball } from "../../src/mod.ts";
import { apiCall, resolveAuth } from "../client.ts";

export const publishCmd = defineCommand({
    meta: { description: "Publish the current package to the registry" },
    async run() {
        const config = await resolveAuth();
        const tgz = await createTarball(Deno.cwd());
        await apiCall(config, "POST", "/publish", {
            body: tgz,
            contentType: "application/octet-stream"
        });
        console.log("Published successfully.");
    }
});
