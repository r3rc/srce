import { assertEquals, assertInstanceOf, assertRejects } from "@std/assert";
import { TarStream, type TarStreamInput } from "@std/tar/tar-stream";
import { extractTarball, TarballError } from "./tarball.ts";

async function makeTgz(entries: TarStreamInput[]): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    const writer = new WritableStream<Uint8Array>({
        write(chunk) {
            chunks.push(chunk);
        }
    });
    await ReadableStream.from(entries)
        .pipeThrough(new TarStream())
        .pipeThrough(new CompressionStream("gzip"))
        .pipeTo(writer);
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
        out.set(c, offset);
        offset += c.length;
    }
    return out;
}

function textEntry(path: string, content: string): TarStreamInput {
    const bytes = new TextEncoder().encode(content);
    return {
        type: "file",
        path,
        size: bytes.length,
        readable: ReadableStream.from([bytes])
    };
}

const VALID_CONFIG = JSON.stringify({
    name: "@r3rc/foo",
    version: "1.0.0",
    exports: { ".": "./mod.ts" }
});

Deno.test("extractTarball - extracts valid tarball", async () => {
    const tgz = await makeTgz([
        textEntry("deno.json", VALID_CONFIG),
        textEntry("mod.ts", "export const x = 1;")
    ]);
    const result = await extractTarball(tgz);
    assertEquals(result.scope, "r3rc");
    assertEquals(result.name, "foo");
    assertEquals(result.version, "1.0.0");
    assertEquals(Object.keys(result.exports), ["."]);
    assertEquals(result.files.has("/mod.ts"), true);
    assertEquals(result.files.has("/deno.json"), true);
});

Deno.test("extractTarball - normalizes paths with ./ prefix", async () => {
    const tgz = await makeTgz([
        textEntry("./deno.json", VALID_CONFIG),
        textEntry("./mod.ts", "export const x = 1;")
    ]);
    const result = await extractTarball(tgz);
    assertEquals(result.files.has("/deno.json"), true);
    assertEquals(result.files.has("/mod.ts"), true);
});

Deno.test("extractTarball - manifest has size and sha256 checksum", async () => {
    const tgz = await makeTgz([
        textEntry("deno.json", VALID_CONFIG),
        textEntry("mod.ts", "export const x = 1;")
    ]);
    const result = await extractTarball(tgz);
    const entry = result.manifest["/mod.ts"];
    assertEquals(typeof entry?.size, "number");
    assertEquals(entry?.checksum.startsWith("sha256-"), true);
});

Deno.test("extractTarball - rejects missing deno.json", async () => {
    const tgz = await makeTgz([textEntry("mod.ts", "export const x = 1;")]);
    await assertRejects(() => extractTarball(tgz), TarballError, "deno.json");
});

Deno.test("extractTarball - rejects invalid deno.json JSON", async () => {
    const tgz = await makeTgz([textEntry("deno.json", "not json")]);
    await assertRejects(() => extractTarball(tgz), TarballError);
});

Deno.test("extractTarball - rejects deno.json without name", async () => {
    const config = JSON.stringify({ version: "1.0.0", exports: { ".": "./mod.ts" } });
    const tgz = await makeTgz([textEntry("deno.json", config), textEntry("mod.ts", "")]);
    await assertRejects(() => extractTarball(tgz), TarballError, "name");
});

Deno.test("extractTarball - rejects deno.json name without @scope/name format", async () => {
    const config = JSON.stringify({ name: "foo", version: "1.0.0", exports: { ".": "./mod.ts" } });
    const tgz = await makeTgz([textEntry("deno.json", config), textEntry("mod.ts", "")]);
    await assertRejects(() => extractTarball(tgz), TarballError, "@scope/name");
});

Deno.test("extractTarball - rejects empty exports", async () => {
    const config = JSON.stringify({ name: "@r3rc/foo", version: "1.0.0", exports: {} });
    const tgz = await makeTgz([textEntry("deno.json", config), textEntry("mod.ts", "")]);
    await assertRejects(() => extractTarball(tgz), TarballError, "empty");
});

Deno.test("extractTarball - rejects export pointing to missing file", async () => {
    const config = JSON.stringify({ name: "@r3rc/foo", version: "1.0.0", exports: { ".": "./missing.ts" } });
    const tgz = await makeTgz([textEntry("deno.json", config)]);
    await assertRejects(() => extractTarball(tgz), TarballError, "missing.ts");
});

Deno.test("extractTarball - rejects .git/ paths", async () => {
    const tgz = await makeTgz([
        textEntry("deno.json", VALID_CONFIG),
        textEntry("mod.ts", ""),
        textEntry(".git/config", "")
    ]);
    await assertRejects(() => extractTarball(tgz), TarballError, ".git/");
});

Deno.test("extractTarball - rejects case-insensitive duplicate paths", async () => {
    const tgz = await makeTgz([
        textEntry("deno.json", VALID_CONFIG),
        textEntry("mod.ts", "export const a = 1;"),
        textEntry("Mod.ts", "export const b = 2;")
    ]);
    await assertRejects(() => extractTarball(tgz), TarballError, "duplicate");
});

Deno.test("TarballError is an Error subclass", () => {
    const e = new TarballError("test");
    assertInstanceOf(e, TarballError);
    assertInstanceOf(e, Error);
    assertEquals(e.message, "test");
    assertEquals(e.name, "TarballError");
});
