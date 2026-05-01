import { assertEquals, assertThrows } from "@std/assert";
import type { Version } from "./entities.ts";
import { buildPackageMeta, computeLatest, normalizePath, validateExports } from "./meta.ts";

const ver = (version: string, isYanked = false): Version => ({
    version,
    createdAt: "2025-01-01T00:00:00Z",
    isYanked
});

Deno.test("computeLatest - returns highest non-yanked non-prerelease", () => {
    assertEquals(computeLatest([ver("1.0.0"), ver("1.1.0"), ver("2.0.0")]), "2.0.0");
});

Deno.test("computeLatest - skips yanked versions", () => {
    assertEquals(computeLatest([ver("1.0.0"), ver("2.0.0", true)]), "1.0.0");
});

Deno.test("computeLatest - skips prerelease versions", () => {
    assertEquals(computeLatest([ver("1.0.0"), ver("2.0.0-alpha.1")]), "1.0.0");
});

Deno.test("computeLatest - returns null when all yanked", () => {
    assertEquals(computeLatest([ver("1.0.0", true)]), null);
});

Deno.test("computeLatest - returns null for empty list", () => {
    assertEquals(computeLatest([]), null);
});

Deno.test("computeLatest - returns null when only prereleases", () => {
    assertEquals(computeLatest([ver("1.0.0-beta.1")]), null);
});

Deno.test("buildPackageMeta - includes yanked flag only on yanked versions", () => {
    const meta = buildPackageMeta("r3rc", "foo", [ver("1.0.0"), ver("1.1.0", true)]);
    assertEquals(meta.scope, "r3rc");
    assertEquals(meta.name, "foo");
    assertEquals(meta.latest, "1.0.0");
    assertEquals(meta.versions["1.0.0"]?.yanked, undefined);
    assertEquals(meta.versions["1.1.0"]?.yanked, true);
});

Deno.test("validateExports - accepts valid map", () => {
    const result = validateExports({ ".": "./mod.ts", "./utils": "./utils.ts" });
    assertEquals(result["."], "./mod.ts");
});

Deno.test("validateExports - rejects non-object", () => {
    assertThrows(() => validateExports(null));
    assertThrows(() => validateExports("string"));
    assertThrows(() => validateExports([]));
});

Deno.test("validateExports - rejects empty map", () => {
    assertThrows(() => validateExports({}));
});

Deno.test("validateExports - rejects key without ./ prefix", () => {
    assertThrows(() => validateExports({ "utils": "./utils.ts" }));
});

Deno.test("validateExports - rejects value without extension", () => {
    assertThrows(() => validateExports({ ".": "./mod" }));
});

Deno.test("validateExports - rejects value not starting with ./", () => {
    assertThrows(() => validateExports({ ".": "mod.ts" }));
});

Deno.test("normalizePath - strips ./ prefix", () => {
    assertEquals(normalizePath("./mod.ts"), "/mod.ts");
});

Deno.test("normalizePath - keeps leading /", () => {
    assertEquals(normalizePath("/mod.ts"), "/mod.ts");
});

Deno.test("normalizePath - adds leading / when missing", () => {
    assertEquals(normalizePath("mod.ts"), "/mod.ts");
});
