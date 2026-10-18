#!/usr/bin/env node
// Provider health collector (spike, phase 1: collect only).
//
// Asks each third-party vendor how much runway is left and prints ONE JSON snapshot to stdout.
// A provider without credentials in the environment is reported as "skipped", never as a failure.
// No alerting yet: once a few weeks of snapshots exist we can pick thresholds from real data.
//
//   ELEVENLABS_API_KEY                     characters used / limit + reset date
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN  prepaid balance
//   DEEPGRAM_API_KEY                       project balances
//   OPENAI_ADMIN_KEY                       last 30 days of spend (OpenAI has no balance API)
//   GROQ_API_KEY                           key validity + rate limits (Groq has no balance API)

const TIMEOUT_MS = 15_000;

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return { body: await res.json(), headers: res.headers };
}

const providers = {
  async elevenlabs() {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return null;
    const { body } = await getJson("https://api.elevenlabs.io/v1/user/subscription", {
      "xi-api-key": key
    });
    return {
      tier: body.tier,
      status: body.status,
      used: body.character_count,
      limit: body.character_limit,
      remaining: body.character_limit - body.character_count,
      resetsAt: body.next_character_count_reset_unix
        ? new Date(body.next_character_count_reset_unix * 1000).toISOString()
        : null
    };
  },

  async twilio() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const { body } = await getJson(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`,
      { Authorization: `Basic ${auth}` }
    );
    return { balance: Number(body.balance), currency: body.currency };
  },

  async deepgram() {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) return null;
    const headers = { Authorization: `Token ${key}` };
    const { body: projects } = await getJson("https://api.deepgram.com/v1/projects", headers);
    const balances = [];
    for (const p of projects.projects ?? []) {
      const { body } = await getJson(
        `https://api.deepgram.com/v1/projects/${p.project_id}/balances`,
        headers
      );
      for (const b of body.balances ?? []) {
        balances.push({ project: p.name, amount: b.amount, units: b.units });
      }
    }
    return { balances };
  },

  async openai() {
    const key = process.env.OPENAI_ADMIN_KEY;
    if (!key) return null;
    const start = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
    const { body } = await getJson(
      `https://api.openai.com/v1/organization/costs?start_time=${start}&bucket_width=1d&limit=31`,
      { Authorization: `Bearer ${key}` }
    );
    let spent30d = 0;
    for (const bucket of body.data ?? []) {
      for (const r of bucket.results ?? []) spent30d += Number(r.amount?.value ?? 0);
    }
    return { spent30d: Number(spent30d.toFixed(4)), currency: "usd", balance: "not exposed by API" };
  },

  async groq() {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    const { headers } = await getJson("https://api.groq.com/openai/v1/models", {
      Authorization: `Bearer ${key}`
    });
    return {
      keyValid: true,
      balance: "not exposed by API",
      rateLimitRemaining: headers.get("x-ratelimit-remaining-requests")
    };
  }
};

const results = {};
await Promise.all(
  Object.entries(providers).map(async ([name, fn]) => {
    try {
      const data = await fn();
      results[name] = data === null ? { status: "skipped" } : { status: "ok", ...data };
    } catch (err) {
      results[name] = { status: "error", error: err.message };
    }
  })
);

console.log(JSON.stringify({ collectedAt: new Date().toISOString(), providers: results }, null, 2));
// Exit non-zero only when a configured provider failed, so a broken key is visible in CI.
process.exit(Object.values(results).some((r) => r.status === "error") ? 1 : 0);
