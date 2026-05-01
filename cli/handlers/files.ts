import type { H3 } from "@h3js/h3";
import { getRouterParam, HTTPError } from "@h3js/h3";
import type { PackageStore, Storage } from "../../src/mod.ts";
import { buildPackageMeta } from "../../src/mod.ts";

export function registerFilesRoutes(app: H3, packages: PackageStore, storage: Storage): void {
    app.get("/@:scope/:name/meta.json", (event) => {
        const scope = getRouterParam(event, "scope") ?? "";
        const name = getRouterParam(event, "name") ?? "";
        if (!packages.get(scope, name)) throw new HTTPError("Package not found", { status: 404 });
        return buildPackageMeta(scope, name, packages.listVersions(scope, name));
    });

    app.get("/@:scope/:name/**:rest", async (event) => {
        const scope = getRouterParam(event, "scope") ?? "";
        const name = getRouterParam(event, "name") ?? "";
        const rest = getRouterParam(event, "rest") ?? "";

        if (rest.endsWith("_meta.json")) {
            const version = rest.slice(0, -"_meta.json".length);
            const meta = await storage.readVersionMeta(scope, name, version);
            if (!meta) throw new HTTPError("Version not found", { status: 404 });
            return meta;
        }

        const slashIdx = rest.indexOf("/");
        if (slashIdx === -1) throw new HTTPError("Not found", { status: 404 });
        const version = rest.slice(0, slashIdx);
        const filePath = rest.slice(slashIdx);
        const bytes = await storage.readFile(scope, name, version, filePath);
        if (!bytes) throw new HTTPError("File not found", { status: 404 });
        return new Response(bytes, { headers: { "content-type": _contentType(filePath) } });
    });
}

function _contentType(filePath: string): string {
    if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "application/typescript";
    if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "application/javascript";
    if (filePath.endsWith(".json")) return "application/json";
    return "application/octet-stream";
}
