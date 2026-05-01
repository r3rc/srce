import { Database as SqliteDatabase } from "@db/sqlite";

export type Database = SqliteDatabase;

export function createDatabase(path: string): Database {
    return new SqliteDatabase(path);
}

export function migrateDatabase(db: Database): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS tokens (
            hash        TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            is_admin    INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS packages (
            scope      TEXT NOT NULL,
            name       TEXT NOT NULL,
            latest     TEXT,
            created_at TEXT NOT NULL,
            PRIMARY KEY (scope, name)
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS versions (
            scope      TEXT NOT NULL,
            name       TEXT NOT NULL,
            version    TEXT NOT NULL,
            created_at TEXT NOT NULL,
            yanked     INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (scope, name, version)
        )
    `);
}
