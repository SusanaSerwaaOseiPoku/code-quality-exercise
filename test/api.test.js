const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { app, demoUsers } = require("../server");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function request(path, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body) {
    headers["content-type"] = "application/json";
  }
  if (cookie) {
    headers.cookie = cookie;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = response.status === 204 ? undefined : await response.json();
  return { response, payload };
}

async function login(username) {
  const account = demoUsers.credentials.find((entry) => entry.username === username);
  const { response, payload } = await request("/api/auth/login", {
    method: "POST",
    body: { username, password: account.password },
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  return cookie.split(";")[0];
}

test("health, authentication, and user-scoped notes work", async () => {
  const health = await request("/health");
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.payload, { status: "ok" });

  const anonymousNotes = await request("/api/notes");
  assert.equal(anonymousNotes.response.status, 401);

  const accountACookie = await login("demo-a");
  const created = await request("/api/notes", {
    method: "POST",
    cookie: accountACookie,
    body: { title: "Rehearsal note A", content: "Visible to account A only" },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.title, "Rehearsal note A");

  const accountAList = await request("/api/notes", { cookie: accountACookie });
  assert.equal(accountAList.response.status, 200);
  assert.equal(accountAList.payload.length, 1);

  const accountBCookie = await login("demo-b");
  const accountBList = await request("/api/notes", { cookie: accountBCookie });
  assert.equal(accountBList.response.status, 200);
  assert.deepEqual(accountBList.payload, []);

  const accountBRead = await request(`/api/notes/${created.payload.id}`, {
    cookie: accountBCookie,
  });
  assert.equal(accountBRead.response.status, 404);
});
