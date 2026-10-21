/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as http from "http";
import { randomBytes } from "crypto";
import { FakeProvider } from "./FakeProvider";

/**
 * How one real provider shapes the authorization-code flow. GitHub is OAuth 2.0 in outline but
 * not in detail (its own paths, JSON on the token endpoint, the identity from two REST calls and no
 * id_token); an OpenID Connect provider (Google) uses standard paths and a single userinfo.
 */
export type OAuth2Profile = {
  authorizePath: string;
  tokenPath: string;
  /** `github`: GET /user and GET /user/emails. `oidc`: GET <userInfoPath> with OIDC claims. */
  identity: "github" | "oidc";
  userInfoPath?: string;
};

export const OAUTH2_PROFILES: Record<string, OAuth2Profile> = {
  github: {
    authorizePath: "/login/oauth/authorize",
    tokenPath: "/login/oauth/access_token",
    identity: "github"
  },
  oidc: {
    authorizePath: "/authorize",
    tokenPath: "/token",
    identity: "oidc",
    userInfoPath: "/userinfo"
  }
};

/**
 * A fake OAuth 2.0 provider for sign-in tests: identity's `oauth2.<provider>.url` and `.apiUrl` point
 * here and the real provider is never contacted. The authorize page lets the tester pick the
 * account's primary email (default `FAKES_OAUTH2_EMAIL`), then redirects back with a one-time code;
 * the token endpoint trades it for a bearer token; the identity endpoints describe that account.
 *
 * Which email signs in is the point: one with a Fonoster account signs that user in, an unknown one
 * exercises the sign-up policy.
 */
export class FakeOAuth2 extends FakeProvider {
  private readonly codes = new Map<string, string>();
  private readonly tokens = new Map<string, string>();
  readonly profile: OAuth2Profile;

  constructor(
    profile: keyof typeof OAUTH2_PROFILES | OAuth2Profile = "github",
    readonly defaultEmail = "admin@fonoster.local"
  ) {
    super("oauth2");
    this.profile = typeof profile === "string" ? OAUTH2_PROFILES[profile] : profile;
    if (!this.profile) throw new Error(`unknown OAuth2 profile: ${String(profile)}`);
  }

  protected async serve(
    req: http.IncomingMessage,
    body: unknown,
    res: http.ServerResponse
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://fake");
    const { authorizePath, tokenPath, identity, userInfoPath } = this.profile;
    if (url.pathname === authorizePath) this.authorize(url, res);
    else if (url.pathname === tokenPath) this.token(body, res);
    else if (identity === "github" && url.pathname === "/user") this.githubUser(req, res);
    else if (identity === "github" && url.pathname === "/user/emails") this.githubEmails(req, res);
    else if (identity === "oidc" && url.pathname === userInfoPath) this.userInfo(req, res);
    else if (url.pathname === "/health") json(res, 200, { ok: true });
    else json(res, 404, { message: "Not Found" });
  }

  private authorize(url: URL, res: http.ServerResponse): void {
    const redirect = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state") ?? "";
    if (!redirect) {
      json(res, 400, { error: "invalid_request", error_description: "redirect_uri is required" });
      return;
    }
    const email = url.searchParams.get("email");
    if (email) {
      const code = randomBytes(8).toString("hex");
      this.codes.set(code, email);
      const back = new URL(redirect);
      back.searchParams.set("code", code);
      back.searchParams.set("state", state);
      res.writeHead(302, { location: back.toString() });
      res.end();
      return;
    }
    // The consent page: pick the account. A plain form that posts back here.
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"><title>Fake OAuth2</title>
<body style="font:16px system-ui;max-width:28em;margin:4em auto">
<h1>Fake sign-in provider</h1><p>Sign in to <b>Fonoster</b> as the account whose primary email is:</p>
<form method="get">
<input type="hidden" name="redirect_uri" value="${escapeHtml(redirect)}">
<input type="hidden" name="state" value="${escapeHtml(state)}">
<input name="email" type="email" value="${escapeHtml(this.defaultEmail)}" style="font:inherit;width:100%;padding:.5em">
<p><button style="font:inherit;padding:.5em 1em">Authorize</button></p></form>
<p style="color:#666">A local fake for tests. No real account is involved.</p></body>`);
  }

  private token(body: unknown, res: http.ServerResponse): void {
    // JSON (GitHub with Accept: application/json) or form-encoded (the standard).
    const fields =
      typeof body === "string"
        ? Object.fromEntries(new URLSearchParams(body))
        : ((body ?? {}) as Record<string, string>);
    const code = fields.code;
    const email = code ? this.codes.get(code) : undefined;
    if (!email) {
      json(res, this.profile.identity === "github" ? 200 : 400, {
        error: "bad_verification_code",
        error_description: "The code passed is incorrect or expired."
      });
      return;
    }
    this.codes.delete(code);
    const token = `fake_${randomBytes(12).toString("hex")}`;
    this.tokens.set(token, email);
    json(res, 200, { access_token: token, token_type: "bearer", scope: "user:email" });
  }

  private account(req: http.IncomingMessage) {
    const auth = req.headers.authorization ?? "";
    return this.tokens.get(auth.replace(/^(Bearer|token)\s+/i, ""));
  }

  private githubUser(req: http.IncomingMessage, res: http.ServerResponse): void {
    const email = this.account(req);
    if (!email) {
      json(res, 401, { message: "Bad credentials" });
      return;
    }
    const login = email.split("@")[0];
    json(res, 200, { login, id: 1, name: login.replace(/[._-]/g, " ") });
  }

  private githubEmails(req: http.IncomingMessage, res: http.ServerResponse): void {
    const email = this.account(req);
    if (!email) {
      json(res, 401, { message: "Bad credentials" });
      return;
    }
    json(res, 200, [{ email, primary: true, verified: true, visibility: "private" }]);
  }

  private userInfo(req: http.IncomingMessage, res: http.ServerResponse): void {
    const email = this.account(req);
    if (!email) {
      json(res, 401, { error: "invalid_token" });
      return;
    }
    const name = email.split("@")[0].replace(/[._-]/g, " ");
    json(res, 200, { sub: email, email, email_verified: true, name });
  }
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
