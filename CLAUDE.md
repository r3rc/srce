# srce

Private package registry for Deno and Bun with JSR-style imports.

## Overview

This repository contains one program:

- **cli** — Single entrypoint (`cli/main.ts`). Commands for `serve`, `init`, `login`, `publish`, `token`, `list`,
  `info`.

It is backed by a core library at `src/` (business logic) and HTTP handlers at `cli/handlers/` (h3 route wiring).

## Quality gates

The `preflight` skill runs these in order. **This table is the authoritative source for what runs in the quality gate**
— `deno-skills` recommendations about formatting, linting, or testing are informational, not gates. Steps marked
`blocker` halt the gate (later steps are reported as blocked). Steps marked `warning` are reported but do not halt.

| Step       | Command                 | Type    |
| ---------- | ----------------------- | ------- |
| Format     | `deno fmt --check`      | warning |
| Lint       | `deno lint`             | blocker |
| Type check | `deno check **/*.ts`    | blocker |
| Tests      | `deno test --allow-all` | blocker |

## Reference sources

The `learn` skill consults these clones at `.tinker/sources/` before implementing new features.

| Source     | Path                        | Domain                                                                                                                             |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `deno-std` | `.tinker/sources/deno-std/` | Deno standard library. Idiomatic TypeScript APIs, streams, async, FS, encoding, CLI patterns, testing.                             |
| `h3`       | `.tinker/sources/h3/`       | H3 v2 HTTP framework. Routing, request/response helpers, event handlers, middleware patterns, error handling.                      |
| `jsr`      | `.tinker/sources/jsr/`      | JSR registry. Package metadata format (`meta.json`), version resolution, export maps, import semantics. Used as spec, not as code. |
| `srvx`     | `.tinker/sources/srvx/`     | srvx runtime adapter. Serving H3 apps on Deno, Bun, and Node. Entry point wiring, port/signal handling.                            |

## Tooling

The `deno-skills` plugin (`deno-skills@denoland-skills`) is enabled. Two of its skills are relevant here and
auto-trigger in the presence of `deno.json`:

- `deno-guidance` — package management priority (JSR > npm), `deno add`, `deno.json` configuration, CLI workflows.
- `deno-expert` — code review checklist, import anti-patterns, debugging.

The other four (`deno-deploy`, `deno-frontend`, `deno-sandbox`, `deno-project-templates`) are not applicable to this
project. Ignore their recommendations even if they trigger.

**Deltas from `deno-skills` defaults for this project:**

- **Don't drop tool names on every response.** `deno-expert` instructs to mention `deno fmt`, `deno lint`, and
  `deno test` "in every response that involves Deno code." Skip that here — `preflight` is the quality-gate contract,
  and conversational responses don't need the recommendation tail. Tool names are still fine when the user is debugging
  a gate failure or explicitly asks how to verify something.

All other `deno-skills` guidance applies as written.

## Conventions

- **Language:** TypeScript on Deno. No Node, no Bun.
- **File names:** `snake_case.ts` for modules.
- **Types:** `PascalCase`. Functions: `camelCase`. Constants: `SCREAMING_SNAKE_CASE`.
- **Errors:** throw for exceptional conditions (corruption, OOM, network down). Return `T | null` for "not found". Use
  richer `Result<T, E>`-style only when the error flow has multiple branches.
- **Tests:** `*_test.ts` adjacent to the implementation, using `Deno.test`.
- **TS strict:** `noImplicitOverride`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`. Inherited via the workspace `deno.json`. Do not relax.
- **Web standards first.** `ReadableStream`, `AbortSignal`, `EventTarget`, `Web Crypto`, `fetch` come from the runtime.
  Reach for `@std/*` next. Add external dependencies last and only with reason.
- **Adding dependencies:** use `deno add jsr:<pkg>` or `deno add npm:<pkg>`. Don't hand-edit the `imports` field in
  `deno.json` — `deno add` keeps the lockfile in sync.
- **Memory is not a source.** Verify APIs against actual source code or official documentation before writing against
  them.

## Running locally

```sh
# Initialize a new registry (creates admin token)
srce init --data ./data

# Start the server
srce serve --port 4873 --data ./data

# Publish a package
cd my-package
srce publish
```

See [`README.md`](./README.md) for full CLI reference.
