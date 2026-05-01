import { encodeHex } from "@std/encoding/hex";
import type { Database } from "./database.ts";
import type { Token } from "./entities.ts";
import type { TokenRow } from "./tables.ts";

export type { Token };

export interface TokenStore {
    create(description: string, isAdmin: boolean): Promise<string>;
    verify(raw: string): Promise<Token | null>;
    revoke(hash: string): void;
}

export function createTokenStore(db: Database): TokenStore {
    const selectByHash = db.prepare<TokenRow>(
        "SELECT hash, description, is_admin, created_at FROM tokens WHERE hash = ?"
    );

    async function create(description: string, isAdmin: boolean): Promise<string> {
        const raw = _generateRaw();
        const hash = await _hashToken(raw);
        db.exec(
            "INSERT INTO tokens (hash, description, is_admin, created_at) VALUES (?, ?, ?, ?)",
            hash,
            description,
            isAdmin ? 1 : 0,
            new Date().toISOString()
        );
        return raw;
    }

    async function verify(raw: string): Promise<Token | null> {
        const hash = await _hashToken(raw);
        const row = selectByHash.get(hash) as TokenRow | undefined;
        if (!row) return null;
        return {
            hash: row.hash,
            description: row.description,
            isAdmin: row.is_admin === 1,
            createdAt: row.created_at
        };
    }

    function revoke(hash: string): void {
        db.exec("DELETE FROM tokens WHERE hash = ?", hash);
    }

    return { create, verify, revoke };
}

async function _hashToken(raw: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return encodeHex(buf);
}

function _generateRaw(): string {
    return `srce_${encodeHex(crypto.getRandomValues(new Uint8Array(32)))}`;
}
