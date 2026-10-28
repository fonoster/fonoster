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
/*
 * A stateful fake of the Twilio endpoints the number link uses, with no transport: accounts,
 * numbers and keys go in, `handle()` answers one request the way the baseline recording
 * (fixtures/baseline-2026-10.jsonl) shows Twilio answering it. `twilioFakeHttpClient` turns it
 * into a twilio-node RequestClient.
 */
import { randomBytes } from "node:crypto";
import { URL } from "node:url";

const API = "https://api.twilio.com/2010-04-01";
const TRUNKING = "https://trunking.twilio.com/v1";
const PAGE_SIZE = 50;

/**
 * A Restricted key's permissions, named as Twilio names them in a refusal
 * ("required permission twilio/voice/sip.trunks/list is missing").
 */
const PERMISSIONS = {
  numbers: [
    "twilio/phone-numbers/active-numbers/list",
    "twilio/phone-numbers/active-numbers/update"
  ],
  ipAcls: [
    "twilio/voice/sip.ip-acls/list",
    "twilio/voice/sip.ip-acls/create",
    "twilio/voice/sip.ip-acls/delete",
    "twilio/voice/sip.ip-acls.ip-addresses/list",
    "twilio/voice/sip.ip-acls.ip-addresses/create"
  ],
  credentialLists: [
    "twilio/voice/sip.credential-lists/list",
    "twilio/voice/sip.credential-lists/create",
    "twilio/voice/sip.credential-lists/delete",
    "twilio/voice/sip.credential-lists.credentials/list",
    "twilio/voice/sip.credential-lists.credentials/create",
    "twilio/voice/sip.credential-lists.credentials/update",
    "twilio/voice/sip.credential-lists.credentials/delete"
  ],
  trunks: [
    "twilio/voice/sip.trunks/list",
    "twilio/voice/sip.trunks/create",
    "twilio/voice/sip.trunks/delete",
    // The recording never reaches these two: a Restricted key stops at the trunk's IP ACL
    "twilio/voice/sip.trunks.origination-urls/list",
    "twilio/voice/sip.trunks.origination-urls/create",
    "twilio/voice/sip.trunks.auth.calls.credential-list-mappings/list",
    "twilio/voice/sip.trunks.auth.calls.credential-list-mappings/create"
  ]
};

type Key = { sid: string; secret: string; permissions?: string[] };

type Number = {
  sid: string;
  phoneNumber: string;
  trunkSid: string | null;
  voiceUrl: string;
};
type IpAddress = {
  sid: string;
  friendlyName: string;
  ipAddress: string;
  cidrPrefixLength: number;
};
type Acl = { sid: string; friendlyName: string; ipAddresses: IpAddress[] };
type Credential = { sid: string; username: string; password: string };
type CredentialList = {
  sid: string;
  friendlyName: string;
  credentials: Credential[];
};
type OriginationUrl = {
  sid: string;
  friendlyName: string;
  sipUrl: string;
  priority: number;
  weight: number;
  enabled: boolean;
};
type Trunk = {
  sid: string;
  friendlyName: string;
  domainName: string;
  aclSids: string[];
  credentialListSids: string[];
  originationUrls: OriginationUrl[];
};

type Account = {
  sid: string;
  authToken: string;
  keys: Key[];
  numbers: Number[];
  trunks: Trunk[];
  acls: Acl[];
  credentialLists: CredentialList[];
};

type FakeRequest = {
  method: string;
  uri: string;
  username?: string;
  password?: string;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

type FakeResponse = { statusCode: number; body: unknown };

type Route = {
  method: string;
  pattern: RegExp;
  /** null: no Restricted key permission covers it (recorded "no requested permission") */
  permission: string | null;
  handle: (
    account: Account,
    ids: string[],
    request: FakeRequest
  ) => FakeResponse;
};

const sid = (prefix: string) => `${prefix}${randomBytes(16).toString("hex")}`;

function error(status: number, code: number, message: string): FakeResponse {
  return {
    statusCode: status,
    body: {
      code,
      message,
      more_info: `https://www.twilio.com/docs/errors/${code}`,
      status
    }
  };
}

function find<T extends { sid: string }>(items: T[], id: string): T {
  const item = items.find((i) => i.sid === id);
  if (!item) throw new Error(`the fake has no ${id}`);
  return item;
}

/** One page, shaped like the recording: v2010 pages carry `*_uri` fields, v1 pages a `meta`. */
function page(
  request: FakeRequest,
  key: string,
  items: unknown[]
): FakeResponse {
  const url = new URL(request.uri);
  const query = {
    ...Object.fromEntries(url.searchParams),
    ...request.params
  } as Record<string, string>;
  const size = Number(query.PageSize ?? PAGE_SIZE);
  const number = Number(query.Page ?? 0);
  const slice = items.slice(number * size, (number + 1) * size);
  const hasNext = (number + 1) * size < items.length;
  const pageUrl = (n: number) => {
    const next = new URL(url.origin + url.pathname);
    for (const [k, v] of Object.entries(query))
      next.searchParams.set(k, String(v));
    next.searchParams.set("PageSize", String(size));
    next.searchParams.set("Page", String(n));
    return next.toString();
  };

  if (url.hostname.startsWith("trunking")) {
    return {
      statusCode: 200,
      body: {
        [key]: slice,
        meta: {
          first_page_url: pageUrl(0),
          key,
          next_page_url: hasNext ? pageUrl(number + 1) : null,
          page: number,
          page_size: size,
          previous_page_url: number > 0 ? pageUrl(number - 1) : null,
          url: pageUrl(number)
        }
      }
    };
  }

  const relative = (n: number) =>
    pageUrl(n).replace("https://api.twilio.com", "");
  return {
    statusCode: 200,
    body: {
      [key]: slice,
      end: number * size + Math.max(slice.length - 1, 0),
      first_page_uri: relative(0),
      next_page_uri: hasNext ? relative(number + 1) : null,
      page: number,
      page_size: size,
      previous_page_uri: number > 0 ? relative(number - 1) : null,
      start: number * size,
      uri: relative(number)
    }
  };
}

const json = {
  number: (a: Account, n: Number) => ({
    account_sid: a.sid,
    sid: n.sid,
    phone_number: n.phoneNumber,
    trunk_sid: n.trunkSid,
    voice_url: n.voiceUrl
  }),
  acl: (a: Account, acl: Acl) => ({
    account_sid: a.sid,
    friendly_name: acl.friendlyName,
    sid: acl.sid
  }),
  ipAddress: (a: Account, acl: Acl, ip: IpAddress) => ({
    account_sid: a.sid,
    cidr_prefix_length: ip.cidrPrefixLength,
    friendly_name: ip.friendlyName,
    ip_access_control_list_sid: acl.sid,
    ip_address: ip.ipAddress,
    sid: ip.sid
  }),
  credentialList: (a: Account, list: CredentialList) => ({
    account_sid: a.sid,
    friendly_name: list.friendlyName,
    sid: list.sid
  }),
  credential: (a: Account, list: CredentialList, c: Credential) => ({
    account_sid: a.sid,
    credential_list_sid: list.sid,
    sid: c.sid,
    username: c.username
  }),
  trunk: (a: Account, t: Trunk) => ({
    account_sid: a.sid,
    domain_name: t.domainName,
    friendly_name: t.friendlyName,
    sid: t.sid
  }),
  originationUrl: (a: Account, t: Trunk, o: OriginationUrl) => ({
    account_sid: a.sid,
    enabled: o.enabled,
    friendly_name: o.friendlyName,
    priority: o.priority,
    sid: o.sid,
    sip_url: o.sipUrl,
    trunk_sid: t.sid,
    weight: o.weight
  })
};

function createTwilioFake() {
  const accounts: Account[] = [];
  const requests: FakeRequest[] = [];
  let unreachable = false;

  const route = (
    method: string,
    pattern: string,
    permission: string | null,
    handle: Route["handle"]
  ): Route => ({
    method,
    pattern: new RegExp(
      `^${pattern.replace(/[.?]/g, "\\$&").replace(/:id/g, "([A-Za-z0-9]+)")}$`
    ),
    permission,
    handle
  });

  const routes: Route[] = [
    // api.twilio.com: numbers
    route(
      "GET",
      `${API}/Accounts/:id/IncomingPhoneNumbers.json`,
      "twilio/phone-numbers/active-numbers/list",
      (a, _, r) => {
        const wanted = r.params?.PhoneNumber;
        const numbers = a.numbers.filter(
          (n) => !wanted || n.phoneNumber === wanted
        );
        return page(
          r,
          "incoming_phone_numbers",
          numbers.map((n) => json.number(a, n))
        );
      }
    ),
    route(
      "POST",
      `${API}/Accounts/:id/IncomingPhoneNumbers/:id.json`,
      "twilio/phone-numbers/active-numbers/update",
      (a, [, pn], r) => {
        const number = find(a.numbers, pn);
        if (r.data?.TrunkSid !== undefined)
          number.trunkSid = String(r.data.TrunkSid) || null;
        if (r.data?.VoiceUrl !== undefined)
          number.voiceUrl = String(r.data.VoiceUrl);
        return { statusCode: 200, body: json.number(a, number) };
      }
    ),
    // api.twilio.com: IP ACLs
    route(
      "GET",
      `${API}/Accounts/:id/SIP/IpAccessControlLists.json`,
      "twilio/voice/sip.ip-acls/list",
      (a, _, r) =>
        page(
          r,
          "ip_access_control_lists",
          a.acls.map((acl) => json.acl(a, acl))
        )
    ),
    route(
      "POST",
      `${API}/Accounts/:id/SIP/IpAccessControlLists.json`,
      "twilio/voice/sip.ip-acls/create",
      (a, _, r) => {
        const acl = {
          sid: sid("AL"),
          friendlyName: String(r.data?.FriendlyName),
          ipAddresses: []
        };
        a.acls.push(acl);
        return { statusCode: 201, body: json.acl(a, acl) };
      }
    ),
    route(
      "DELETE",
      `${API}/Accounts/:id/SIP/IpAccessControlLists/:id.json`,
      "twilio/voice/sip.ip-acls/delete",
      (a, [, al]) => {
        a.acls = a.acls.filter((acl) => acl.sid !== al);
        return { statusCode: 204, body: "" };
      }
    ),
    route(
      "GET",
      `${API}/Accounts/:id/SIP/IpAccessControlLists/:id/IpAddresses.json`,
      "twilio/voice/sip.ip-acls.ip-addresses/list",
      (a, [, al], r) => {
        const acl = find(a.acls, al);
        return page(
          r,
          "ip_addresses",
          acl.ipAddresses.map((ip) => json.ipAddress(a, acl, ip))
        );
      }
    ),
    route(
      "POST",
      `${API}/Accounts/:id/SIP/IpAccessControlLists/:id/IpAddresses.json`,
      "twilio/voice/sip.ip-acls.ip-addresses/create",
      (a, [, al], r) => {
        const acl = find(a.acls, al);
        const ip = {
          sid: sid("IP"),
          friendlyName: String(r.data?.FriendlyName),
          ipAddress: String(r.data?.IpAddress),
          cidrPrefixLength: Number(r.data?.CidrPrefixLength ?? 32)
        };
        acl.ipAddresses.push(ip);
        return { statusCode: 201, body: json.ipAddress(a, acl, ip) };
      }
    ),
    route(
      "DELETE",
      `${API}/Accounts/:id/SIP/IpAccessControlLists/:id/IpAddresses/:id.json`,
      "twilio/voice/sip.ip-acls.ip-addresses/delete",
      (a, [, al, ip]) => {
        const acl = find(a.acls, al);
        acl.ipAddresses = acl.ipAddresses.filter((i) => i.sid !== ip);
        return { statusCode: 204, body: "" };
      }
    ),
    // api.twilio.com: credential lists
    route(
      "GET",
      `${API}/Accounts/:id/SIP/CredentialLists.json`,
      "twilio/voice/sip.credential-lists/list",
      (a, _, r) =>
        page(
          r,
          "credential_lists",
          a.credentialLists.map((l) => json.credentialList(a, l))
        )
    ),
    route(
      "POST",
      `${API}/Accounts/:id/SIP/CredentialLists.json`,
      "twilio/voice/sip.credential-lists/create",
      (a, _, r) => {
        const list = {
          sid: sid("CL"),
          friendlyName: String(r.data?.FriendlyName),
          credentials: []
        };
        a.credentialLists.push(list);
        return { statusCode: 201, body: json.credentialList(a, list) };
      }
    ),
    route(
      "DELETE",
      `${API}/Accounts/:id/SIP/CredentialLists/:id.json`,
      "twilio/voice/sip.credential-lists/delete",
      (a, [, cl]) => {
        a.credentialLists = a.credentialLists.filter((l) => l.sid !== cl);
        return { statusCode: 204, body: "" };
      }
    ),
    route(
      "GET",
      `${API}/Accounts/:id/SIP/CredentialLists/:id/Credentials.json`,
      "twilio/voice/sip.credential-lists.credentials/list",
      (a, [, cl], r) => {
        const list = find(a.credentialLists, cl);
        return page(
          r,
          "credentials",
          list.credentials.map((c) => json.credential(a, list, c))
        );
      }
    ),
    route(
      "POST",
      `${API}/Accounts/:id/SIP/CredentialLists/:id/Credentials.json`,
      "twilio/voice/sip.credential-lists.credentials/create",
      (a, [, cl], r) => {
        const list = find(a.credentialLists, cl);
        const credential = {
          sid: sid("CR"),
          username: String(r.data?.Username),
          password: String(r.data?.Password)
        };
        list.credentials.push(credential);
        return { statusCode: 201, body: json.credential(a, list, credential) };
      }
    ),
    route(
      "POST",
      `${API}/Accounts/:id/SIP/CredentialLists/:id/Credentials/:id.json`,
      "twilio/voice/sip.credential-lists.credentials/update",
      (a, [, cl, cr], r) => {
        const list = find(a.credentialLists, cl);
        const credential = find(list.credentials, cr);
        credential.password = String(r.data?.Password);
        return { statusCode: 200, body: json.credential(a, list, credential) };
      }
    ),
    route(
      "DELETE",
      `${API}/Accounts/:id/SIP/CredentialLists/:id/Credentials/:id.json`,
      "twilio/voice/sip.credential-lists.credentials/delete",
      (a, [, cl, cr]) => {
        const list = find(a.credentialLists, cl);
        list.credentials = list.credentials.filter((c) => c.sid !== cr);
        return { statusCode: 204, body: "" };
      }
    ),
    // trunking.twilio.com
    route(
      "GET",
      `${TRUNKING}/Trunks`,
      "twilio/voice/sip.trunks/list",
      (a, _, r) =>
        page(
          r,
          "trunks",
          a.trunks.map((t) => json.trunk(a, t))
        )
    ),
    route(
      "POST",
      `${TRUNKING}/Trunks`,
      "twilio/voice/sip.trunks/create",
      (a, _, r) => {
        const domainName = String(r.data?.DomainName);
        if (
          accounts.some((other) =>
            other.trunks.some((t) => t.domainName === domainName)
          )
        ) {
          return error(400, 400, "Bad Request");
        }
        const trunk = {
          sid: sid("TK"),
          friendlyName: String(r.data?.FriendlyName),
          domainName,
          aclSids: [],
          credentialListSids: [],
          originationUrls: []
        };
        a.trunks.push(trunk);
        return { statusCode: 201, body: json.trunk(a, trunk) };
      }
    ),
    route(
      "DELETE",
      `${TRUNKING}/Trunks/:id`,
      "twilio/voice/sip.trunks/delete",
      (a, [tk]) => {
        a.trunks = a.trunks.filter((t) => t.sid !== tk);
        for (const n of a.numbers) if (n.trunkSid === tk) n.trunkSid = null;
        return { statusCode: 204, body: "" };
      }
    ),
    route(
      "GET",
      `${TRUNKING}/Trunks/:id/IpAccessControlLists`,
      null,
      (a, [tk], r) => {
        const trunk = find(a.trunks, tk);
        const acls = trunk.aclSids.map((s) => ({
          ...json.acl(a, find(a.acls, s)),
          trunk_sid: tk
        }));
        return page(r, "ip_access_control_lists", acls);
      }
    ),
    route(
      "POST",
      `${TRUNKING}/Trunks/:id/IpAccessControlLists`,
      null,
      (a, [tk], r) => {
        const trunk = find(a.trunks, tk);
        const acl = find(a.acls, String(r.data?.IpAccessControlListSid));
        trunk.aclSids.push(acl.sid);
        return {
          statusCode: 201,
          body: { ...json.acl(a, acl), trunk_sid: tk }
        };
      }
    ),
    route(
      "GET",
      `${TRUNKING}/Trunks/:id/OriginationUrls`,
      "twilio/voice/sip.trunks.origination-urls/list",
      (a, [tk], r) => {
        const trunk = find(a.trunks, tk);
        return page(
          r,
          "origination_urls",
          trunk.originationUrls.map((o) => json.originationUrl(a, trunk, o))
        );
      }
    ),
    route(
      "POST",
      `${TRUNKING}/Trunks/:id/OriginationUrls`,
      "twilio/voice/sip.trunks.origination-urls/create",
      (a, [tk], r) => {
        const trunk = find(a.trunks, tk);
        const url = {
          sid: sid("OU"),
          friendlyName: String(r.data?.FriendlyName),
          sipUrl: String(r.data?.SipUrl),
          priority: Number(r.data?.Priority),
          weight: Number(r.data?.Weight),
          enabled: String(r.data?.Enabled) === "true"
        };
        trunk.originationUrls.push(url);
        return { statusCode: 201, body: json.originationUrl(a, trunk, url) };
      }
    ),
    route(
      "GET",
      `${TRUNKING}/Trunks/:id/CredentialLists`,
      "twilio/voice/sip.trunks.auth.calls.credential-list-mappings/list",
      (a, [tk], r) => {
        const trunk = find(a.trunks, tk);
        const lists = trunk.credentialListSids.map((s) => ({
          ...json.credentialList(a, find(a.credentialLists, s)),
          trunk_sid: tk
        }));
        return page(r, "credential_lists", lists);
      }
    ),
    route(
      "POST",
      `${TRUNKING}/Trunks/:id/CredentialLists`,
      "twilio/voice/sip.trunks.auth.calls.credential-list-mappings/create",
      (a, [tk], r) => {
        const trunk = find(a.trunks, tk);
        const list = find(a.credentialLists, String(r.data?.CredentialListSid));
        trunk.credentialListSids.push(list.sid);
        return {
          statusCode: 201,
          body: { ...json.credentialList(a, list), trunk_sid: tk }
        };
      }
    )
  ];

  /** The account a request authenticates as, or the recorded refusal. */
  function authenticate(
    request: FakeRequest,
    path: string
  ): Account | FakeResponse {
    const accountSid = path.match(/Accounts\/(AC[0-9a-f]{32})/)?.[1];
    const account = accounts.find((a) =>
      request.username?.startsWith("AC")
        ? a.sid === request.username
        : a.keys.some((k) => k.sid === request.username)
    );
    const valid =
      account &&
      (account.sid === request.username
        ? account.authToken === request.password
        : account.keys.some(
            (k) => k.sid === request.username && k.secret === request.password
          ));

    if (!account || !valid || (accountSid && accountSid !== account.sid)) {
      return error(
        401,
        20003,
        `authentication failed, auth token is not valid for account ${accountSid ?? request.username}`
      );
    }
    return account;
  }

  function handle(request: FakeRequest): FakeResponse {
    if (unreachable) {
      throw Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:443"), {
        code: "ECONNREFUSED",
        config: {
          headers: {
            Authorization: `Basic ${request.username}:${request.password}`
          }
        }
      });
    }

    requests.push(request);
    const path = request.uri.split("?")[0];
    const method = request.method.toUpperCase();

    for (const r of routes) {
      const match = r.method === method ? path.match(r.pattern) : null;
      if (!match) continue;

      const account = authenticate(request, path);
      if (!("sid" in account)) return account;

      const key = account.keys.find((k) => k.sid === request.username);
      if (key?.permissions) {
        if (r.permission === null) {
          return error(
            401,
            70051,
            "Authorization Error: no requested permission"
          );
        }
        if (!key.permissions.includes(r.permission)) {
          return error(
            401,
            70051,
            `Authorization Error: required permission ${r.permission} is missing`
          );
        }
      }

      return r.handle(account, match.slice(1), request);
    }

    throw new Error(`the Twilio fake has no route for ${method} ${path}`);
  }

  return {
    /** Adds an account; a key with `permissions` is a Restricted key, without it a Standard one. */
    addAccount(seed: {
      sid: string;
      authToken: string;
      keys?: Key[];
      numbers?: { phoneNumber: string; voiceUrl?: string; trunkSid?: string }[];
    }): Account {
      const account: Account = {
        sid: seed.sid,
        authToken: seed.authToken,
        keys: seed.keys ?? [],
        numbers: (seed.numbers ?? []).map((n) => ({
          sid: sid("PN"),
          phoneNumber: n.phoneNumber,
          trunkSid: n.trunkSid ?? null,
          voiceUrl: n.voiceUrl ?? ""
        })),
        trunks: [],
        acls: [],
        credentialLists: []
      };
      accounts.push(account);
      return account;
    },
    account(accountSid: string): Account {
      return find(accounts, accountSid);
    },
    handle,
    requests,
    setUnreachable(value: boolean) {
      unreachable = value;
    }
  };
}

type TwilioFake = ReturnType<typeof createTwilioFake>;

export { Account, createTwilioFake, FakeRequest, PERMISSIONS, TwilioFake };
