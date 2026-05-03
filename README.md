# srce

Private package registry for Deno and Bun with JSR-style imports.

> Zero external services. SQLite + filesystem. Single binary.

## Features

- **JSR-style imports** — `@scope/package/version/file.ts`
- **Token auth** — Admin and publish tokens
- **Zero external services** — SQLite + filesystem storage
- **Lightweight** — Minimal dependencies, single entrypoint

## Installation

```sh
deno install -A -n srce ./cli/main.ts
```

## Quick Start

```sh
# Initialize registry (creates admin token)
srce init --data ./registry

# Start server
srce serve --port 4873 --data ./registry

# Login to registry
srce login --registry http://localhost:4873 --token <admin-token>

# Publish a package
cd my-package
srce publish
```

## CLI Commands

### Registry Management

```sh
srce init --data <dir>
```

### Server

```sh
srce serve [--port <port>] [--data <dir>]
  --port <port>       Port to listen on (default: 4873)
  --data <dir>        Data directory (default: ./data)
```

### Authentication

```sh
srce login --registry <url> --token <token>
```

### Publishing

```sh
srce publish
```

### Packages

```sh
srce list

srce info --package <@scope/name>
```

### Tokens

```sh
srce token list

srce token create --description <name> [--admin]

srce token revoke --hash <hash>
```

## Importing Packages

### Deno

```typescript
import { something } from "http://localhost:4873/@scope/package/1.0.0/mod.ts";
```

With import map:

```json
{
    "imports": {
        "@scope/package": "http://localhost:4873/@scope/package/1.0.0/mod.ts"
    }
}
```

### Bun

Configure `bunfig.toml`:

```toml
[install.scopes]
"@scope" = "http://localhost:4873"
```

Then import normally:

```typescript
import { something } from "@scope/package";
```

## Package Structure

Packages need a `deno.json` with:

```json
{
    "name": "@scope/package",
    "version": "1.0.0",
    "exports": {
        ".": "./mod.ts",
        "./utils": "./utils.ts"
    }
}
```

## API Endpoints

| Method | Endpoint                                | Auth  | Description                |
| ------ | --------------------------------------- | ----- | -------------------------- |
| GET    | `/@:scope/:name/meta.json`              | —     | Package metadata           |
| GET    | `/@:scope/:name/:version_meta.json`     | —     | Version metadata           |
| GET    | `/@:scope/:name/:version/:file`         | —     | File contents              |
| GET    | `/packages`                             | —     | List packages (`?scope=`)  |
| GET    | `/packages/@:scope/:name`               | —     | Package details + versions |
| POST   | `/packages/@:scope/:name/:version/yank` | admin | Yank a version             |
| POST   | `/publish`                              | token | Publish a tarball          |
| GET    | `/tokens`                               | admin | List tokens                |
| POST   | `/tokens`                               | admin | Create token               |
| DELETE | `/tokens/:hash`                         | admin | Revoke token               |

## Development

```sh
# Type check
deno check **/*.ts

# Lint
deno lint

# Format
deno fmt

# Tests
deno test --allow-all
```

## License

MIT — see [LICENSE](./LICENSE).
