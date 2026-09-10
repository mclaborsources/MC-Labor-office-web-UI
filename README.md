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

Alternatively, leave `SQL_SERVER`, `SQL_DATABASE`, and `SQL_USER` empty to use
the first-run connection form after signing in as an administrator. Session
and app login settings in `.env.local` are still required. Enter the SQL Server
computer's office IP/name, database, and SQL credentials, then test and save.
Use either the optional instance field or port field, not both.

Existing `.env.local` SQL settings continue to work. Administrators can open
**Admin → Change SQL Server connection** to override them. Each save verifies
connectivity before replacing the settings; it does not modify database tables.
Changes apply to everyone using this backend. Separate installations on office
PCs each keep their own connection settings.

Saved settings override the environment and are encrypted in
`.local-config/database.enc` using a key derived from `SESSION_SECRET`.
Keep that secret stable and restrict access to both the app folder and its
environment file with Windows permissions. Changing the secret requires
re-entering the SQL connection. Passwords are never returned to the browser;
the setup form prefills `McLabor` and `mclabor` and uses the server-side
`SQL_SETUP_PASSWORD` when the password field is left empty. Configure this
variable in each installation's `.env.local`; users can enter a replacement
password in the form. The app's SQL account
must have access to the existing MC Labor schema; the connection test only
checks connectivity, not schema compatibility. For a self-signed office SQL
certificate, the administrator may need to enable **Trust server certificate**.

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

On Windows, double-click **Start-MC-Labor.cmd** in the project folder. It installs
dependencies with `npm install` on its first launch, waits for installation to
succeed, starts the local development server, and opens the browser
when the server responds. Keep its terminal window open while using the app.
The launcher uses port 3000 and binds to this computer only.

To create a desktop shortcut, right-click `Start-MC-Labor.cmd`, choose **Show more
options → Send to → Desktop (create shortcut)**. The launcher finds the project
folder itself, so the shortcut's working directory does not need configuring.

No environment-file editing is required when using the Windows launcher. On a
fresh installation, a popup form creates your administrator login, followed by
the SQL Server connection form. Enter the server address, database, SQL username
and password, then test and save. Future launches use the saved settings.
The administrator password hash and generated session secret are stored in the
Git-ignored `.local-config/account.json`; database credentials remain encrypted
in `.local-config/database.enc`. Keep this folder private and preserve it across
updates. Existing valid `.env.local` login settings still work. Initial account
creation is available only through a localhost URL and is disabled once configured.
After pulling dependency changes, run `npm ci` before launching again.

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
