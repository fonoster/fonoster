#!/usr/bin/env node
/*
 * A stand-in for GitHub's OAuth flow and the two REST calls Identity makes, for
 * local and end-to-end testing without a real OAuth app.
 *
 *   GET  /login/oauth/authorize   page to pick who signs in, then redirects back
 *   POST /login/oauth/access_token
 *   GET  /user, GET /user/emails
 *
 * Point Identity at it in fonoster.yaml:
 *   identity.oauth2.github: { clientId: fake, clientSecret: fake,
 *                             url: http://localhost:3999, apiUrl: http://localhost:3999 }
 * (from inside compose use http://fake-github:3999 for apiUrl/url's token
 * exchange, but the browser must reach `url` too, so keep it on localhost when
 * the apiserver runs on the host).
 *
 * Env: PORT (3999), FAKE_GITHUB_CLIENT_ID / FAKE_GITHUB_CLIENT_SECRET (if set,
 * they must match).
 */
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3999);
const CLIENT_ID = process.env.FAKE_GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.FAKE_GITHUB_CLIENT_SECRET;

/** Ready-made accounts covering the cases Identity treats differently. */
const PRESETS = [
  { login: "ada", name: "Ada Lovelace", email: "ada@acme.com", verified: true },
  { login: "grace", name: "Grace Hopper", email: "grace@acme.com", verified: true },
  { login: "unverified", name: "Unverified User", email: "unverified@acme.com", verified: false }
];

// The code and the access token carry the user, so the server keeps no state.
const encode = (user) => Buffer.from(JSON.stringify(user)).toString("base64url");
const decode = (value) => {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": type });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(req.headers["content-type"]?.includes("json") ? JSON.parse(data || "{}") : Object.fromEntries(new URLSearchParams(data)));
      } catch {
        resolve({});
      }
    });
  });
}

function authorizePage(params) {
  const hidden = ["client_id", "redirect_uri", "state"]
    .map((k) => `<input type="hidden" name="${k}" value="${escape(params.get(k) ?? "")}">`)
    .join("");
  const presets = PRESETS.map(
    (u, i) =>
      `<label><input type="radio" name="preset" value="${i}" ${i === 0 ? "checked" : ""}> ${escape(u.name)} &lt;${escape(u.email)}&gt;${u.verified ? "" : " (email not verified)"}</label>`
  ).join("<br>");
  return `<!doctype html><meta charset="utf-8"><title>Fake GitHub</title>
<style>body{font:15px system-ui;max-width:480px;margin:60px auto;padding:0 16px}fieldset{margin:16px 0}button{font:inherit;padding:8px 16px}</style>
<h1>Fake GitHub</h1>
<p>Authorize <code>${escape(params.get("client_id") ?? "")}</code> as:</p>
<form method="post" action="/login/oauth/approve">${hidden}
<fieldset>${presets}<br>
<label><input type="radio" name="preset" value="custom"> Someone else:
<input name="email" placeholder="you@company.com"> <label><input type="checkbox" name="verified" checked> verified</label></label>
</fieldset>
<button type="submit" name="decision" value="approve">Authorize</button>
<button type="submit" name="decision" value="deny">Cancel</button>
</form>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/login/oauth/authorize") {
    if (CLIENT_ID && url.searchParams.get("client_id") !== CLIENT_ID) {
      return send(res, 400, "unknown client_id", "text/plain");
    }
    return send(res, 200, authorizePage(url.searchParams), "text/html; charset=utf-8");
  }

  if (req.method === "POST" && url.pathname === "/login/oauth/approve") {
    const form = await readBody(req);
    const back = new URL(form.redirect_uri);
    if (form.state) back.searchParams.set("state", form.state);
    if (form.decision === "deny") {
      back.searchParams.set("error", "access_denied");
    } else {
      const user =
        form.preset === "custom"
          ? { login: String(form.email).split("@")[0], name: "", email: form.email, verified: form.verified === "on" }
          : PRESETS[Number(form.preset) || 0];
      back.searchParams.set("code", encode(user));
    }
    res.writeHead(302, { location: back.toString() });
    return res.end();
  }

  if (req.method === "POST" && url.pathname === "/login/oauth/access_token") {
    const body = await readBody(req);
    if ((CLIENT_ID && body.client_id !== CLIENT_ID) || (CLIENT_SECRET && body.client_secret !== CLIENT_SECRET)) {
      return send(res, 200, { error: "incorrect_client_credentials" });
    }
    return decode(body.code)
      ? send(res, 200, { access_token: body.code, token_type: "bearer", scope: "read:user,user:email" })
      : send(res, 200, { error: "bad_verification_code" });
  }

  const user = decode((req.headers.authorization ?? "").replace(/^(token|Bearer)\s+/i, ""));
  if (req.method === "GET" && (url.pathname === "/user" || url.pathname === "/user/emails")) {
    if (!user) return send(res, 401, { message: "Bad credentials" });
    if (url.pathname === "/user") {
      return send(res, 200, { login: user.login, name: user.name || null, avatar_url: "", email: null });
    }
    return send(res, 200, [{ email: user.email, primary: true, verified: Boolean(user.verified), visibility: "private" }]);
  }

  send(res, 404, { message: "Not Found" });
});

server.listen(PORT, () => console.log(`fake GitHub on http://localhost:${PORT}`));
