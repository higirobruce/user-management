# Deploying the Joget report proxy

A step-by-step guide for deploying the `feat/joget-file-proxy` branch to the
production server. Written to be followed line by line — every command says
what it does, what you should see, and what to do if you see something else.

**Read this first:** production is already running and serving users. Nothing
in this guide stops the database. The only container that restarts is the
application, and that restart takes a few seconds.

---

## What is being deployed

A new API endpoint that lets the frontend read report PDFs that live in Joget.

The browser cannot fetch those files directly — Joget sends no CORS headers
and requires a login — so the backend fetches them instead and passes the
bytes on. This is "Option 2" from the discussion with the Joget team.

```
GET /joget/reports        →  all reports, each with its file included
```

Two supporting routes also exist (`/joget/reports/:id` and
`/joget/reports/:id/file`) but the frontend only needs the one above.

### What changes in the existing app

Almost nothing, deliberately:

| Area | Change |
|---|---|
| `src/app.module.ts` | 2 lines added to register the new module |
| `docker-compose.yml` | 6 lines added to pass the Joget settings to the container |
| `tsconfig.build.json` | excludes two local-only test files from the build |
| `.env.example` / `.gitignore` | documentation and safety entries |
| New folder `src/joget/` | the feature itself |

No existing route, module, guard, or database table is modified. **No new
database tables**, so there is no migration and nothing to undo in the
database.

---

## Before you begin

You need:

- SSH access to the production server
- The Joget password (not written in this file on purpose)
- The project already cloned on the server, running under Docker
- About 15 minutes

### Vocabulary, if any of this is new

- **Container** — the running copy of the app, managed by Docker.
- **Image** — the built package a container runs from. Rebuilding the image
  is how new code gets in.
- **`docker compose`** — the tool that runs the app, the database and pgAdmin
  together, configured by `docker-compose.yml`.
- **`.env`** — a file of settings (passwords, URLs) that is *not* in git and
  lives only on the server.

---

## Step 1 — Push your branch

On **your laptop**, in the project folder:

```bash
git status
```

**Expect:** `nothing to commit, working tree clean`.
**If not:** you have unsaved changes. Stop and resolve them before continuing.

```bash
git push -u origin feat/joget-file-proxy
```

**Expect:** a summary ending with something like
`* [new branch] feat/joget-file-proxy -> feat/joget-file-proxy`.

---

## Step 2 — Connect to the server

```bash
ssh <your-user>@<production-server>
cd /path/to/user-management
```

Confirm you are in the right folder:

```bash
ls
```

**Expect:** to see `docker-compose.yml`, `Dockerfile`, `src`, `package.json`.
**If not:** you are in the wrong directory. Do not continue.

---

## Step 3 — Write down how to undo this

This is the most important step. Do not skip it.

```bash
git rev-parse --short HEAD
```

**Expect:** a short code like `8b2ea9a`.

**Write that code down somewhere outside the terminal.** It identifies the
version currently running. If anything goes wrong, it is how you get back.

Save it on the server as well, and back up the settings file:

```bash
git rev-parse --short HEAD > ~/rollback-commit.txt
cp .env ~/.env.backup-$(date +%F)
```

Check what is running right now:

```bash
docker ps --format '{{.Names}}\t{{.Status}}'
```

**Expect:** three lines — `user_management_app`, `user_management_db`,
`user_management_pgadmin`, each showing `Up ...`.

Note them. After deploying, the app will show a fresh `Up` time; the other
two should be unchanged.

---

## Step 4 — Add the Joget settings

Open the settings file:

```bash
nano .env
```

Scroll to the **very bottom** and add these six lines:

```
JOGET_BASE_URL=https://services.gov.rw
JOGET_USERNAME=lowcode@risa.gov.rw
JOGET_PASSWORD=PUT_THE_REAL_PASSWORD_HERE
JOGET_APP_ID=pmo_data_entry
JOGET_REPORTS_DATALIST_ID=uploadedQuaterlyReports
JOGET_FILE_COLUMN=c_uploaded_document
```

Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`.

### Rules for this step

- **Only add. Never edit or reorder the existing lines.** Other parts of the
  app depend on them.
- **Do not touch `PORT`.** It is `4000` and must stay `4000`.
- **No quotes and no spaces** around the `=` sign.
- `JOGET_REPORTS_DATALIST_ID` ends in **`ed`** — `uploadedQuaterlyReports`.
  The spelling looks wrong (`Quaterly`) but it is Joget's own and must be
  copied exactly.

Check the lines landed correctly:

```bash
grep JOGET .env
```

**Expect:** your six lines, spelled exactly as above.

---

## Step 5 — Get the new code

```bash
git fetch origin
git checkout feat/joget-file-proxy
```

**Expect:** `Switched to a new branch 'feat/joget-file-proxy'`.

**If you see `error: Your local changes ... would be overwritten`:** someone
edited files directly on the server. Stop and find out what changed before
going further.

Confirm you have the right version:

```bash
git log --oneline -1
```

**Expect:** the same commit you saw on your laptop in Step 1. Run
`git log --oneline -1` there too and compare — the short codes must match. If
they differ, the server has not received your latest push; repeat Step 1.

Nothing is running yet — you have only changed the files on disk. The live
app is still the old version.

---

## Step 6 — Build the new version

```bash
docker compose build app
```

This can take a few minutes. It compiles the code into a new image.

**Expect:** it ends without an error, with a line about the image being
built or exported.

**This step is safe.** It does not touch the running app. If the build fails,
the live site is completely unaffected — fix the problem and run it again.

**If the build fails**, read the last 20 lines of output. A TypeScript error
means a code problem; a network error means the server could not download
packages, so simply try again.

---

## Step 7 — Restart the app

```bash
docker compose up -d --no-deps app
```

**What each part means:**

- `up -d` — start in the background
- `--no-deps` — **only** touch the app. Leaves the database and pgAdmin alone.
- `app` — the service name

**Expect:** something like `Recreating user_management_app ... done`.

> **Never run `docker compose down`.** That stops the database as well and
> causes a real outage. You do not need it here.

The app is unavailable for a few seconds while it restarts. This is normal.

---

## Step 8 — Watch it start

```bash
docker compose logs -f app
```

**Expect:** a stream of startup lines. Look for:

- `Mapped {/joget/reports, GET} route` — the new endpoint is registered
- `Nest application successfully started`

Press `Ctrl+C` to stop watching. **This does not stop the app** — it only
stops showing you the logs.

**If it keeps restarting**, or you see a crash, go to
[Rollback](#if-something-goes-wrong-rollback) below.

---

## Step 9 — Check the existing app still works

Test something that worked before your change. This tells you whether any
problem is caused by the deployment or was already there.

```bash
curl -i -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'
```

**Expect:** a `200` or `201` with a token in the response.

**If this fails**, the problem is not the Joget feature. Roll back and
investigate.

Copy the access token from the response — you need it next.

---

## Step 10 — Test the new endpoint

```bash
curl -s -o /dev/null -w 'status=%{http_code}  size=%{size_download} bytes  time=%{time_total}s\n' \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  http://localhost:4000/joget/reports
```

**Expect:** `status=200`, a size of a few million bytes, and a time of about
one second.

That is success. The backend can reach Joget, log in, download the files and
return them.

To see the actual content:

```bash
curl -s -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  "http://localhost:4000/joget/reports?includeFiles=false" | head -c 800
```

The `?includeFiles=false` gives the same records without the file contents,
so it is small enough to read on screen.

**Expect:** JSON starting with `{"total":21,...` and records containing
`"hasFile":true` and a `"fileName"`.

---

## Understanding failures

Every failure below affects **only** the `/joget/reports` route. The rest of
the application keeps working normally, so there is no emergency.

| What you see | What it means | What to do |
|---|---|---|
| `status=502` | Joget rejected our login | Check `JOGET_USERNAME` / `JOGET_PASSWORD`; confirm they are valid for **production** Joget, not just dev |
| Waits ~30s then fails | The server cannot reach `services.gov.rw` | A firewall is blocking it. Ask the infrastructure team to allow outbound access |
| `status=500`, logs say `Invalid URL` | The settings did not reach the container | Re-check Step 4, then repeat Step 7 |
| `Report ... not found` | The production datalist has a different name | Confirm the datalist id with the Joget team |
| `status=401` | Your test token is wrong or expired | Repeat Step 9 to get a fresh one |

To read the logs at any time:

```bash
docker compose logs --tail=50 app
```

---

## If something goes wrong — rollback

This returns production to exactly what it was running before. It is safe and
takes about three minutes.

```bash
cd /path/to/user-management
git checkout $(cat ~/rollback-commit.txt)
docker compose build app
docker compose up -d --no-deps app
docker compose logs --tail=30 app
```

The database is never touched at any point, and this change adds no tables,
so there is nothing in the database to reverse.

Removing the `JOGET_*` lines from `.env` is optional — they do nothing once
the old code is running.

---

## After a successful deploy

1. **Tell the frontend developers the endpoint is live.** Nothing changes for
   users until the Reports page is updated to call it. The page will keep
   showing the same CORS error until then — that is expected, not a failed
   deployment.

2. **Tell the repository owner** which branch is deployed and why, so it is
   not a surprise when they return. The branch still needs a proper review
   and merge into `main`.

3. **Rotate the Joget password.** It has been shared in plain text in email
   and documents. Once changed, update `.env` and repeat Step 7.

---

## Known limitation

Any signed-in user can currently read every report, including reports
belonging to other institutions. The records carry a `c_institution` field,
so restricting access by institution is possible — but the rule has not been
defined yet, and it is **not** implemented.

Confirm this is acceptable before real users rely on the feature.
