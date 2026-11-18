const crypto = require("node:crypto");
const express = require("express");

function createDemoUsers() {
  const credentials = ["demo-a", "demo-b"].map((username) => ({
    username,
    password: crypto.randomBytes(12).toString("base64url"),
  }));
  const users = new Map(
    credentials.map(({ username, password }) => {
      const salt = crypto.randomBytes(16);
      const passwordHash = crypto.scryptSync(password, salt, 64);
      return [
        username,
        {
          id: username,
          username,
          salt,
          passwordHash,
        },
      ];
    }),
  );
  users.credentials = credentials;
  return users;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function createAuthRouter(users) {
  const router = express.Router();

  router.post("/login", (req, res, next) => {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = users.get(username);
    if (!user || password.length > 200) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const submittedHash = crypto.scryptSync(password, user.salt, user.passwordHash.length);
    if (!crypto.timingSafeEqual(submittedHash, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.regenerate((error) => {
      if (error) {
        return next(error);
      }
      req.session.user = { id: user.id, username: user.username };
      req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }
        res.json({ id: user.id, username: user.username });
      });
    });
  });

  router.post("/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }
      res.clearCookie("notes.sid", { httpOnly: true, sameSite: "strict" });
      res.status(204).end();
    });
  });

  return router;
}

module.exports = { createDemoUsers, createAuthRouter, requireAuth };
