export interface TokenRow {
    hash: string;
    description: string;
    is_admin: 0 | 1;
    created_at: string;
}

export interface PackageRow {
    scope: string;
    name: string;
    latest: string | null;
    created_at: string;
}

export interface VersionRow {
    version: string;
    created_at: string;
    yanked: 0 | 1;
}
