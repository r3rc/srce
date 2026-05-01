import { assertEquals, assertMatch, assertNotEquals } from "@std/assert";
import { createDatabase, migrateDatabase } from "./database.ts";
import { createTokenStore } from "./token.ts";

Deno.test("createTokenStore - create returns srce_ prefixed token", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const token = await store.create("test", false);
    assertMatch(token, /^srce_[0-9a-f]{64}$/);
    db.close();
});

Deno.test("createTokenStore - create generates unique tokens", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const a = await store.create("a", false);
    const b = await store.create("b", false);
    assertNotEquals(a, b);
    db.close();
});

Deno.test("createTokenStore - verify returns token for valid raw", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const raw = await store.create("my token", true);
    const token = await store.verify(raw);
    assertEquals(token?.description, "my token");
    assertEquals(token?.isAdmin, true);
    db.close();
});

Deno.test("createTokenStore - verify returns null for unknown token", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const result = await store.verify("srce_" + "a".repeat(64));
    assertEquals(result, null);
    db.close();
});

Deno.test("createTokenStore - raw token is not stored in db", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const raw = await store.create("sec", false);
    const row = db.prepare<{ hash: string }>("SELECT hash FROM tokens").get();
    assertNotEquals(row?.hash, raw);
    db.close();
});

Deno.test("createTokenStore - revoke removes token", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const raw = await store.create("tmp", false);
    const before = await store.verify(raw);
    if (!before) throw new Error("expected token to exist before revoke");
    assertEquals(before.description, "tmp");
    store.revoke(before.hash);
    const after = await store.verify(raw);
    assertEquals(after, null);
    db.close();
});

Deno.test("createTokenStore - non-admin token has isAdmin false", async () => {
    const db = createDatabase(":memory:");
    migrateDatabase(db);
    const store = createTokenStore(db);
    const raw = await store.create("user", false);
    const token = await store.verify(raw);
    assertEquals(token?.isAdmin, false);
    db.close();
});
