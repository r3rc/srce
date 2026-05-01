import { encodeHex } from "@std/encoding/hex";
import { UntarStream } from "@std/tar/untar-stream";
import { object, pipe, regex, safeParse, string, unknown } from "@valibot/valibot";
import type { ExportsMap, Manifest } from "./entities.ts";
import { normalizePath, validateExports } from "./meta.ts";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const DENO_CONFIG_SCHEMA = object({
    name: pipe(string(), regex(/^@[^/]+\/.+$/, "must be in @scope/name format")),
    version: string(),
    exports: unknown()
});

export interface TarballContents {
    files: Map<string, Uint8Array<ArrayBuffer>>;
    manifest: Manifest;
    exports: ExportsMap;
    scope: string;
    name: string;
    version: string;
}

export class TarballError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TarballError";
    }
}

export async function extractTarball(tgz: Uint8Array): Promise<TarballContents> {
    const files = new Map<string, Uint8Array<ArrayBuffer>>();
    const seen = new Set<string>();

    const stream = ReadableStream.from([tgz])
        .pipeThrough(new DecompressionStream("gzip") as TransformStream<Uint8Array, Uint8Array>)
        .pipeThrough(new UntarStream());

    let totalSize = 0;

    for await (const entry of stream) {
        if (!entry.readable) continue;

        const path = normalizePath(entry.path);

        if (path.startsWith("/.git/")) {
            await entry.readable.cancel();
            throw new TarballError(`path "${path}" is inside .git/`);
        }

        const lower = path.toLowerCase();
        if (seen.has(lower)) {
            await entry.readable.cancel();
            throw new TarballError(`case-insensitive duplicate path: "${path}"`);
        }

        const bytes = await _readEntryBytes(entry.readable);

        if (bytes.length > MAX_FILE_SIZE) {
            throw new TarballError(`file "${path}" exceeds 20 MB limit (${bytes.length} bytes)`);
        }
        totalSize += bytes.length;
        if (totalSize > MAX_TOTAL_SIZE) {
            throw new TarballError("tarball total size exceeds 20 MB limit");
        }

        files.set(path, bytes);
        seen.add(lower);
    }

    const configRaw = files.get("/deno.json");
    if (!configRaw) throw new TarballError("tarball must contain deno.json at the root");

    const { scope, name, version, exports: rawExports } = _parseConfig(configRaw);

    let exports: ExportsMap;
    try {
        exports = validateExports(rawExports);
    } catch (e) {
        throw new TarballError((e as Error).message);
    }

    for (const [key, value] of Object.entries(exports)) {
        const filePath = normalizePath(value);
        if (!files.has(filePath)) {
            throw new TarballError(`export "${key}" points to "${value}" which does not exist in the tarball`);
        }
    }

    const manifest: Manifest = {};
    for (const [filePath, bytes] of files) {
        manifest[filePath] = { size: bytes.length, checksum: await _sha256Hex(bytes) };
    }

    return { files, manifest, exports, scope, name, version };
}

async function _readEntryBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    // new ArrayBuffer(n) ensures the buffer type is ArrayBuffer, not ArrayBufferLike,
    // which is required by crypto.subtle.digest
    const out = new Uint8Array(new ArrayBuffer(total));
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

async function _sha256Hex(data: Uint8Array<ArrayBuffer>): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return `sha256-${encodeHex(buf)}`;
}

function _parseConfig(raw: Uint8Array): { scope: string; name: string; version: string; exports: unknown } {
    let text: string;
    try {
        text = new TextDecoder().decode(raw);
    } catch {
        throw new TarballError("deno.json is not valid UTF-8");
    }
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        throw new TarballError("deno.json is not valid JSON");
    }
    const result = safeParse(DENO_CONFIG_SCHEMA, json);
    if (!result.success) {
        const msg = result.issues[0]?.message ?? "invalid";
        throw new TarballError(`deno.json: ${msg}`);
    }
    const { name: fullName, version, exports } = result.output;
    const match = fullName.match(/^@([^/]+)\/(.+)$/);
    if (!match || !match[1] || !match[2]) {
        throw new TarballError("deno.json: invalid name format");
    }
    return { scope: match[1], name: match[2], version, exports };
}
