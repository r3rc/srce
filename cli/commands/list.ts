import { defineCommand } from "@unjs/citty";
import type { Package } from "../../src/mod.ts";
import { apiCall, resolveAuth } from "../client.ts";

export const listCmd = defineCommand({
    meta: { description: "List packages in the registry" },
    async run() {
        const config = await resolveAuth();
        const packages = await apiCall<Package[]>(config, "GET", "/packages");
        for (const pkg of packages) {
            console.log(`@${pkg.scope}/${pkg.name}  latest: ${pkg.latest ?? "none"}`);
        }
    }
});
