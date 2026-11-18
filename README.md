# Notes API

## Five answers for a new reader

1. **What is this?** A small Express Notes API with a browser client for a class exercise.
2. **What can I do with it?** Sign in, create notes, list them, edit them, and delete them.
3. **Who can see a note?** Only the account that created it. The API requires a session for note routes and scopes each operation to that session's user.
4. **Where can I try it?** Run the local app using the steps below. The full browser app is not publicly deployed.
5. **What should I know before using it?** Accounts and notes are in memory and disappear when the server restarts. This is a classroom demo, not a production service.

## Links and live status

- GitHub project repository: https://github.com/SusanaSerwaaOseiPoku/dress-rehearsal
- Provided live MockAPI notes endpoint: https://6afd83802a9c141d36b89d75.mockapi.io/notes (`GET` was checked and returned `200` with `[]`).
- Provided MockAPI health endpoint: https://6afd83802a9c141d36b89d75.mockapi.io/health (checked and returned `404`; this is not a health endpoint for this Express app).
- Live browser site: **Not deployed.** The app link below is local only.

The MockAPI URL is a separate service from this project. The local Express app exposes both `/notes` and `/api/notes` for note operations; its client uses `/api/notes`.

## Numbered setup: server

1. Install Node.js 20 or newer.
2. Clone this repository and open a terminal in the project root.
3. Install dependencies:

   ```powershell
   npm ci
   ```

4. Create a private local environment file from the server example:

   ```powershell
   Copy-Item .env.example .env
   ```

   Replace the sample `SESSION_SECRET` with a private random value of at least 32 characters. Never commit `.env`.

5. Start the server:

   ```powershell
   npm start
   ```

6. Confirm `http://localhost:3000/health` returns `{"status":"ok"}`. The terminal prints temporary demo account credentials; use them only locally.

## Numbered setup: client

1. The browser client is the static files in `public/`; there is no separate client server or build step.
2. Keep the Express server running. It serves the client and API from the same origin.
3. Open `http://localhost:3000` and sign in with one of the temporary credentials printed by the server.
4. The client calls relative `/api/...` paths, so it does not need a separate API URL or any client-side secrets. `public/.env.example` documents this intentionally empty configuration.

## Endpoint table

| Method | Path | Who | Result |
| --- | --- | --- | --- |
| `GET` | `/health` | Anyone | `200` and `{"status":"ok"}` |
| `POST` | `/api/auth/login` | Anyone | `200` and a session cookie; `400` for missing fields or `401` for invalid credentials |
| `POST` | `/api/auth/logout` | Anyone | `204`; destroys the current session when present |
| `GET` | `/api/me` | Signed-in user | `200` with the current user, or `401` |
| `GET` | `/notes` or `/api/notes` | Signed-in user | `200` with only that user's notes, or `401` |
| `POST` | `/notes` or `/api/notes` | Signed-in user | `201` with the created note; `400` for invalid note fields or `401` |
| `GET` | `/notes/:id` or `/api/notes/:id` | Signed-in owner | `200` with the note; `404` if it is missing or belongs to another user |
| `PUT` | `/notes/:id` or `/api/notes/:id` | Signed-in owner | `200` with the updated note; `400` for invalid fields or `404` if unavailable |
| `DELETE` | `/notes/:id` or `/api/notes/:id` | Signed-in owner | `204`; `404` if unavailable |

Notes require a non-empty title (up to 120 characters) and text content (up to 5000 characters). `/notes` is an alias added for the exercise; the browser client continues to use `/api/notes`.

## Full request and reply: `POST /notes`

First sign in at `POST /api/auth/login` and use the returned session cookie. The cookie value below is a placeholder, not a credential:

```http
POST /notes HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Cookie: notes.sid=<SESSION_COOKIE_FROM_LOGIN>

{
  "title": "Week 19 notes",
  "content": "Review the API request and response."
}
```

Example reply (the ID and timestamps are generated at runtime):

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "5e8b3e50-8af7-4ee2-9f4f-2ae435bd14c1",
  "userId": "demo-a",
  "title": "Week 19 notes",
  "content": "Review the API request and response.",
  "createdAt": "2026-11-18T14:00:00.000Z",
  "updatedAt": "2026-11-18T14:00:00.000Z"
}
```

The example values are fictional. The note is scoped to the signed-in user and is not stored persistently.

## Tests

Run the API integration test from the project root:

```powershell
npm test
```

The test checks health, login, unauthenticated access, both note route prefixes, and that one demo account cannot list or fetch another account's notes.

**Fresh-clone check:** Commit `7f1fa37` was cloned from GitHub, installed with `npm ci`, configured by copying `.env.example`, and verified with `npm test` (1 passing test), `GET /health` (`200`), and the client page (`200`). `npm audit` reported zero vulnerabilities.
