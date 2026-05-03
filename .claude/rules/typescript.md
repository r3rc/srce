---
name: typescript
description: TypeScript conventions — strict mode, function order, naming, imports, types
paths:
    - "**/*.ts"
---

# TypeScript

## Strict Mode

Siempre `strict: true`. Sin excepciones. Nunca `any`, preferir `unknown` + type guard.

## Orden de funciones

1. **Exportadas** — al inicio, por importancia/uso
2. **Handlers de dominio** — prefijo `on`, sin `_` (mensajes, webhooks, eventos internos)
3. **Privadas** — al final, prefijo `_`, por dependencia (las más básicas al final)

```ts
export function createTokenStore(db: Database): TokenStore {
    async function create(description: string, isAdmin: boolean): Promise<string> {
        const raw = _generateRaw();
        const hash = await _hashToken(raw);
        db.exec("INSERT INTO tokens ...", hash, description, isAdmin);
        return raw;
    }

    return { create };
}

function onTokenExpired(hash: string) {}

async function _hashToken(raw: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return encodeHex(buf);
}

function _generateRaw(): string {
    return `srce_${encodeHex(crypto.getRandomValues(new Uint8Array(32)))}`;
}
```

## Reglas de helpers privados (`_`)

- Realizan una sola operación: I/O, cómputo, transformación
- Siempre privados (prefijo `_`)
- Sin lógica de negocio; la función que los consume decide qué hacer con el resultado

## Imports

```ts
// Orden: @std → npm → internal → relative
import { join } from "@std/path";
import { encodeHex } from "@std/encoding/hex";
import { z } from "npm:zod";
import type { Database } from "./database.ts";

// Type imports separados
import type { Storage } from "./storage.ts";
```

## Sin barrel imports

```ts
// ✅ Directo del submódulo
import { encodeHex } from "@std/encoding/hex";

// ❌ Barrel
import { encodeHex } from "@std/encoding";
```

## Naming

| Elemento         | Convención  | Ejemplo                             |
| ---------------- | ----------- | ----------------------------------- |
| Variables        | camelCase   | `packageId`, `isAdmin`              |
| Constantes       | UPPER_SNAKE | `MAX_RETRIES`, `DEFAULT_PORT`       |
| Funciones        | camelCase   | `parseManifest`, `createTokenStore` |
| Privadas         | \_camelCase | `_generateRaw`, `_hashToken`        |
| Handlers dominio | onCamelCase | `onRequest`, `onTokenExpired`       |
| Clases           | PascalCase  | `TarballError`, `DatabaseError`     |
| Interfaces       | PascalCase  | `Storage`, `PackageMeta`            |
| Types            | PascalCase  | `Version`, `Scope`                  |
| Archivos         | snake_case  | `token_store.ts`, `package_meta.ts` |

## Types vs Interfaces

```ts
// Interface para contratos y shapes de datos
interface PackageMeta {
    scope: string;
    name: string;
    latest: string | null;
    versions: Record<string, VersionMeta>;
}

// Type para unions, intersections, utilities
type Scope = string;
type Result<T> = T | null;
```

## Enums prohibidos

`erasableSyntaxOnly: true` — no usar `enum` ni `const enum`. Usar const object + type union:

```ts
// ✅ Const object + type (erasable, isolatedDeclarations-safe, TS 7.0-ready)
export type TokenKind = (typeof TokenKind)[keyof typeof TokenKind];
export const TokenKind = {
    Admin: "admin",
    Publish: "publish"
} as const;

// ❌ enum (genera código runtime, incompatible con erasableSyntaxOnly)
export enum TokenKind {
    Admin = "admin",
    Publish = "publish"
}

// ❌ const enum (requiere transformación del compilador, no es borrable)
export const enum TokenKind {
    Admin = "admin",
    Publish = "publish"
}
```

Orden: type primero, const después. El type documenta la intención; el const la implementa.

## Quick Reference

| No usar                                     | Usar                                              |
| ------------------------------------------- | ------------------------------------------------- |
| `any`                                       | `unknown` + type guard                            |
| `x!` (non-null assertion)                   | Check explícito + throw                           |
| `import { x } from "./mod"`                 | `import { x } from "./mod.ts"`                    |
| `import { encodeHex } from "@std/encoding"` | `import { encodeHex } from "@std/encoding/hex"`   |
| `require()`                                 | `import` (ESM)                                    |
| `import { type X, value }`                  | Separar: `import type { X }` + `import { value }` |
| `console.log` en producción                 | Logger apropiado o eliminarlo                     |
| `enum` / `const enum`                       | Const object `as const` + type union              |
