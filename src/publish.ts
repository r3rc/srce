import { computeLatest } from "./meta.ts";
import type { PackageStore } from "./packages.ts";
import type { Storage } from "./storage.ts";
import type { TarballContents } from "./tarball.ts";

export class PublishError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PublishError";
    }
}

export async function publishPackage(
    packages: PackageStore,
    storage: Storage,
    contents: TarballContents
): Promise<void> {
    const { scope, name, version, files, exports, manifest } = contents;
    if (packages.getVersion(scope, name, version)) {
        throw new PublishError(`@${scope}/${name}@${version} already exists`);
    }
    for (const [filePath, bytes] of files) {
        await storage.writeFile(scope, name, version, filePath, bytes);
    }
    await storage.writeVersionMeta(scope, name, version, { exports, manifest });
    packages.upsert(scope, name);
    packages.createVersion(scope, name, version);
    packages.updateLatest(scope, name, computeLatest(packages.listVersions(scope, name)));
}
