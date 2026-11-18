const crypto = require("node:crypto");
const express = require("express");

function createNotesStore() {
  const notes = new Map();

  return {
    listForUser(userId) {
      return Array.from(notes.values())
        .filter((note) => note.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    getForUser(userId, noteId) {
      const note = notes.get(noteId);
      return note && note.userId === userId ? note : undefined;
    },

    create(userId, title, content) {
      const now = new Date().toISOString();
      const note = {
        id: crypto.randomUUID(),
        userId,
        title,
        content,
        createdAt: now,
        updatedAt: now,
      };
      notes.set(note.id, note);
      return note;
    },

    update(userId, noteId, title, content) {
      const note = this.getForUser(userId, noteId);
      if (!note) {
        return undefined;
      }
      const updatedNote = { ...note, title, content, updatedAt: new Date().toISOString() };
      notes.set(noteId, updatedNote);
      return updatedNote;
    },

    delete(userId, noteId) {
      const note = this.getForUser(userId, noteId);
      return note ? notes.delete(noteId) : false;
    },
  };
}

function validateNote(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A note object is required";
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    return "A non-empty title is required";
  }
  if (body.title.trim().length > 120) {
    return "Title must be 120 characters or fewer";
  }
  if (typeof body.content !== "string" || body.content.length > 5000) {
    return "Content must be text with 5000 characters or fewer";
  }
  return undefined;
}

function createNotesRouter(requireAuth, store) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", (req, res) => {
    res.json(store.listForUser(req.session.user.id));
  });

  router.post("/", (req, res) => {
    const validationError = validateNote(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const note = store.create(
      req.session.user.id,
      req.body.title.trim(),
      req.body.content,
    );
    res.status(201).json(note);
  });

  router.get("/:id", (req, res) => {
    const note = store.getForUser(req.session.user.id, req.params.id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(note);
  });

  router.put("/:id", (req, res) => {
    const validationError = validateNote(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const note = store.update(
      req.session.user.id,
      req.params.id,
      req.body.title.trim(),
      req.body.content,
    );
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(note);
  });

  router.delete("/:id", (req, res) => {
    if (!store.delete(req.session.user.id, req.params.id)) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.status(204).end();
  });

  return router;
}

module.exports = { createNotesRouter, createNotesStore };
