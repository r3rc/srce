import { assertEquals, assertThrows } from "@std/assert";
import { createDatabase, migrateDatabase } from "./database.ts";

Deno.test("migrateDatabase - creates tables", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    db.exec("INSERT INTO tokens (hash, description, is_admin, created_at) VALUES ('h', 'd', 0, '2025-01-01')");
    db.exec("INSERT INTO packages (scope, name, latest, created_at) VALUES ('s', 'p', NULL, '2025-01-01')");
    db.exec(
        "INSERT INTO versions (scope, name, version, created_at, yanked) VALUES ('s', 'p', '1.0.0', '2025-01-01', 0)"
    );
    const row = db.prepare<{ hash: string }>("SELECT hash FROM tokens WHERE hash = 'h'").get();
    assertEquals(row?.hash, "h");
    db.close();
});

Deno.test("migrateDatabase - idempotent (called twice)", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    migrateDatabase(db);
    db.close();
});

Deno.test("migrateDatabase - tokens unique constraint", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    db.exec("INSERT INTO tokens (hash, description, is_admin, created_at) VALUES ('h', 'd', 0, '2025-01-01')");
    assertThrows(() => {
        db.exec("INSERT INTO tokens (hash, description, is_admin, created_at) VALUES ('h', 'd2', 0, '2025-01-01')");
    });
    db.close();
});

Deno.test("migrateDatabase - versions composite primary key", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    db.exec("INSERT INTO packages (scope, name, latest, created_at) VALUES ('s', 'p', NULL, '2025-01-01')");
    db.exec(
        "INSERT INTO versions (scope, name, version, created_at, yanked) VALUES ('s', 'p', '1.0.0', '2025-01-01', 0)"
    );
    assertThrows(() => {
        db.exec(
            "INSERT INTO versions (scope, name, version, created_at, yanked) VALUES ('s', 'p', '1.0.0', '2025-01-01', 0)"
        );
    });
    db.close();
});
