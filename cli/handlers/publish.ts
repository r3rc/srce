import type { H3 } from "@h3js/h3";
import { assertBodySize, HTTPError } from "@h3js/h3";
import type { PackageStore, Storage } from "../../src/mod.ts";
import { extractTarball, PublishError, publishPackage, TarballError } from "../../src/mod.ts";
import type { Auth } from "../auth.ts";

const MAX_PUBLISH_SIZE = 32 * 1024 * 1024;

export function registerPublishRoute(app: H3, packages: PackageStore, storage: Storage, auth: Auth): void {
    app.post("/publish", async (event) => {
        await auth.requireAuth(event);
        await assertBodySize(event, MAX_PUBLISH_SIZE);
        const buf = await event.req.arrayBuffer();
        const bytes = new Uint8Array(buf);

        let contents;
        try {
            contents = await extractTarball(bytes);
        } catch (e) {
            if (e instanceof TarballError) throw new HTTPError(e.message, { status: 400 });
            throw e;
        }

        try {
            await publishPackage(packages, storage, contents);
        } catch (e) {
            if (e instanceof PublishError) throw new HTTPError(e.message, { status: 409 });
            throw e;
        }

        return new Response(null, { status: 204 });
    });
}
