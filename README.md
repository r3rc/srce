# srce

Private package registry for Deno and Bun with JSR-style imports.

> Zero external services. SQLite + filesystem. Single binary.

## Features

- **JSR-style imports** — `@scope/package@version/file.ts`
- **Scoped tokens** — Fine-grained access control per scope
- **Symlinks mode** — Local development without republishing
- **Zero external services** — SQLite + filesystem storage
- **Lightweight** — Minimal dependencies, single entrypoint

## Installation

```sh
deno install -A -n srce jsr:@r3rc/srce/cli
```

## Quick Start

```sh
# Initialize registry (creates admin token)
srce init --data ./registry

# Start server
srce serve --port 4873 --data ./registry

# Login to registry
srce login http://localhost:4873 --token <admin-token>

# Publish a package
cd my-package
srce publish
```

## CLI Commands

### Server

```sh
srce serve [options]
  --port <port>       Port to listen on (default: 4873)
  --data <dir>        Data directory (default: ./data)
  --symlinks <dir>    Symlinks directory for local dev
```

### Registry Management

```sh
srce init [options]
  --data <dir>        Data directory (default: ./data)
```

### Tokens

```sh
srce token create <name> [options]
  --scopes <scopes>   Comma-separated scopes (e.g. @r3/*,@internal/*)
  --admin             Create admin token
  --data <dir>        Data directory

srce token list [options]
srce token revoke <id> [options]
```

### Packages

```sh
srce list [options]
  --registry <url>    Registry URL

srce info <@scope/name> [options]

srce publish [options]
  --registry <url>    Registry URL
  --token <token>     Auth token
  --dir <dir>         Package directory (default: .)

srce deprecate <@scope/name@version> <message> [options]
srce undeprecate <@scope/name@version> [options]
```

### Authentication

```sh
srce login <registry> [options]
  --token <token>     Auth token (or enter interactively)

srce logout
srce whoami
```

## Importing Packages

### Deno

```typescript
import { something } from "http://localhost:4873/@scope/package@1.0.0/mod.ts";
```

With import map:

```json
{
    "imports": {
        "@scope/package": "http://localhost:4873/@scope/package@1.0.0/mod.ts"
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

Packages need a `package.json` (or `deno.json`) with:

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

| Method | Endpoint                               | Description          |
| ------ | -------------------------------------- | -------------------- |
| GET    | `/@:scope/:name/meta.json`             | Package metadata     |
| GET    | `/@:scope/:name@:version/*`            | File contents        |
| GET    | `/api/packages`                        | List all packages    |
| GET    | `/api/packages/@:scope/:name`          | Package details      |
| POST   | `/api/publish`                         | Publish package      |
| PATCH  | `/api/packages/@:scope/:name/:version` | Deprecate version    |
| DELETE | `/api/packages/@:scope/:name/:version` | Delete version       |
| GET    | `/api/tokens`                          | List tokens (admin)  |
| POST   | `/api/tokens`                          | Create token (admin) |
| DELETE | `/api/tokens/:id`                      | Delete token (admin) |

## Development

```sh
# Install dependencies
deno install

# Run dev server
deno task serve

# Lint
deno lint

# Format
deno fmt

# Type check
deno check **/*.ts

# Tests
deno test --allow-all
```

### Symlinks Mode

For local development without republishing:

```sh
srce serve --symlinks /path/to/packages
```

Files are served from the symlinks directory, ignoring stored versions.

## License

MIT
