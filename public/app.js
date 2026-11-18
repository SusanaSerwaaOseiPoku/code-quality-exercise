const loginPanel = document.querySelector("#loginPanel");
const notesPanel = document.querySelector("#notesPanel");
const loginForm = document.querySelector("#loginForm");
const noteForm = document.querySelector("#noteForm");
const noteList = document.querySelector("#noteList");
const statusMessage = document.querySelector("#status");

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...options, headers });
  if (response.status === 204) {
    return undefined;
  }
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function showLogin() {
  notesPanel.hidden = true;
  loginPanel.hidden = false;
}

function showNotes(user) {
  loginPanel.hidden = true;
  notesPanel.hidden = false;
  document.querySelector("#accountLabel").textContent = `Signed in as ${user.username}`;
}

function renderNotes(notes) {
  noteList.replaceChildren();
  if (notes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No notes yet. Add one above.";
    noteList.append(empty);
    return;
  }

  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note";
    const title = document.createElement("h3");
    title.textContent = note.title;
    const content = document.createElement("p");
    content.textContent = note.content || "No details";
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", async () => {
      try {
        await request(`/api/notes/${encodeURIComponent(note.id)}`, { method: "DELETE" });
        await loadNotes();
        showStatus("Note deleted.");
      } catch (error) {
        showStatus(error.message, true);
      }
    });
    item.append(title, content, removeButton);
    noteList.append(item);
  }
}

async function loadNotes() {
  const notes = await request("/api/notes");
  renderNotes(notes);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  try {
    const user = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });
    showNotes(user);
    await loadNotes();
    loginForm.reset();
    showStatus("Signed in.");
  } catch (error) {
    showStatus(error.message, true);
  }
});

noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(noteForm);
  try {
    await request("/api/notes", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        content: formData.get("content"),
      }),
    });
    noteForm.reset();
    await loadNotes();
    showStatus("Note saved.");
  } catch (error) {
    showStatus(error.message, true);
  }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  try {
    await request("/api/auth/logout", { method: "POST" });
    showLogin();
    showStatus("Signed out.");
  } catch (error) {
    showStatus(error.message, true);
  }
});

async function initialize() {
  try {
    const user = await request("/api/me");
    showNotes(user);
    await loadNotes();
  } catch (error) {
    if (error.status === 401) {
      showLogin();
      return;
    }
    showStatus(error.message, true);
  }
}

initialize();
