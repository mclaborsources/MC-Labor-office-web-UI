# MC Labor Web Front End

Modern local web front end for the **MC Labor Access / SQL system** (not the mobile app or workforce portal).

**Current milestone:** Milestone 1 — foundation, read-only SQL connectivity, login shell, Access-style tracking layout.

## Quick start

### Prerequisites

- Node.js 20+
- Restored copy of SQL Server database `McLabor` (from `reference/Back-up-SQL`)
- SQL login with **read-only** access (recommended)

### Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with your SQL connection and session secret.

Generate a dev password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

Set `DEV_LOGIN_PASSWORD_HASH` in `.env.local`.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default dev credentials (if using the sample hash for password `dev123`):

- Username: `dev`
- Password: `dev123`

### Health check

```bash
curl http://localhost:3000/api/health/db
```

Returns `{ "ok": true, "database": "McLabor" }` when SQL is reachable.

## Project structure

```txt
src/
  app/              Next.js App Router pages and API routes
  components/       UI and layout components
  lib/              db, auth, config, week helpers
  types/            TypeScript types
docs/               Project status and milestone notes
reference/          Access accdb, SQL backup, Raymond specs (not deployed)
```

## Scope

See [docs/CURRENT_PROJECT_STATUS.md](docs/CURRENT_PROJECT_STATUS.md) and [docs/MILESTONE_1_NOTES.md](docs/MILESTONE_1_NOTES.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |

## Security

- SQL credentials are server-side only (API routes).
- Do not connect to live production SQL until Raymond approves.
- Phase 1 is read-only — no data writes.
