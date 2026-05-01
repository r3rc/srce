export interface Token {
    hash: string;
    description: string;
    isAdmin: boolean;
    createdAt: string;
}

export interface Package {
    scope: string;
    name: string;
    latest: string | null;
    createdAt: string;
}

export interface Version {
    version: string;
    createdAt: string;
    isYanked: boolean;
}

export interface ManifestEntry {
    size: number;
    checksum: string;
}

export type ExportsMap = Record<string, string>;
export type Manifest = Record<string, ManifestEntry>;

export interface PackageMeta {
    scope: string;
    name: string;
    latest: string | null;
    versions: Record<string, { yanked?: true; createdAt: string }>;
}

export interface VersionMeta {
    exports: ExportsMap;
    manifest: Manifest;
}
