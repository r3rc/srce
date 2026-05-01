import { assertEquals, assertThrows } from "@std/assert";
import { createDatabase, migrateDatabase } from "./database.ts";
import { createPackageStore } from "./packages.ts";

Deno.test("createPackageStore - upsert creates package", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    const pkg = store.get("r3rc", "foo");
    assertEquals(pkg?.scope, "r3rc");
    assertEquals(pkg?.name, "foo");
    assertEquals(pkg?.latest, null);
    assertEquals(typeof pkg?.createdAt, "string");
    db.close();
});

Deno.test("createPackageStore - upsert is idempotent", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.upsert("r3rc", "foo");
    assertEquals(store.list().length, 1);
    db.close();
});

Deno.test("createPackageStore - get returns null for missing package", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    assertEquals(store.get("r3rc", "nope"), null);
    db.close();
});

Deno.test("createPackageStore - updateLatest sets latest version", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.updateLatest("r3rc", "foo", "1.0.0");
    assertEquals(store.get("r3rc", "foo")?.latest, "1.0.0");
    db.close();
});

Deno.test("createPackageStore - list returns all packages", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.upsert("r3rc", "bar");
    store.upsert("other", "baz");
    assertEquals(store.list().length, 3);
    db.close();
});

Deno.test("createPackageStore - list filtered by scope", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.upsert("r3rc", "bar");
    store.upsert("other", "baz");
    const result = store.list("r3rc");
    assertEquals(result.length, 2);
    assertEquals(result.every((p) => p.scope === "r3rc"), true);
    db.close();
});

Deno.test("createPackageStore - createVersion and getVersion", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.createVersion("r3rc", "foo", "1.0.0");
    const v = store.getVersion("r3rc", "foo", "1.0.0");
    assertEquals(v?.version, "1.0.0");
    assertEquals(v?.isYanked, false);
    assertEquals(typeof v?.createdAt, "string");
    db.close();
});

Deno.test("createPackageStore - getVersion returns null for missing", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    assertEquals(store.getVersion("r3rc", "foo", "9.9.9"), null);
    db.close();
});

Deno.test("createPackageStore - duplicate version throws", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.createVersion("r3rc", "foo", "1.0.0");
    assertThrows(() => store.createVersion("r3rc", "foo", "1.0.0"));
    db.close();
});

Deno.test("createPackageStore - yank marks version", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.createVersion("r3rc", "foo", "1.0.0");
    store.yank("r3rc", "foo", "1.0.0");
    assertEquals(store.getVersion("r3rc", "foo", "1.0.0")?.isYanked, true);
    db.close();
});

Deno.test("createPackageStore - listVersions returns all versions ordered", () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createPackageStore(db);
    store.upsert("r3rc", "foo");
    store.createVersion("r3rc", "foo", "1.0.0");
    store.createVersion("r3rc", "foo", "1.1.0");
    const versions = store.listVersions("r3rc", "foo");
    assertEquals(versions.length, 2);
    assertEquals(versions[0]?.version, "1.0.0");
    db.close();
});
