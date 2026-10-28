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
 * The baseline live run of the Twilio side of a number link (#1172). It runs today's CLI link
 * (`linkTwilioNumberToApplication`) and the new `provisionTwilioTrunk` +
 * `assignTwilioNumberToTrunk` against a real Twilio account, through a recording httpClient,
 * and writes:
 *
 *   test/twilio/fixtures/baseline-2026-10.jsonl   every request: step, variant, method, URL,
 *                                                  form body, status and response body
 *   test/twilio/fixtures/baseline-2026-10.md      each step's outcome and leftovers
 *
 * The Fonoster side runs against the local dev stack, in a workspace made for the run and
 * deleted at the end. The last step always cleans up: the number goes back to its original
 * trunk or voice URL, and every Twilio resource the run made is deleted. It never deletes a
 * resource that existed before the run.
 *
 *   npx tsx mods/common/scripts/twilio-baseline.ts <credentials env file>
 *
 * The env file holds TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_TEST_NUMBER,
 * TWILIO_STANDARD_KEY_SID/SECRET, TWILIO_RESTRICTED_KEY_SID/SECRET,
 * TWILIO_RESTRICTED_NOTRUNK_KEY_SID/SECRET and TWILIO_SUBACCOUNT_SID/AUTH_TOKEN.
 * Dev stack access comes from .dev/.env (OWNER_EMAIL, OWNER_PASSWORD, HOST_IP).
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as SDK from "@fonoster/sdk";
import { TwilioCredentials } from "@fonoster/types";
import { Twilio } from "twilio";
import RequestClient from "twilio/lib/base/RequestClient";
// Today's CLI link, imported as is: it takes the Twilio client as an argument
import { linkTwilioNumberToApplication } from "../../ctl/src/utils/linkTwilioNumberToApplication";
import {
  assignTwilioNumberToTrunk,
  provisionTwilioTrunk,
  TwilioLinkError
} from "../src/twilio";

const ROOT = join(__dirname, "..", "..", "..");
const FIXTURES = join(__dirname, "..", "test", "twilio", "fixtures");
const RECORDING = join(FIXTURES, "baseline-2026-10.jsonl");
const RECORD = join(FIXTURES, "baseline-2026-10.md");
const NOT_IN_ACCOUNT = "+18005550199";
const DEV_ENDPOINT = process.env.FONOSTER_DEV_ENDPOINT ?? "localhost:8449";

process.loadEnvFile(process.argv[2] ?? join(ROOT, ".env.twilio"));
const devEnv = Object.fromEntries(
  readFileSync(join(ROOT, ".dev", ".env"), "utf8")
    .split("\n")
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1)
    ])
);

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const ACCOUNT_SID = env("TWILIO_ACCOUNT_SID");
const SUBACCOUNT_SID = env("TWILIO_SUBACCOUNT_SID");
const NUMBER = env("TWILIO_TEST_NUMBER");

const CREDENTIALS = {
  authToken: { accountSid: ACCOUNT_SID, authToken: env("TWILIO_AUTH_TOKEN") },
  standard: {
    accountSid: ACCOUNT_SID,
    apiKeySid: env("TWILIO_STANDARD_KEY_SID"),
    apiKeySecret: env("TWILIO_STANDARD_KEY_SECRET")
  },
  restricted: {
    accountSid: ACCOUNT_SID,
    apiKeySid: env("TWILIO_RESTRICTED_KEY_SID"),
    apiKeySecret: env("TWILIO_RESTRICTED_KEY_SECRET")
  },
  restrictedNoTrunk: {
    accountSid: ACCOUNT_SID,
    apiKeySid: env("TWILIO_RESTRICTED_NOTRUNK_KEY_SID"),
    apiKeySecret: env("TWILIO_RESTRICTED_NOTRUNK_KEY_SECRET")
  },
  wrongSecret: {
    accountSid: ACCOUNT_SID,
    authToken: randomBytes(16).toString("hex")
  },
  subaccount: {
    accountSid: SUBACCOUNT_SID,
    authToken: env("TWILIO_SUBACCOUNT_AUTH_TOKEN")
  }
};

// Committed fixtures name no real account or key: each SID becomes a stable placeholder
const PLACEHOLDERS: [string, string][] = [
  [ACCOUNT_SID, "AC00000000000000000000000000000001"],
  [SUBACCOUNT_SID, "AC00000000000000000000000000000002"],
  [CREDENTIALS.standard.apiKeySid, "SK00000000000000000000000000000001"],
  [CREDENTIALS.restricted.apiKeySid, "SK00000000000000000000000000000002"],
  [
    CREDENTIALS.restrictedNoTrunk.apiKeySid,
    "SK00000000000000000000000000000003"
  ]
];
const SECRETS = [
  env("TWILIO_AUTH_TOKEN"),
  CREDENTIALS.standard.apiKeySecret,
  CREDENTIALS.restricted.apiKeySecret,
  CREDENTIALS.restrictedNoTrunk.apiKeySecret,
  CREDENTIALS.wrongSecret.authToken,
  CREDENTIALS.subaccount.authToken
];

function anonymize(text: string): string {
  return PLACEHOLDERS.reduce(
    (out, [real, fake]) => out.split(real).join(fake),
    text
  );
}

// The recording httpClient
type Entry = {
  step: string;
  variant: string;
  method: string;
  url: string;
  params?: unknown;
  form?: Record<string, unknown>;
  status: number;
  body: unknown;
};

const recording: Entry[] = [];
let current = { step: "pre", variant: "check" };

class RecordingClient extends RequestClient {
  async request<T>(opts: RequestClient.RequestOptions<T>) {
    const response = await super.request(opts);
    const form = opts.data
      ? { ...(opts.data as Record<string, unknown>) }
      : undefined;
    if (form && "Password" in form) form.Password = "<redacted>";
    recording.push({
      ...current,
      method: String(opts.method).toUpperCase(),
      url: opts.uri,
      params:
        opts.params && Object.keys(opts.params).length
          ? opts.params
          : undefined,
      form,
      status: response.statusCode,
      body:
        typeof response.body === "string"
          ? safeJson(response.body)
          : response.body
    });
    return response;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const httpClient = new RecordingClient();

function twilioClientFor(credentials: TwilioCredentials): Twilio {
  const [username, password] =
    "authToken" in credentials
      ? [credentials.accountSid, credentials.authToken]
      : [credentials.apiKeySid, credentials.apiKeySecret];
  return new Twilio(username, password, {
    accountSid: credentials.accountSid,
    httpClient
  });
}

// The account's state, to restore and to compare at the end
const admin = twilioClientFor(CREDENTIALS.authToken);

type Snapshot = {
  number: { sid: string; trunkSid: string | null; voiceUrl: string | null };
  trunks: string[];
  acls: string[];
  credentialLists: string[];
};

async function snapshot(): Promise<Snapshot> {
  const [number] = await admin.incomingPhoneNumbers.list({
    phoneNumber: NUMBER,
    limit: 1
  });
  if (!number) throw new Error("TWILIO_TEST_NUMBER is not in the account");
  return {
    number: {
      sid: number.sid,
      trunkSid: number.trunkSid,
      voiceUrl: number.voiceUrl
    },
    trunks: (await admin.trunking.v1.trunks.list()).map((t) => t.sid).sort(),
    acls: (await admin.sip.ipAccessControlLists.list())
      .map((a) => a.sid)
      .sort(),
    credentialLists: (await admin.sip.credentialLists.list())
      .map((c) => c.sid)
      .sort()
  };
}

let before: Snapshot;

/** Puts the number back and deletes every Twilio resource made since `before`. */
async function cleanUpTwilio(label: string): Promise<string[]> {
  const deleted: string[] = [];
  const number = before.number;
  await admin
    .incomingPhoneNumbers(number.sid)
    .update(
      number.trunkSid
        ? { trunkSid: number.trunkSid }
        : { trunkSid: "", voiceUrl: number.voiceUrl ?? "" }
    );

  for (const trunk of await admin.trunking.v1.trunks.list()) {
    if (
      !before.trunks.includes(trunk.sid) &&
      trunk.domainName.startsWith(`${label}.`)
    ) {
      await admin.trunking.v1.trunks(trunk.sid).remove();
      deleted.push(`trunk ${trunk.friendlyName}`);
    }
  }
  for (const acl of await admin.sip.ipAccessControlLists.list()) {
    if (!before.acls.includes(acl.sid) && acl.friendlyName === `ACL-${label}`) {
      await admin.sip.ipAccessControlLists(acl.sid).remove();
      deleted.push(`ACL ${acl.friendlyName}`);
    }
  }
  for (const list of await admin.sip.credentialLists.list()) {
    if (
      !before.credentialLists.includes(list.sid) &&
      list.friendlyName === `CL-${label}`
    ) {
      await admin.sip.credentialLists(list.sid).remove();
      deleted.push(`credential list ${list.friendlyName}`);
    }
  }
  return deleted;
}

/** What the run has added to Twilio since `before` (for the record). */
async function leftovers(): Promise<string[]> {
  const out: string[] = [];
  for (const trunk of await admin.trunking.v1.trunks.list()) {
    if (before.trunks.includes(trunk.sid)) continue;
    const acls = await admin.trunking.v1
      .trunks(trunk.sid)
      .ipAccessControlLists.list();
    const urls = await admin.trunking.v1
      .trunks(trunk.sid)
      .originationUrls.list();
    const lists = await admin.trunking.v1
      .trunks(trunk.sid)
      .credentialsLists.list();
    out.push(
      `trunk ${trunk.friendlyName} (${trunk.domainName}): ${acls.length} ACL, ${urls.length} origination URL, ${lists.length} credential list`
    );
  }
  for (const acl of await admin.sip.ipAccessControlLists.list()) {
    if (before.acls.includes(acl.sid)) continue;
    const ips = await admin.sip
      .ipAccessControlLists(acl.sid)
      .ipAddresses.list();
    out.push(
      `ACL ${acl.friendlyName}: ${ips.map((ip) => `${ip.ipAddress}/${ip.cidrPrefixLength}`).join(", ") || "no entries"}`
    );
  }
  for (const list of await admin.sip.credentialLists.list()) {
    if (before.credentialLists.includes(list.sid)) continue;
    const creds = await admin.sip.credentialLists(list.sid).credentials.list();
    out.push(
      `credential list ${list.friendlyName}: ${creds.length} credential`
    );
  }
  const [number] = await admin.incomingPhoneNumbers.list({
    phoneNumber: NUMBER,
    limit: 1
  });
  out.push(
    `number on trunk ${number.trunkSid === before.number.trunkSid ? "unchanged (original)" : number.trunkSid ? "of this run" : "none"}`
  );
  return out;
}

// The Fonoster side: a dev stack workspace made for this run
type Fonoster = { client: SDK.Client; accessKeyId: string; ref: string };

async function devWorkspace(): Promise<Fonoster> {
  const owner = new SDK.Client({
    endpoint: DEV_ENDPOINT,
    accessKeyId: "",
    allowInsecure: true
  });
  await owner.login(devEnv.OWNER_EMAIL, devEnv.OWNER_PASSWORD);
  const workspaces = new SDK.Workspaces(owner);
  const { ref } = await workspaces.createWorkspace({
    name: "twilio-baseline-1172"
  });
  const { accessKeyId } = await workspaces.getWorkspace(ref);
  const client = new SDK.Client({
    endpoint: DEV_ENDPOINT,
    accessKeyId,
    allowInsecure: true
  });
  await client.login(devEnv.OWNER_EMAIL, devEnv.OWNER_PASSWORD);
  return { client, accessKeyId, ref };
}

async function fonosterResources(fonoster: Fonoster): Promise<string[]> {
  const numbers = await new SDK.Numbers(fonoster.client).listNumbers({
    pageSize: 100
  });
  const trunks = await new SDK.Trunks(fonoster.client).listTrunks({
    pageSize: 100
  });
  return [
    ...numbers.items.map((n) => `Fonoster number ${n.telUrl}`),
    ...trunks.items.map((t) => `Fonoster trunk ${t.name} (${t.inboundUri})`)
  ];
}

async function cleanUpFonoster(fonoster: Fonoster): Promise<void> {
  const numbers = new SDK.Numbers(fonoster.client);
  for (const n of (await numbers.listNumbers({ pageSize: 100 })).items) {
    await numbers.deleteNumber(n.ref);
  }
  const trunks = new SDK.Trunks(fonoster.client);
  for (const t of (await trunks.listTrunks({ pageSize: 100 })).items) {
    await trunks.deleteTrunk(t.ref);
  }
}

// One outcome line per run of a link
type Outcome = {
  step: string;
  variant: string;
  result: string;
  leftovers: string[];
};
const outcomes: Outcome[] = [];

function describe(error: unknown): string {
  if (error instanceof TwilioLinkError) {
    return `${error.reason} at ${error.step}: ${error.message}`;
  }
  const e = error as { status?: number; code?: number; message?: string };
  return `error${e.status ? ` ${e.status}` : ""}${e.code ? ` code ${e.code}` : ""}: ${e.message}`;
}

async function run(
  step: string,
  variant: string,
  fn: () => Promise<unknown>,
  fonoster?: Fonoster
): Promise<void> {
  current = { step, variant };
  let result: string;
  try {
    const out = await fn();
    result = `ok${out ? ` ${JSON.stringify(out)}` : ""}`;
  } catch (error) {
    result = describe(error);
  }
  current = { step, variant: "inspect" };
  const left = [
    ...(await leftovers()),
    ...(fonoster ? await fonosterResources(fonoster) : [])
  ];
  outcomes.push({ step, variant, result: anonymize(result), leftovers: left });
  console.log(`[${step}/${variant}] ${anonymize(result)}`);
}

async function cleanUp(step: string, fonoster: Fonoster): Promise<void> {
  current = { step, variant: "cleanup" };
  await cleanUpTwilio(fonoster.accessKeyId.toLowerCase());
  await cleanUpFonoster(fonoster);
}

async function main(): Promise<void> {
  current = { step: "pre", variant: "check" };
  before = await snapshot();

  const fonoster = await devWorkspace();
  const label = fonoster.accessKeyId.toLowerCase();
  const devDomain = (await fonoster.client.getCapabilities()).domain;
  const originationUriBase = `pstn.${devDomain}`;
  const aclEntries = [devEnv.HOST_IP];
  const sipCredential = () => ({
    username: `fonoster-${randomBytes(4).toString("hex")}`,
    password: `${randomBytes(12).toString("base64url")}Aa1`
  });
  SECRETS.push(devEnv.OWNER_PASSWORD);

  const old =
    (credentials: TwilioCredentials, phoneNumber = NUMBER) =>
    () =>
      linkTwilioNumberToApplication(
        twilioClientFor(credentials),
        fonoster.client,
        {
          phoneNumber,
          accessKeyId: fonoster.accessKeyId,
          aclEntries,
          originationUriBase,
          applicationRef: undefined,
          friendlyName: "twilio-baseline-1172"
        }
      );

  const link =
    (credentials: TwilioCredentials, phoneNumber = NUMBER) =>
    async () => {
      const credential = sipCredential();
      SECRETS.push(credential.password);
      const result = await provisionTwilioTrunk(
        credentials,
        {
          phoneNumber,
          label,
          originationUri: `sip:${label}.${originationUriBase}`,
          aclEntries,
          sipCredential: credential
        },
        { httpClient }
      );
      await assignTwilioNumberToTrunk(
        credentials,
        { phoneNumber, twilioTrunkSid: result.twilioTrunkSid },
        { httpClient }
      );
      return result;
    };

  try {
    // a. Auth Token, first link
    await run("a", "old", old(CREDENTIALS.authToken), fonoster);
    await cleanUp("a", fonoster);
    await run("a", "new", link(CREDENTIALS.authToken), fonoster);
    await cleanUp("a", fonoster);

    // b. The same link again: the new functions on top of what the old code left, twice
    await run("b", "old", old(CREDENTIALS.authToken), fonoster);
    await run("b", "new", link(CREDENTIALS.authToken), fonoster);
    await run("b", "new-again", link(CREDENTIALS.authToken), fonoster);
    await cleanUp("b", fonoster);

    // c. A Standard API key
    await run("c", "old", old(CREDENTIALS.standard), fonoster);
    await cleanUp("c", fonoster);
    await run("c", "new", link(CREDENTIALS.standard), fonoster);
    await cleanUp("c", fonoster);

    // d. A Restricted key with the link permissions
    console.log(
      [
        "Step d uses the Restricted key with:",
        "  Phone-numbers: active-numbers list, update",
        "  Voice: sip.ip-acls, sip.ip-acls.ip-addresses, sip.credential-lists,",
        "         sip.credential-lists.credentials (every action)",
        `  Trunking (under Voice): ${process.env.TWILIO_RESTRICTED_TRUNKING_PERMS || "none offered"}`
      ].join("\n")
    );
    await run("d", "old", old(CREDENTIALS.restricted), fonoster);
    await cleanUp("d", fonoster);
    await run("d", "new", link(CREDENTIALS.restricted), fonoster);
    await cleanUp("d", fonoster);

    // e. A Restricted key missing the trunking permissions
    await run("e", "old", old(CREDENTIALS.restrictedNoTrunk), fonoster);
    await cleanUp("e", fonoster);
    await run("e", "new", link(CREDENTIALS.restrictedNoTrunk), fonoster);
    await cleanUp("e", fonoster);

    // f. A number not in the account
    await run("f", "old", old(CREDENTIALS.authToken, NOT_IN_ACCOUNT), fonoster);
    await cleanUp("f", fonoster);
    await run(
      "f",
      "new",
      link(CREDENTIALS.authToken, NOT_IN_ACCOUNT),
      fonoster
    );
    await cleanUp("f", fonoster);

    // g. A wrong secret
    await run("g", "old", old(CREDENTIALS.wrongSecret), fonoster);
    await cleanUp("g", fonoster);
    await run("g", "new", link(CREDENTIALS.wrongSecret), fonoster);
    await cleanUp("g", fonoster);

    // i. A duplicate trunk domain: the parent owns it, the subaccount asks for it
    await run("i", "parent", link(CREDENTIALS.authToken), fonoster);
    await run("i", "subaccount", async () => {
      const sub = twilioClientFor(CREDENTIALS.subaccount);
      const trunk = await sub.trunking.v1.trunks.create({
        friendlyName: `Trunk-${label}`,
        domainName: `${label}.pstn.twilio.com`
      });
      // Not expected: Twilio gave the domain to a second account
      await sub.trunking.v1.trunks(trunk.sid).remove();
      return { created: trunk.sid };
    });
  } finally {
    // The last step runs even when an earlier one failed
    await cleanUp("cleanup", fonoster);
    await new SDK.Workspaces(fonoster.client)
      .deleteWorkspace(fonoster.ref)
      .catch(() => {});
    current = { step: "post", variant: "check" };
    const after = await snapshot();
    const restored = JSON.stringify(after) === JSON.stringify(before);
    console.log(`account back to its pre-run state: ${restored}`);
    write(restored, label);
  }
}

/**
 * The account-wide lists name every trunk, ACL and number in the account. The recording keeps
 * only the items of this run and the test number; the paging fields stay as Twilio sent them.
 */
function keepOwnItems(body: unknown, label: string): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.filter((item) => {
            const text = JSON.stringify(item);
            return (
              text.includes(label) ||
              text.includes(NUMBER) ||
              text.includes(before.number.sid)
            );
          })
        : value
    ])
  );
}

function write(restored: boolean, label: string): void {
  let jsonl =
    recording
      .map((entry) =>
        JSON.stringify({ ...entry, body: keepOwnItems(entry.body, label) })
      )
      .join("\n") + "\n";
  jsonl = anonymize(jsonl);
  for (const secret of SECRETS) {
    if (secret && jsonl.includes(secret)) {
      throw new Error("a secret reached the recording; nothing was written");
    }
  }
  writeFileSync(RECORDING, jsonl);

  const lines = [
    "# Twilio link baseline, 2026-10",
    "",
    `Recorded by \`mods/common/scripts/twilio-baseline.ts\` (#1172). Requests are in`,
    "`baseline-2026-10.jsonl`. `old` is today's `linkTwilioNumberToApplication`; `new` is",
    "`provisionTwilioTrunk` then `assignTwilioNumberToTrunk`.",
    "",
    `Label: \`${anonymize(label)}\` (a dev stack workspace made for the run).`,
    `Account back to its pre-run state at the end: **${restored ? "yes" : "NO"}**.`,
    "",
    "| Step | Run | Outcome | Left in Twilio and Fonoster before cleanup |",
    "| :--- | :--- | :--- | :--- |",
    ...outcomes.map(
      (o) =>
        `| ${o.step} | ${o.variant} | ${o.result.replace(/\|/g, "\\|")} | ${o.leftovers.join("<br>")} |`
    ),
    ""
  ];
  // The hand-written findings below the table survive a re-run
  const previous = existsSync(RECORD) ? readFileSync(RECORD, "utf8") : "";
  const findings = previous.indexOf("## Findings");
  if (findings >= 0) lines.push(previous.slice(findings));
  writeFileSync(RECORD, anonymize(lines.join("\n")));
  console.log(
    `wrote ${RECORDING} (${recording.length} requests) and ${RECORD}`
  );
}

main().catch((error) => {
  console.error(anonymize(describe(error)));
  process.exit(1);
});
