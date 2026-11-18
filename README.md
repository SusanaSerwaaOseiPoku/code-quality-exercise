# Notes API — Dress Rehearsal

This folder now contains a runnable local Notes demo. It is **not deployed to the internet**. The previously supplied MockAPI URL only exposed `/notes` (empty list) and returned 404 for `/health`; it has no Notes login page.

## 1. Run the smoke test

From this folder:

```powershell
npm install
npm start
```

Keep the terminal open. It prints two temporary demo usernames and passwords. Open `http://127.0.0.1:3000/health` and confirm `{"status":"ok"}`, then open `http://127.0.0.1:3000` and log in with one of those accounts.

**Verified locally:** `/health` returns 200; login works; Account A can create a note; Account B cannot see or fetch Account A's note. `npm test` passes. These checks are local, not a live deployment. A public live-site smoke test still requires deploying this app to a hosting service.

The demo users and notes are in memory. Restarting the server generates new passwords and clears notes.

## 2. Five-minute demo plan

| Time | Demo script |
|---|---|
| 0:00–0:30 | Introduce Notes: a simple place to create and keep private notes. |
| 0:30–1:00 | Open `/health`; explain that it confirms the server responds, not that every feature works. |
| 1:00–2:00 | Log in as Account A, create a rehearsal note, and show it in the list. |
| 2:00–3:00 | Log out, sign in as Account B, and show that Account A's note is not visible. |
| 3:00–4:00 | Tour `server.js`, `auth.js`, and `notes.js` using the descriptions in step 4. |
| 4:00–4:30 | Explain the authorization and user-scoping checks; mention that data resets when the server restarts. |
| 4:30–5:00 | Summarize the working features, name one next improvement, and invite questions. |

## 3. Test accounts and backup recording

- [x] Two local test accounts are generated each time the app starts. Use the `demo-a` and `demo-b` credentials printed in the terminal; they are temporary and must not be shared publicly.
- [x] Account A / Account B note separation was tested locally.
- [ ] Record one complete clean run with non-sensitive sample data.
- [ ] Replay the recording and verify it is readable and plays correctly.
- [ ] Keep an offline copy here or somewhere accessible: ______________________________

Do not save account passwords in this file or include them in the recording.

## 4. Three-file code tour

1. [`server.js`](./server.js) — starts the Express app and wires health, session, authentication, notes, and static-page routes together.
2. [`auth.js`](./auth.js) — creates temporary demo users, checks login passwords, and provides `requireAuth` to protect note routes.
3. [`notes.js`](./notes.js) — implements note CRUD and filters every read/write by the signed-in user's ID.

## 5. Partner presentation and feedback

- [ ] Present the five-minute demo while your partner runs a timer.
- [ ] Partner's **one thing done well:** ___________________________________________
- [ ] Partner's **one thing to improve:** __________________________________________

## 6. Swap roles, then fix your weakest point

- [ ] Swap roles and time your partner's presentation.
- [ ] Make one concrete fix based on your own weakest point.

**My weakest point / fix:** ______________________________________________________

## Surprise questions — answer each in under 30 seconds

1. **“What would break if you removed `requireAuth`?”**  
   “Unauthenticated requests would no longer get the intended 401 response. In this version the handlers would then fail when they try to read the missing session user, and any route without that follow-up check could expose data. The middleware is the consistent gate for all note routes.”

2. **“What does `/health` prove?”**  
   “It proves the local server answered the health request at that moment. It does not prove login or note operations work, so I test those separately.”

3. **“How do you know one user cannot see another user's notes?”**  
   “The notes store filters by the authenticated user ID. I tested it by creating a note as Account A, then signing in as Account B: B's list was empty and fetching A's note returned 404.”

## Run it twice

| Pass | Smoke test | Timed demo | Feedback / fix |
|---|---|---|---|
| 1 | [ ] | [ ] | ______________________________________________ |
| 2 | [ ] | [ ] | ______________________________________________ |
