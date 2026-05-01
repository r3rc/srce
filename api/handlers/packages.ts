import type { H3 } from "@h3js/h3";
import { getRouterParam, HTTPError } from "@h3js/h3";
import type { PackageStore } from "../../src/mod.ts";
import { computeLatest } from "../../src/mod.ts";
import type { Auth } from "../auth.ts";

export function registerPackagesRoutes(app: H3, packages: PackageStore, auth: Auth): void {
    app.get("/packages", (event) => {
        const scope = new URL(event.req.url).searchParams.get("scope") ?? undefined;
        return packages.list(scope);
    });

    app.get("/packages/@:scope/:name", (event) => {
        const scope = getRouterParam(event, "scope") ?? "";
        const name = getRouterParam(event, "name") ?? "";
        const pkg = packages.get(scope, name);
        if (!pkg) throw new HTTPError("Package not found", { status: 404 });
        return { ...pkg, versions: packages.listVersions(scope, name) };
    });

    app.post("/packages/@:scope/:name/:version/yank", async (event) => {
        await auth.requireAdmin(event);
        const scope = getRouterParam(event, "scope") ?? "";
        const name = getRouterParam(event, "name") ?? "";
        const version = getRouterParam(event, "version") ?? "";
        if (!packages.getVersion(scope, name, version)) {
            throw new HTTPError("Version not found", { status: 404 });
        }
        packages.yank(scope, name, version);
        packages.updateLatest(scope, name, computeLatest(packages.listVersions(scope, name)));
        return new Response(null, { status: 204 });
    });
}
