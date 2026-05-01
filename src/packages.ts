import type { Database } from "./database.ts";
import type { Package, Version } from "./entities.ts";
import type { PackageRow, VersionRow } from "./tables.ts";

export type { Package };

export interface PackageStore {
    get(scope: string, name: string): Package | null;
    list(scope?: string): Package[];
    upsert(scope: string, name: string): void;
    updateLatest(scope: string, name: string, latest: string | null): void;
    createVersion(scope: string, name: string, version: string): void;
    getVersion(scope: string, name: string, version: string): Version | null;
    listVersions(scope: string, name: string): Version[];
    yank(scope: string, name: string, version: string): void;
}

export function createPackageStore(db: Database): PackageStore {
    const selectPackage = db.prepare<PackageRow>(
        "SELECT scope, name, latest, created_at FROM packages WHERE scope = ? AND name = ?"
    );
    const selectAllPackages = db.prepare<PackageRow>(
        "SELECT scope, name, latest, created_at FROM packages ORDER BY scope, name"
    );
    const selectPackagesByScope = db.prepare<PackageRow>(
        "SELECT scope, name, latest, created_at FROM packages WHERE scope = ? ORDER BY name"
    );
    const selectVersion = db.prepare<VersionRow>(
        "SELECT version, created_at, yanked FROM versions WHERE scope = ? AND name = ? AND version = ?"
    );
    const selectVersions = db.prepare<VersionRow>(
        "SELECT version, created_at, yanked FROM versions WHERE scope = ? AND name = ? ORDER BY created_at"
    );

    function get(scope: string, name: string): Package | null {
        const row = selectPackage.get(scope, name) as PackageRow | undefined;
        return row ? _rowToPackage(row) : null;
    }

    function list(scope?: string): Package[] {
        const rows = scope
            ? (selectPackagesByScope.all(scope) as PackageRow[])
            : (selectAllPackages.all() as PackageRow[]);
        return rows.map(_rowToPackage);
    }

    function upsert(scope: string, name: string): void {
        db.exec(
            "INSERT OR IGNORE INTO packages (scope, name, latest, created_at) VALUES (?, ?, NULL, ?)",
            scope,
            name,
            new Date().toISOString()
        );
    }

    function updateLatest(scope: string, name: string, latest: string | null): void {
        db.exec("UPDATE packages SET latest = ? WHERE scope = ? AND name = ?", latest, scope, name);
    }

    function createVersion(scope: string, name: string, version: string): void {
        db.exec(
            "INSERT INTO versions (scope, name, version, created_at, yanked) VALUES (?, ?, ?, ?, 0)",
            scope,
            name,
            version,
            new Date().toISOString()
        );
    }

    function getVersion(scope: string, name: string, version: string): Version | null {
        const row = selectVersion.get(scope, name, version) as VersionRow | undefined;
        return row ? _rowToVersion(row) : null;
    }

    function listVersions(scope: string, name: string): Version[] {
        return (selectVersions.all(scope, name) as VersionRow[]).map(_rowToVersion);
    }

    function yank(scope: string, name: string, version: string): void {
        db.exec(
            "UPDATE versions SET yanked = 1 WHERE scope = ? AND name = ? AND version = ?",
            scope,
            name,
            version
        );
    }

    return { get, list, upsert, updateLatest, createVersion, getVersion, listVersions, yank };
}

function _rowToPackage(r: PackageRow): Package {
    return { scope: r.scope, name: r.name, latest: r.latest, createdAt: r.created_at };
}

function _rowToVersion(r: VersionRow): Version {
    return { version: r.version, createdAt: r.created_at, isYanked: r.yanked !== 0 };
}
