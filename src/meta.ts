import type { SemVer } from "@std/semver";
import { compare, tryParse } from "@std/semver";
import type { ExportsMap, PackageMeta, Version } from "./entities.ts";

export function computeLatest(versions: Version[]): string | null {
    const candidates: { raw: string; parsed: SemVer }[] = [];
    for (const v of versions) {
        if (v.isYanked) continue;
        const parsed = tryParse(v.version);
        if (!parsed || (parsed.prerelease?.length ?? 0) > 0) continue;
        candidates.push({ raw: v.version, parsed });
    }
    candidates.sort((a, b) => compare(a.parsed, b.parsed));
    return candidates.at(-1)?.raw ?? null;
}

export function buildPackageMeta(scope: string, name: string, versions: Version[]): PackageMeta {
    const versionMap: PackageMeta["versions"] = {};
    for (const v of versions) {
        versionMap[v.version] = v.isYanked ? { yanked: true, createdAt: v.createdAt } : { createdAt: v.createdAt };
    }
    return { scope, name, latest: computeLatest(versions), versions: versionMap };
}

export function validateExports(exports: unknown): ExportsMap {
    if (typeof exports !== "object" || exports === null || Array.isArray(exports)) {
        throw new Error("exports must be a non-null object");
    }
    const map = exports as Record<string, unknown>;
    if (Object.keys(map).length === 0) {
        throw new Error("exports map must not be empty");
    }
    for (const [key, value] of Object.entries(map)) {
        if (!key.startsWith("./") && key !== ".") {
            throw new Error(`export key "${key}" must start with "./" or be "."`);
        }
        const hasExtension = typeof value === "string" && value.slice(value.lastIndexOf("/") + 1).includes(".");
        if (typeof value !== "string" || !value.startsWith("./") || !hasExtension) {
            throw new Error(`export value for "${key}" must be a relative path with an extension`);
        }
    }
    return map as ExportsMap;
}

export function normalizePath(p: string): string {
    const stripped = p.startsWith("./") ? p.slice(1) : p;
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
}
