# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**goodshares** — a thread-based social media app. The four backend services live in a single **NestJS monorepo** (`apps/` + `libs/`) with one shared `package.json`. The React frontend lives separately as an npm workspace.

```
apps/
  gateway/   public HTTP API, JWT verification, aggregator
  auth/      credentials + register/login, signs JWT       (Prisma + MySQL)
  user/      user profiles                                  (Prisma + MySQL)
  post/      threads and replies                            (Prisma + MySQL)
libs/
  shared/    DTOs (class-validator), JWT payload type, shared error mapper
client-service/   React 19 + Vite (npm workspace member, separate package.json)
```

`apps/*` and `libs/*` are registered in [nest-cli.json](nest-cli.json) under `projects`. The Nest CLI compiles and runs them via `nest build <project>` / `nest start <project>`.

## Architecture

### Request flow

The browser only talks to the **gateway** (`http://localhost:3000`). Downstream services have no auth of their own and trust whatever the gateway sends. Treat them as internal.

```
client → gateway → auth                       (register, login)
client → gateway → post                       (create/read threads, replies)
client → gateway → post + user                (list/get threads, enriched with author)
                ↘ auth → user                 (registration provisions a profile)
```

### Inter-service communication

Despite living in the same repo, the four backend apps still run as **independent processes** on independent ports and communicate over HTTP (per project rules — no in-process imports between apps, no message broker). NestJS `@nestjs/axios` is used everywhere a service makes outbound calls. Two call paths exist:

1. **gateway → any downstream**: in `apps/gateway/src/routes/*`. The gateway never holds data; it forwards or aggregates.
2. **auth → user** during registration: `auth` calls `POST /users` on user to create the profile, then stores the returned `userId` in its `Credential` row. If the local DB write then fails, it makes a best-effort `DELETE /users/:id` to roll back. No distributed transaction — a crash between the two writes can orphan a user row. Acceptable for this project; do not add a saga unless asked.

Crucially: **never `import` from another app's `src/`**. Cross-app code goes through `libs/shared` or over HTTP. If you find yourself wanting to share a service class, that's a sign it belongs in a lib or doesn't need to be shared.

### Author enrichment (read path)

`post` stores only `authorId` on posts. When the gateway serves `GET /threads` or `GET /threads/:id`, it:

1. Fetches raw posts from post.
2. Collects unique `authorId`s.
3. Calls `POST /users/batch` on user with the id list.
4. Joins authors back into the posts as `author: { id, username, displayName }`.

`user`'s `/users/batch` endpoint exists specifically for this fan-in — do not call `/users/:id` in a loop. See [apps/gateway/src/routes/thread.controller.ts](apps/gateway/src/routes/thread.controller.ts) `attachAuthors`.

### Auth and JWT

- `auth` is the **only** signer. It signs `JwtPayload = { sub, email, username }` (defined in [libs/shared/src/types.ts](libs/shared/src/types.ts)) with `JWT_SECRET`.
- `gateway` is the **only** verifier. It uses the same `JWT_SECRET` and exposes `JwtAuthGuard` ([apps/gateway/src/common/jwt-auth.guard.ts](apps/gateway/src/common/jwt-auth.guard.ts)) which attaches `req.user`.
- `JWT_SECRET` must match between `apps/auth/.env` and `apps/gateway/.env`, or tokens will be rejected.
- `user` and `post` do not verify JWTs and trust the `authorId` field the gateway sends. Never expose them to the public internet.

### Data ownership

Each backend app owns its own MySQL database (per project rules — no cross-service DB joins). The id-of-truth for a user is `User.id` in `user`. `auth.Credential.userId` and `post.Post.authorId` are foreign keys *by convention only* — no DB-level constraint between databases.

### Prisma in the monorepo

Each backend app has its own `prisma/schema.prisma`. Schemas use a **custom `output` path** so each app gets its own generated client at `apps/<app>/prisma/generated/client`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}
```

The `PrismaService` in each app imports from that relative path:

```typescript
import { PrismaClient } from '../prisma/generated/client';
```

Do not change this to `@prisma/client` — there is no single client at the package root; that import would resolve to whichever generator ran last and break the other two apps. Each schema's `generated/` directory is in the app's tsconfig `exclude` list.

### Shared library

`libs/shared` is registered as a Nest **library** (not an application). Apps import from it via the TS path alias `@goodshares/shared`, defined in the root [tsconfig.json](tsconfig.json) `paths`. What lives there:

- **DTOs** with `class-validator` decorators. Shared because the gateway and the downstream service handling the same payload should agree on validation. If only one app uses a DTO, keep it in that app.
- **Types** (`JwtPayload`, `RawPost`, `AuthorMini`, `PostWithAuthor`, `AuthResult`).
- **`rethrow`** — converts an Axios error into a `NestHttpException` preserving the upstream status code. Used by the gateway when proxying.

Do **not** put `PrismaService` or DB models in `libs/shared` — each app owns its own schema and client.

## Commands

One `npm install` at the **repository root** installs everything (backends share the root `package.json`; `client-service` is a workspace member).

### First-time setup

```powershell
npm install
# create .env in each of apps/gateway, apps/auth, apps/user, apps/post and client-service
# from each .env.example
npm run prisma:generate                       # generates clients for auth, user, post
npm run prisma:migrate:auth -- --name init
npm run prisma:migrate:user -- --name init
npm run prisma:migrate:post -- --name init
```

Create the three MySQL databases first: `goodshares_auth`, `goodshares_user`, `goodshares_post`.

### Root scripts

```powershell
npm run dev                 # all 4 backends + client, color-coded via concurrently
npm run dev:backend         # 4 backends only
npm run dev:gateway         # one at a time (under nest start --watch)
npm run dev:auth
npm run dev:user
npm run dev:post
npm run dev:client          # vite

npm run build               # nest build for all 4 apps (sequentially)
npm run build:<app>         # one app
npm run start:<app>         # node dist/apps/<app>/main

npm run prisma:generate          # all three
npm run prisma:generate:<app>    # one
npm run prisma:migrate:<app>     # one (pass --name <migration> after --)
npm run prisma:studio:<app>      # opens Prisma Studio for that app's DB
```

### Adding a Nest resource

Use the Nest CLI's project flag so files land in the right `apps/<app>/src` tree:

```powershell
npx nest g module foo --project auth
npx nest g controller foo --project auth
npx nest g service foo --project auth
```

Without `--project`, the CLI writes to whichever app is set as the default `root` in `nest-cli.json` (currently `gateway`).

### Default ports

| App      | Port | URL                   |
|----------|------|-----------------------|
| gateway  | 3000 | http://localhost:3000 |
| auth     | 3001 | http://localhost:3001 |
| user     | 3002 | http://localhost:3002 |
| post     | 3003 | http://localhost:3003 |
| client   | 5173 | http://localhost:5173 |

### Running the full stack locally

`npm run dev` from the repo root starts all five concurrently. Services bind their ports in parallel; an `auth → user` register call only fails if a request arrives before user is listening (~1–2s), which only matters if you immediately hit `POST /auth/register`. If you need strict ordering: start in separate terminals as user → auth → post → gateway → client.

## Conventions

- **`.env` lives next to each app**: `apps/<app>/.env`. Each `app.module.ts` passes `envFilePath: 'apps/<app>/.env'` to `ConfigModule.forRoot`. The path is relative to the process CWD, which Nest sets to the repo root.
- **DTOs use `class-validator`** and the global `ValidationPipe` is `{ whitelist: true, transform: true }` in every backend `main.ts` — unknown fields are stripped, types are coerced.
- **No barrel files inside apps**. `libs/shared/src/index.ts` is the only barrel — it's the public surface of the library. Within an app, import directly from the module file.
- **`PrismaService`** lives at `apps/<app>/src/prisma.service.ts` and is provided in each feature module that needs it (not global).
- **No backend tests yet.** Jest is wired into `package.json` but no `*.spec.ts` files exist.
- **Client UI is intentionally minimal** — plain CSS in `client-service/src/styles.css`, no component library, no Tailwind, no emojis. Keep it that way unless asked.
- **Thread sort order**: feed is `parentId IS NULL` ordered by `createdAt DESC`. Replies within a thread are `createdAt ASC`.
