import { defineCommand } from "@unjs/citty";
import type { Package, Version } from "../../src/mod.ts";
import { apiCall, resolveAuth } from "../client.ts";

export const infoCmd = defineCommand({
    meta: { description: "Show package info and versions" },
    args: {
        package: { type: "string", description: "@scope/name", required: true }
    },
    async run({ args }) {
        const match = args.package.match(/^@?([^/]+)\/(.+)$/);
        if (!match || !match[1] || !match[2]) {
            throw new Error(`Invalid package format: ${args.package}. Expected @scope/name`);
        }
        const [, scope, name] = match;
        const config = await resolveAuth();
        const pkg = await apiCall<Package & { versions: Version[] }>(
            config,
            "GET",
            `/packages/@${scope}/${name}`
        );
        console.log(`@${pkg.scope}/${pkg.name}  latest: ${pkg.latest ?? "none"}`);
        for (const v of pkg.versions) {
            console.log(`  ${v.version}${v.isYanked ? " (yanked)" : ""}`);
        }
    }
});
