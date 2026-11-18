const crypto = require("node:crypto");
const path = require("node:path");
require("dotenv").config({ quiet: true });
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const { createDemoUsers, createAuthRouter, requireAuth } = require("./auth");
const { createNotesRouter, createNotesStore } = require("./notes");

const app = express();
const demoUsers = createDemoUsers();
const notesStore = createNotesStore();
const sessionSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(
  session({
    name: "notes.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 60 * 60 * 1000,
    },
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", createAuthRouter(demoUsers));
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ id: req.session.user.id, username: req.session.user.username });
});
const notesRouter = createNotesRouter(requireAuth, notesStore);
app.use("/api/notes", notesRouter);
app.use("/notes", notesRouter);
app.use(express.static(path.join(__dirname, "public")));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  app.listen(port, "127.0.0.1", () => {
    console.log(`Notes rehearsal app: http://127.0.0.1:${port}`);
    for (const { username, password } of demoUsers.credentials) {
      console.log(`Local demo account ${username}: ${password}`);
    }
    console.log("Demo accounts and notes are in-memory and reset on restart.");
  });
}

module.exports = { app, demoUsers };
