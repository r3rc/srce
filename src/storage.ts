import { dirname, join } from "@std/path";
import type { VersionMeta } from "./entities.ts";

export interface Storage {
    writeFile(scope: string, name: string, version: string, filePath: string, content: Uint8Array): Promise<void>;
    readFile(scope: string, name: string, version: string, filePath: string): Promise<Uint8Array | null>;
    writeVersionMeta(scope: string, name: string, version: string, meta: VersionMeta): Promise<void>;
    readVersionMeta(scope: string, name: string, version: string): Promise<VersionMeta | null>;
}

export function createStorage(dataDir: string): Storage {
    async function writeFile(
        scope: string,
        name: string,
        version: string,
        filePath: string,
        content: Uint8Array
    ): Promise<void> {
        // filePath is always /foo.ts — strip leading slash for join
        const dest = join(_fileDir(dataDir, scope, name, version), filePath.slice(1));
        await Deno.mkdir(dirname(dest), { recursive: true });
        await Deno.writeFile(dest, content);
    }

    async function readFile(
        scope: string,
        name: string,
        version: string,
        filePath: string
    ): Promise<Uint8Array | null> {
        const src = join(_fileDir(dataDir, scope, name, version), filePath.slice(1));
        try {
            return await Deno.readFile(src);
        } catch (e) {
            if (e instanceof Deno.errors.NotFound) return null;
            throw e;
        }
    }

    async function writeVersionMeta(scope: string, name: string, version: string, meta: VersionMeta): Promise<void> {
        const dest = _versionMetaPath(dataDir, scope, name, version);
        await Deno.mkdir(join(dataDir, `@${scope}`, name), { recursive: true });
        await Deno.writeTextFile(dest, JSON.stringify(meta));
    }

    async function readVersionMeta(scope: string, name: string, version: string): Promise<VersionMeta | null> {
        const src = _versionMetaPath(dataDir, scope, name, version);
        try {
            const text = await Deno.readTextFile(src);
            return JSON.parse(text) as VersionMeta;
        } catch (e) {
            if (e instanceof Deno.errors.NotFound) return null;
            throw e;
        }
    }

    return { writeFile, readFile, writeVersionMeta, readVersionMeta };
}

function _fileDir(dataDir: string, scope: string, name: string, version: string): string {
    return join(dataDir, `@${scope}`, name, version);
}

function _versionMetaPath(dataDir: string, scope: string, name: string, version: string): string {
    return join(dataDir, `@${scope}`, name, `${version}_meta.json`);
}
