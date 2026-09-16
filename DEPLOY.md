# Deploying the Joget report proxy

A step-by-step guide for deploying the `feat/joget-file-proxy` branch to the
production server. Written to be followed line by line — every command says
what it does, what you should see, and what to do if you see something else.

**Read this first:** production is already running and serving users. Nothing
in this guide stops the database. The only container that restarts is the
application, and that restart takes a few seconds.

> **This has been done once successfully.** On the production server the full
> endpoint returned **5,347,344 bytes in 0.87s**, and a single file came back
> as a valid `PDF document, version 1.7`. Those are the numbers to expect if
> you are re-running this after a further change.

---

## The server is shared — read before touching anything

`opm-gor-dashboard-01` does **not** only run this application. It also runs
Rocket.Chat, MongoDB, MinIO, Grafana, Prometheus, cAdvisor and node-exporter,
all in production.

Consequences you must know:

- **Always `cd` into the project directory first and confirm it** before any
  `docker compose` command. Run from the wrong folder and you will restart
  somebody else's production stack.
- **Port 3000 belongs to Grafana**, and **8080 to cAdvisor**. This app runs on
  **4000**. This is why `PORT=4000` in `.env` is load-bearing — if it were
  unset the app would default to 3000 and collide with Grafana.
- `docker ps` shows around **ten** containers. That is normal. Only three
  belong to this app: `user_management_app`, `user_management_db`,
  `user_management_pgadmin`.

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
git log --oneline -1
```

**Expect:** a push summary, then the latest commit. **Write that short commit
code down** — you will compare it on the server in Step 5.

---

## Step 2 — Connect to the server and find the project

```bash
ssh <your-user>@opm-gor-dashboard-01
```

The project is **not** in your home directory. It lives at
`/opt/apps/user-management`.

If that ever changes, ask Docker where the running container was built from:

```bash
docker inspect user_management_app \
  --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}'
```

Then go there and confirm:

```bash
cd /opt/apps/user-management
ls
```

**Expect:** `docker-compose.yml`, `Dockerfile`, `src`, `package.json`.
**If not:** you are in the wrong directory. **Do not run any docker command.**

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

Check what is running right now, filtered to this app:

```bash
docker ps --format '{{.Names}}\t{{.Status}}' | grep user_management
```

**Expect:** three lines — `user_management_app`, `user_management_db`,
`user_management_pgadmin`, each showing `Up ...`.

Note the `Up` times. After deploying, only the app should show a fresh time;
the database and pgAdmin must be unchanged. (Running `docker ps` without the
`grep` shows about ten containers, because other production systems share
this server. That is expected.)

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
- **Do not touch `PORT`.** It is `4000` and must stay `4000` — see the
  shared-server section above.
- **No quotes and no spaces** around the `=` sign.
- `JOGET_REPORTS_DATALIST_ID` ends in **`ed`** — `uploadedQuaterlyReports`.
  The spelling looks wrong (`Quaterly`) but it is Joget's own and must be
  copied exactly. The download path inside Joget uses `uploadQuaterlyReports`
  *without* the `ed` — that mismatch is Joget's, not a typo here.

Check the lines landed correctly:

```bash
grep JOGET .env
```

**Expect:** your six lines, spelled exactly as above.

### Which Joget are you pointing at?

`JOGET_BASE_URL` decides whether production reads **production** Joget
(`https://services.gov.rw`) or **dev** Joget (`https://dev.services.gov.rw`).

This is worth being deliberate about. On the first deploy, production returned
records identical to dev — same record IDs, same titles — which is a sign the
base URL may be pointing at dev. Confirm with the Joget team which host
production should use, and check the value you just set.

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

**Expect:** the same short commit code you wrote down in Step 1. If they
differ, the server has not received your latest push — repeat Step 1.

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
[Rollback](#if-something-goes-wrong--rollback) below.

---

## Step 9 — Log in and capture a token

Test something that worked before your change. This tells you whether any
problem is caused by the deployment or was already there.

**Capture the token into a variable — do not copy and paste it.** The login
response contains *two* tokens, and selecting the wrong amount of text by hand
is the single most common way this goes wrong (it produces a confusing `401`).

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "token length: ${#TOKEN}"
```

**Expect:** a length of roughly 400.

**If it prints 0:**

- Wrong email or password, **or**
- You hit the rate limit. Login allows only **5 attempts per minute**. Wait a
  minute and try again.

To see the raw login response when debugging, add `-i` to a plain `curl` call.
A `200` with `"message":"Login successful"` means login itself is fine.

> **Do not try to use cookies with `curl` here.** Login sets `access_token` as
> a `Secure` cookie, and `curl` will not send a `Secure` cookie over plain
> `http://localhost:4000`. It returns `401` and looks like a broken endpoint.
> The `Authorization` header above is the right approach for local testing.

**If login itself fails**, the problem is not the Joget feature. Roll back and
investigate.

---

## Step 10 — Test the endpoint properly

### 10a. The full response — this is the real test

```bash
curl -s -o /dev/null \
  -w 'status=%{http_code}  size=%{size_download} bytes  time=%{time_total}s\n' \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/joget/reports
```

**Expect:** `status=200`, around **5,300,000 bytes**, in about **1 second**.

This is the call that matters: it downloads all 16 files from Joget. A
firewall, a credential problem or a permissions difference shows up here.

### 10b. One file on its own

```bash
curl -s -D - -o /tmp/test.pdf \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/joget/reports/0ffec1ee-1956-4970-b781-15612d09c449/file \
  | grep -iE '^HTTP/|content-type|content-length'

file /tmp/test.pdf
```

**Expect:**

```
HTTP/1.1 200 OK
Content-Type: application/pdf;charset=UTF-8
Content-Length: 274783
/tmp/test.pdf: PDF document, version 1.7, 1 page(s)
```

`file` reporting a real PDF is the strongest single proof that the whole chain
works. If it says `HTML document` instead, Joget returned an error page.

### 10c. Read the metadata on screen

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/joget/reports?includeFiles=false" | head -c 800
```

**Expect:** JSON starting `{"total":21,...` with `"hasFile":true` and a
`"fileName"` on the records.

> **`?includeFiles=false` does not test file downloading.** It only reads the
> Joget record list. A clean `200` here proves nothing about whether the files
> can be fetched — that is what 10a and 10b are for. Do not treat this call
> alone as a successful deploy.

### Clean up

```bash
rm -f /tmp/test.pdf
```

---

## Understanding failures

Every failure below affects **only** the `/joget/reports` route. The rest of
the application keeps working normally, so there is no emergency.

| What you see | What it means | What to do |
|---|---|---|
| `status=401` | Almost always a malformed token — you pasted more than the token itself, or used a `Secure` cookie over plain HTTP | Re-run Step 9 using the `TOKEN=$(...)` capture; check `echo ${#TOKEN}` is ~400 |
| `status=502` | Joget rejected our login | Check `JOGET_USERNAME` / `JOGET_PASSWORD`; confirm they are valid for the Joget host in `JOGET_BASE_URL` |
| Waits ~30s then fails | The server cannot reach the Joget host | A firewall is blocking outbound access. Ask the infrastructure team |
| `status=500`, logs say `Invalid URL` | The settings did not reach the container | Re-check Step 4, then repeat Step 7 |
| `Report ... not found` | The datalist name is wrong for that host | Confirm the datalist id with the Joget team |
| `file` says `HTML document` | Joget returned an error or login page instead of a file | Check credentials and that the record still has an attachment |
| Login returns `429`, or token length 0 | Login rate limit — 5 per minute | Wait one minute |

To read the logs at any time:

```bash
docker compose logs --tail=50 app
```

---

## If something goes wrong — rollback

This returns production to exactly what it was running before. It is safe and
takes about three minutes.

```bash
cd /opt/apps/user-management
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

4. **Confirm `JOGET_BASE_URL` points at the intended Joget host** — see the
   note in Step 4.

---

## Open items

These are known and unresolved. None of them block the deploy, but they
should not be forgotten.

### Authorisation is not scoped

Any signed-in user can read every report, including reports belonging to other
institutions. The records carry a `c_institution` field, so restricting access
by institution is possible — but the rule has not been defined, and it is
**not** implemented.

Confirm this is acceptable before real users rely on the feature.

### `NODE_ENV` is not set to `production` on this server

Because of that, `POST /auth/login` returns `accessToken` and `refreshToken`
**in the response body**, not only as `HttpOnly; Secure` cookies. See
`src/auth/auth.controller.ts` — the body copy is intentionally
development-only, so production is bypassing that protection.

This predates the Joget work and was not changed by it. Raise it with the
owner separately rather than altering it mid-deploy.

### `c_uploaded_document` has two different types

- Default response: a base64 data URI (the file itself)
- With `?includeFiles=false`: the original Joget HTML anchor

The same field returning two different kinds of value is inconsistent, and a
consumer could mistake the anchor for something usable. Making it `null` when
files are not embedded — matching how records without attachments behave —
would be clearer. Not yet decided.
