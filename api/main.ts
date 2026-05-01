import { H3 } from "@h3js/h3";
import { serve } from "@h3js/srvx";
import { createDatabase, createPackageStore, createStorage, createTokenStore, migrateDatabase } from "../src/mod.ts";
import { createAuth } from "./auth.ts";
import { registerFilesRoutes } from "./handlers/files.ts";
import { registerPackagesRoutes } from "./handlers/packages.ts";
import { registerPublishRoute } from "./handlers/publish.ts";
import { registerTokensRoutes } from "./handlers/tokens.ts";

export function startServer(port: number, dataDir: string): void {
    const db = createDatabase(`${dataDir}/registry.db`);
    migrateDatabase(db);
    const tokens = createTokenStore(db);
    const packages = createPackageStore(db);
    const storage = createStorage(dataDir);
    const auth = createAuth(tokens);

    const app = new H3();
    registerFilesRoutes(app, packages, storage);
    registerPackagesRoutes(app, packages, auth);
    registerPublishRoute(app, packages, storage, auth);
    registerTokensRoutes(app, tokens, auth);

    serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
}

if (import.meta.main) {
    const port = parseInt(_getArg("--port") ?? "4873", 10);
    const dataDir = _getArg("--data") ?? "./data";
    startServer(port, dataDir);
}

function _getArg(flag: string): string | undefined {
    const idx = Deno.args.indexOf(flag);
    return idx !== -1 ? Deno.args[idx + 1] : undefined;
}
