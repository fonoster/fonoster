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
import { test as base, expect, type Page } from "@playwright/test";
import { capabilities, emptyReply, GrpcWebMock, identity } from "./grpc-web";

export type Variant = "community" | "cloud";

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

/** An unsigned JWT; the dashboard only reads claims, the server verifies. */
export function jwt(claims: object) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode({ exp: inAnHour(), ...claims })}.e2e`;
}

export type TestUser = {
  ref: string;
  email: string;
  name: string;
  mustChangePassword?: boolean;
};

export const ada: TestUser = {
  ref: "u-ada",
  email: "ada@acme.com",
  name: "Ada Lovelace"
};

export function tokens(
  user: TestUser,
  Response = identity.ExchangeCredentialsResponse
) {
  const response = new Response();
  response.setAccessToken(
    jwt({ sub: user.ref, accessKeyId: `US${user.ref}`, access: [] })
  );
  response.setRefreshToken(`refresh-${user.ref}`);
  response.setIdToken(
    jwt({
      sub: user.ref,
      email: user.email,
      accessKeyId: `US${user.ref}`,
      mustChangePassword: user.mustChangePassword ?? false
    })
  );
  return response;
}

/** Like tokens(), with an access token that expires in `seconds` (to force a renewal soon). */
export function tokensExpiring(
  user: TestUser,
  seconds: number,
  Response = identity.ExchangeCredentialsResponse
) {
  const response = tokens(user, Response);
  response.setAccessToken(
    jwt({
      sub: user.ref,
      accessKeyId: `US${user.ref}`,
      access: [],
      exp: Math.floor(Date.now() / 1000) + seconds
    })
  );
  return response;
}

/**
 * Serves one private region over the regions HTTP API (list and detail) and advertises
 * private regions in the capabilities. Registered after the mock, so these routes win.
 */
export async function withPrivateRegion(
  page: Page,
  api: GrpcWebMock,
  variant: Variant,
  region: {
    ref: string;
    id: string;
    displayName: string;
    monthlyFeeCents: number | null;
  }
) {
  api.on("Capabilities/GetCapabilities", () => {
    const response = capabilitiesFor(variant);
    const regions = new capabilities.RegionsCapabilities();
    regions.setPrivate(true);
    response.setRegions(regions);
    return response;
  });
  const summary = {
    ref: region.ref,
    id: region.id,
    displayName: region.displayName,
    kind: "private",
    state: "connected",
    status: "connected"
  };
  const detail = {
    ...summary,
    sipDomain: `${region.id}.sip.acme.com`,
    version: "1.0.0",
    components: { roomrNodes: 1, appbridges: 1, autopilot: true },
    workspaces: [],
    secrets: [],
    monthlyFeeCents: region.monthlyFeeCents
  };
  // Cross-origin from the dashboard, with an Authorization header: answer the preflight too.
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "authorization, content-type, x-requested-with",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  };
  await page.route(/\/api\/regions(\/[^/?]+)?(\?.*)?$/, (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: cors });
    const path = new URL(route.request().url()).pathname;
    const json = path.endsWith("/api/regions") ? { items: [summary] } : detail;
    return route.fulfill({ json, headers: cors });
  });
}

export function workspace(ref: string, name: string, ownerRef: string) {
  const w = new identity.Workspace();
  w.setRef(ref);
  w.setName(name);
  w.setOwnerRef(ownerRef);
  w.setAccessKeyId(`WO${ref}`);
  w.setCreatedAt(Date.parse("2026-03-04") / 1000);
  return w;
}

export function capabilitiesFor(variant: Variant) {
  const auth = new capabilities.AuthCapabilities();
  const response = new capabilities.GetCapabilitiesResponse();
  const billing = new capabilities.BillingCapabilities();
  const costs = new capabilities.CostsCapabilities();
  if (variant === "cloud") {
    auth.setMethodsList(["password", "email_code", "github"]);
    auth.setSignup("open");
    const github = new capabilities.GitHubCapability();
    github.setClientId("Iv1.e2e");
    github.setAuthorizeUrl("https://github.com/login/oauth/authorize");
    auth.setGithub(github);
    billing.setEnabled(true);
    costs.setDisplay("prices");
  } else {
    auth.setMethodsList(["password"]);
    auth.setSignup("invite");
    billing.setEnabled(false);
    costs.setDisplay("none");
  }
  response.setAuth(auth);
  response.setBilling(billing);
  response.setCosts(costs);
  response.setDomain(variant === "cloud" ? "fonoster.com" : "fonoster.local");
  // The API's default: SIP names are one label under pstn.<domain> and sip.<domain>.
  const sip = new capabilities.SipCapabilities();
  sip.setNames("domain");
  response.setSip(sip);
  response.setAppUrl("http://localhost:4174");
  return response;
}

/**
 * A mocked API with capabilities for the project's variant and a signed-in
 * user's basic reads (profile, workspaces, token refresh).
 */
export const test = base.extend<{ variant: Variant; api: GrpcWebMock }>({
  variant: ["community", { option: true }],
  api: async ({ page, variant }, use) => {
    const api = new GrpcWebMock(page)
      .on("Capabilities/GetCapabilities", () => capabilitiesFor(variant))
      .on("Identity/SendVerificationCode", () => emptyReply())
      .on("Identity/ExchangeRefreshToken", () =>
        tokens(ada, identity.ExchangeRefreshTokenResponse)
      )
      .on("Identity/GetUser", () => {
        const user = new identity.User();
        user.setRef(ada.ref);
        user.setName(ada.name);
        user.setEmail(ada.email);
        return user;
      })
      .on("Identity/ListWorkspaces", () => {
        const list = new identity.ListWorkspacesResponse();
        list.setItemsList([workspace("ws-1", "Acme Support", ada.ref)]);
        return list;
      });
    await api.install();
    await use(api);
  }
});

export { expect, identity };
