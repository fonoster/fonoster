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
 * The baseline live run of the Meta side of a WhatsApp number link (#1191). It runs the new
 * `inspectWhatsAppNumber`, `enableWhatsAppSipCalling` and `disableWhatsAppSipCalling` against a
 * real WhatsApp Business number, through a recording `fetch`, and writes:
 *
 *   test/whatsapp/fixtures/baseline-2026-10.jsonl   every request: step, variant, method, path,
 *                                                    JSON body, status and response body
 *   test/whatsapp/fixtures/baseline-2026-10.md      each step's outcome and the findings
 *
 * The last step always runs: it disables SIP calling, then posts the settings the number had
 * before the run (the prototype's SIP server) back, and compares. It never touches another number.
 *
 *   npx tsx mods/common/scripts/whatsapp-baseline.ts <credentials env file>
 *
 * The env file holds WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_WABA_ID, WHATSAPP_TOKEN_FULL
 * (whatsapp_business_management + whatsapp_business_messaging), WHATSAPP_TOKEN_MANAGEMENT_ONLY,
 * WHATSAPP_TOKEN_MESSAGING_ONLY, WHATSAPP_TOKEN_WRONG (revoked or garbage),
 * WHATSAPP_OTHER_PHONE_NUMBER_ID (one the tokens can't reach), WHATSAPP_PROTOTYPE_HOSTNAME (the
 * SIP server registered today, to restore) and FONOSTER_ACCESS_KEY_ID (the workspace whose label
 * names the hostname). Optional: WHATSAPP_BASELINE_PSTN_ROOT (default pstn.fonoster.ai).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WhatsAppCredentials } from "@fonoster/types";
import { createGraphClient } from "../src/whatsapp/createGraphClient";
import {
  disableWhatsAppSipCalling,
  enableWhatsAppSipCalling,
  inspectWhatsAppNumber,
  WhatsAppLinkError
} from "../src/whatsapp";

const ROOT = join(__dirname, "..", "..", "..");
const FIXTURES = join(__dirname, "..", "test", "whatsapp", "fixtures");
const RECORDING = join(FIXTURES, "baseline-2026-10.jsonl");
const RECORD = join(FIXTURES, "baseline-2026-10.md");

process.loadEnvFile(process.argv[2] ?? join(ROOT, ".env.whatsapp"));

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID");
const WABA_ID = env("WHATSAPP_WABA_ID");
const OTHER_PHONE_NUMBER_ID = env("WHATSAPP_OTHER_PHONE_NUMBER_ID");
const PROTOTYPE_HOSTNAME = env("WHATSAPP_PROTOTYPE_HOSTNAME");
const LABEL = env("FONOSTER_ACCESS_KEY_ID").toLowerCase();
const PSTN_ROOT = process.env.WHATSAPP_BASELINE_PSTN_ROOT ?? "pstn.fonoster.ai";

const TOKENS = {
  full: { accessToken: env("WHATSAPP_TOKEN_FULL") },
  managementOnly: { accessToken: env("WHATSAPP_TOKEN_MANAGEMENT_ONLY") },
  messagingOnly: { accessToken: env("WHATSAPP_TOKEN_MESSAGING_ONLY") },
  wrong: { accessToken: env("WHATSAPP_TOKEN_WRONG") }
} satisfies Record<string, WhatsAppCredentials>;

// Nothing below may reach the fixtures: every token, and every SIP password seen during the run
const SECRETS: string[] = Object.values(TOKENS).map((t) => t.accessToken);

// Committed fixtures name no real account: each identifier becomes a stable placeholder. The
// display number and the hostname are added once step a has read them.
const PLACEHOLDERS: [string, string][] = [
  [PHONE_NUMBER_ID, "100000000000001"],
  [OTHER_PHONE_NUMBER_ID, "100000000000002"],
  [WABA_ID, "200000000000001"],
  [PROTOTYPE_HOSTNAME, "sip.prototype.example"],
  [LABEL, "wo00000000000000000000000000000000"]
];

function anonymize(text: string): string {
  return PLACEHOLDERS.reduce(
    (out, [real, fake]) => (real ? out.split(real).join(fake) : out),
    text
  )
    .replace(/"fbtrace_id":\s*"[^"]*"/g, '"fbtrace_id": "<fbtrace>"')
    .replace(
      /"sip_user_password":\s*"[^"]*"/g,
      '"sip_user_password": "<redacted>"'
    );
}

// The recording fetch
type Entry = {
  step: string;
  variant: string;
  method: string;
  path: string;
  body?: unknown;
  status: number;
  response: unknown;
};

const recording: Entry[] = [];
let current = { step: "pre", variant: "check" };

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Collects every SIP password Meta returns, so the write guard knows them. */
function collectPasswords(body: unknown): void {
  const text = JSON.stringify(body) ?? "";
  for (const match of text.matchAll(/"sip_user_password":\s*"([^"]+)"/g)) {
    if (!SECRETS.includes(match[1])) SECRETS.push(match[1]);
  }
}

const recordingFetch: typeof globalThis.fetch = async (input, init) => {
  const response = await globalThis.fetch(input, init);
  const text = await response.text();
  const body = safeJson(text);
  collectPasswords(body);
  const url = new URL(typeof input === "string" ? input : input.toString());
  recording.push({
    ...current,
    method: (init?.method ?? "GET").toUpperCase(),
    path: `${url.pathname}${url.search}`,
    body: typeof init?.body === "string" ? safeJson(init.body) : undefined,
    status: response.status,
    response: body
  });
  return new Response(text, {
    status: response.status,
    headers: { "content-type": "application/json" }
  });
};

const options = { fetch: recordingFetch };

// Outcomes for the record
type Outcome = {
  step: string;
  variant: string;
  result: string;
  passwordChanged: string;
};
const outcomes: Outcome[] = [];
const passwords: Record<string, string> = {};

function describe(error: unknown): string {
  if (error instanceof WhatsAppLinkError) {
    return `${error.reason} at ${error.step ?? "?"}: ${error.message}`;
  }
  return `error: ${error instanceof Error ? error.message : String(error)}`;
}

async function run<T>(
  step: string,
  variant: string,
  action: () => Promise<T>,
  passwordOf?: (result: T) => string | undefined
): Promise<T | undefined> {
  current = { step, variant };
  let result = "ok";
  let value: T | undefined;
  let passwordChanged = "n/a";
  try {
    value = await action();
    const password = passwordOf?.(value);
    if (password) {
      const previous = Object.values(passwords).at(-1);
      passwordChanged =
        previous === undefined
          ? "first password seen"
          : previous === password
            ? "same as before"
            : "CHANGED";
      passwords[`${step}/${variant}`] = password;
    }
    const summary = value === undefined ? "" : summarize(value);
    result = summary ? `ok ${summary}` : "ok";
  } catch (error) {
    result = describe(error);
  }
  console.log(`${step}/${variant}: ${result} (password: ${passwordChanged})`);
  outcomes.push({ step, variant, result, passwordChanged });
  return value;
}

function summarize(value: unknown): string {
  if (!value || typeof value !== "object") return JSON.stringify(value) ?? "";
  const copy = { ...(value as Record<string, unknown>) };
  delete copy.sipPassword;
  delete copy.previousSettings;
  return JSON.stringify(copy);
}

const server = (hostname: string) => ({ hostname, port: 5061 });
const ourHostname = (digits: string) => `wa-${LABEL}-${digits}.${PSTN_ROOT}`;

async function main(): Promise<void> {
  // a. What the number looks like today, with the prototype's SIP server
  const info = await run("a", "inspect", () =>
    inspectWhatsAppNumber(
      TOKENS.full,
      { phoneNumberId: PHONE_NUMBER_ID },
      options
    )
  );
  if (!info) throw new Error("step a failed; nothing to restore from");
  PLACEHOLDERS.push(
    [info.phoneNumber, "+15555550100"],
    [info.phoneNumber.replace(/^\+/, ""), "15555550100"],
    [info.verifiedName ?? "", "Acme"]
  );
  const digits = info.phoneNumber.replace(/^\+/, "");
  const client = createGraphClient(TOKENS.full, PHONE_NUMBER_ID, options);
  current = { step: "a", variant: "settings-with-credentials" };
  const before = (await client.get(`/${PHONE_NUMBER_ID}/settings`, {
    include_sip_credentials: "true"
  })) as { calling?: Record<string, unknown> };
  const beforePassword = JSON.stringify(before).match(
    /"sip_user_password":\s*"([^"]+)"/
  )?.[1];
  if (beforePassword) passwords["a/settings"] = beforePassword;
  console.log(
    `a: tier ${info.messagingLimitTier}, SIP ${info.calling.sip.status} on ${info.calling.sip.servers.map((s) => `${s.hostname}:${s.port}`).join(", ") || "no server"}`
  );

  const enable = (
    credentials: WhatsAppCredentials,
    hostname = ourHostname(digits),
    extra: Partial<Parameters<typeof enableWhatsAppSipCalling>[1]> = {}
  ) =>
    enableWhatsAppSipCalling(
      credentials,
      {
        phoneNumberId: PHONE_NUMBER_ID,
        sipServer: server(hostname),
        srtpKeyExchange: "SDES",
        ...extra
      },
      options
    );
  const password = (r: { sipPassword: string }) => r.sipPassword;

  try {
    // b. Enable with Fonoster's hostname; does the password change?
    await run("b", "enable", () => enable(TOKENS.full), password);
    // c. The same call again: converges? password unchanged?
    await run("c", "enable-again", () => enable(TOKENS.full), password);
    // d. Probes: DTLS accepted? back to SDES; audio.additional_codecs accepted?
    await run(
      "d",
      "dtls",
      () => enable(TOKENS.full, undefined, { srtpKeyExchange: "DTLS" }),
      password
    );
    await run("d", "sdes-again", () => enable(TOKENS.full), password);
    await run(
      "d",
      "additional-codecs",
      () =>
        enable(TOKENS.full, undefined, { additionalCodecs: ["PCMU", "PCMA"] }),
      password
    );
    // e. The management-only token: proves whatsapp_business_messaging isn't needed
    await run("e", "inspect", () =>
      inspectWhatsAppNumber(
        TOKENS.managementOnly,
        { phoneNumberId: PHONE_NUMBER_ID },
        options
      )
    );
    await run("e", "enable", () => enable(TOKENS.managementOnly), password);
    // f. The messaging-only token: the refusal code and the permission Meta names
    await run("f", "inspect", () =>
      inspectWhatsAppNumber(
        TOKENS.messagingOnly,
        { phoneNumberId: PHONE_NUMBER_ID },
        options
      )
    );
    await run("f", "enable", () => enable(TOKENS.messagingOnly), password);
    // g. A wrong token: first call only
    await run("g", "inspect", () =>
      inspectWhatsAppNumber(
        TOKENS.wrong,
        { phoneNumberId: PHONE_NUMBER_ID },
        options
      )
    );
    // h. A phone number id the token can't reach
    await run("h", "inspect", () =>
      inspectWhatsAppNumber(
        TOKENS.full,
        { phoneNumberId: OTHER_PHONE_NUMBER_ID },
        options
      )
    );
    // i. Servers Meta may reject: an IP literal, then a name that doesn't resolve
    await run(
      "i",
      "ip-literal",
      () => enable(TOKENS.full, "203.0.113.10"),
      password
    );
    await run(
      "i",
      "unresolvable",
      () => enable(TOKENS.full, `wa-${LABEL}-${digits}.invalid`),
      password
    );
  } finally {
    // j. Cleanup, always: disable, then put the prototype's settings back
    await run("j", "disable", () =>
      disableWhatsAppSipCalling(
        TOKENS.full,
        { phoneNumberId: PHONE_NUMBER_ID },
        options
      )
    );
    await run("j", "restore", async () => {
      const calling = { ...(before.calling ?? {}) } as Record<string, unknown>;
      const sip = { ...((calling.sip as Record<string, unknown>) ?? {}) };
      delete sip.sip_user_password;
      sip.servers = ((sip.servers as Record<string, unknown>[]) ?? []).map(
        ({ hostname, port }) => ({ hostname, port })
      );
      calling.sip = sip;
      await client.post(`/${PHONE_NUMBER_ID}/settings`, { calling });
      return { restoredServers: sip.servers };
    });
    current = { step: "j", variant: "settings-after" };
    const after = (await client.get(`/${PHONE_NUMBER_ID}/settings`, {
      include_sip_credentials: "true"
    })) as { calling?: Record<string, unknown> };
    const afterPassword = JSON.stringify(after).match(
      /"sip_user_password":\s*"([^"]+)"/
    )?.[1];
    const sameServers =
      JSON.stringify(stripPasswords(before.calling)) ===
      JSON.stringify(stripPasswords(after.calling));
    const samePassword =
      beforePassword !== undefined && beforePassword === afterPassword;
    console.log(
      `settings restored: ${sameServers}; password back to step a's: ${samePassword}`
    );
    write(sameServers, samePassword, info.messagingLimitTier);
  }
}

function stripPasswords(calling: unknown): unknown {
  return JSON.parse(
    (JSON.stringify(calling) ?? "{}").replace(
      /"sip_user_password":\s*"[^"]*",?/g,
      ""
    )
  );
}

function write(
  restored: boolean,
  samePassword: boolean,
  tier: string | undefined
): void {
  let jsonl = recording.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
  jsonl = anonymize(jsonl);
  for (const secret of SECRETS) {
    if (secret && jsonl.includes(secret)) {
      throw new Error("a secret reached the recording; nothing was written");
    }
  }
  if (/Bearer |EAA[A-Za-z0-9]{20,}/.test(jsonl)) {
    throw new Error(
      "a token-shaped string reached the recording; nothing was written"
    );
  }
  writeFileSync(RECORDING, jsonl);

  const lines = [
    "# WhatsApp link baseline, 2026-10",
    "",
    "Recorded by `mods/common/scripts/whatsapp-baseline.ts` (#1191). Requests are in",
    "`baseline-2026-10.jsonl`: `inspectWhatsAppNumber`, `enableWhatsAppSipCalling` and",
    "`disableWhatsAppSipCalling` against the owner's WhatsApp Business number.",
    "",
    `Hostname registered: \`${anonymize(ourHostname("15555550100"))}\` (label = the owner's workspace).`,
    `Messaging tier Meta returned: \`${tier ?? "unknown"}\`.`,
    `Settings back to step a's at the end: **${restored ? "yes" : "NO"}**.`,
    `SIP password back to step a's at the end: **${samePassword ? "yes" : "NO (refresh the prototype's secrets/sip.env with npm run setup:sip)"}**.`,
    "",
    "| Step | Run | Outcome | SIP password |",
    "| :--- | :--- | :--- | :--- |",
    ...outcomes.map(
      (o) =>
        `| ${o.step} | ${o.variant} | ${o.result.replace(/\|/g, "\\|")} | ${o.passwordChanged} |`
    ),
    ""
  ];
  // The hand-written findings below the table survive a re-run
  const previous = existsSync(RECORD) ? readFileSync(RECORD, "utf8") : "";
  const findings = previous.indexOf("## Findings");
  if (findings >= 0) lines.push(previous.slice(findings));
  else {
    lines.push(
      "## Findings",
      "",
      "- Permission names Meta uses in refusals (steps f, h): _fill in from the recording_.",
      "- Does a re-POST with identical settings rotate the password (step c)? _see the table_.",
      "- What Meta's UI calls the ID and where it is shown: _fill in_.",
      "- Servers Meta rejected (step i), with the code: _fill in, or say both were accepted_.",
      ""
    );
  }
  const text = anonymize(lines.join("\n"));
  for (const secret of SECRETS) {
    if (secret && text.includes(secret)) {
      throw new Error("a secret reached the record; nothing was written");
    }
  }
  writeFileSync(RECORD, text);
  console.log(
    `wrote ${RECORDING} (${recording.length} requests) and ${RECORD}`
  );
}

main().catch((error) => {
  console.error(anonymize(describe(error)));
  process.exit(1);
});
