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
import { randomUUID } from "crypto";
import { redactText } from "./redact";
import { contentHash } from "./sign";
import { Part, RecordEntry, Vcon } from "./types";

/**
 * Pinned to draft-ietf-vcon-vcon-core-04 (September 2026), which requires "0.4.0" (call-record
 * open question O4).
 */
export const VCON_VERSION = "0.4.0";

type Built = { vcon: Vcon; redacted: Vcon; parts: Part[]; missing: string[] };

const iso = (ms: number) => new Date(ms).toISOString();

/**
 * Assembles a call's vCon from its working record: parties, the spoken dialog (caller turns and
 * what the caller heard of the agent), turn decisions, app notes, and every session message as an
 * attached part with a content hash. Lists what is missing (recording, SIP trace, hangup).
 */
export function buildVcon(
  callRef: string,
  entries: RecordEntry[],
  options: { region: string }
): Built {
  const parties: Record<string, unknown>[] = [];
  const dialog: Record<string, unknown>[] = [];
  const decisions: Record<string, unknown>[] = [];
  const notes: Record<string, unknown>[] = [];
  const appParty = new Map<string, number>();
  const speech = new Map<
    string,
    { text: string; party: number; startedAt?: number }
  >();
  let currentApp = -1;
  let startedAt = entries[0]?.at ?? Date.now();
  let endedAt: number | undefined;
  let endReason: string | undefined;
  const failures: string[] = [];

  for (const e of entries) {
    const m = e.message;
    const type = m.type as string | undefined;
    if (e.source === "gateway" && type === "session.start") {
      if (!parties.length) {
        startedAt = e.at;
        parties.push(
          { tel: m.from, role: "caller" },
          { tel: m.to, role: "callee" }
        );
      }
      const appRef = String(m.appRef);
      if (!appParty.has(appRef))
        appParty.set(
          appRef,
          parties.push({ name: appRef, role: "agent", meta: { appRef } }) - 1
        );
      currentApp = appParty.get(appRef)!;
    } else if (e.source === "gateway" && type === "turn.ended") {
      dialog.push({
        type: "text",
        start: iso(e.at),
        parties: [0],
        originator: 0,
        mimetype: "text/plain",
        body: m.text
      });
      decisions.push({ at: iso(e.at), ...m });
    } else if (
      e.source === "gateway" &&
      type?.startsWith("turn.") &&
      type !== "turn.estimate"
    ) {
      decisions.push({ at: iso(e.at), ...m });
    } else if (e.source === "app" && type === "speak") {
      const id = String(m.id ?? "");
      const s = speech.get(id) ?? { text: "", party: currentApp };
      s.text += String(m.text ?? "");
      speech.set(id, s);
    } else if (e.source === "gateway" && type === "output.started") {
      const s = speech.get(String(m.id));
      if (s) s.startedAt = e.at;
    } else if (
      e.source === "gateway" &&
      (type === "output.done" || type === "output.interrupted")
    ) {
      const s = speech.get(String(m.id));
      if (s && s.text) {
        const interrupted = type === "output.interrupted";
        dialog.push({
          type: "text",
          start: iso(s.startedAt ?? e.at),
          parties: [s.party],
          originator: s.party,
          mimetype: "text/plain",
          body: interrupted ? String(m.heardText ?? "") : s.text,
          ...(interrupted
            ? {
                meta: {
                  interrupted: true,
                  fullText: s.text,
                  heardMs: m.heardMs
                }
              }
            : {})
        });
      }
    } else if (e.source === "app" && type === "record.note") {
      notes.push({ at: iso(e.at), ...(m.data as Record<string, unknown>) });
    } else if (e.source === "event" && type === "call.ended") {
      endedAt = e.at;
      endReason = String(m.reason);
    } else if (
      e.source === "event" &&
      (type === "app.unreachable" ||
        type === "filter.failed" ||
        type === "app.dropped")
    ) {
      failures.push(type);
    }
  }

  const messages = Buffer.from(
    entries.map((e) => JSON.stringify(e)).join("\n") + "\n"
  );
  const parts: Part[] = [
    {
      name: "messages.ndjson",
      mimetype: "application/x-ndjson",
      data: messages
    }
  ];
  const missing = ["recording", "sip_trace"];
  if (endedAt === undefined) missing.push("hangup");

  const base = {
    vcon: VCON_VERSION,
    created_at: iso(endedAt ?? Date.now()),
    updated_at: iso(endedAt ?? Date.now()),
    subject: `call ${callRef}`,
    parties,
    analysis: [
      {
        type: "turn_decisions",
        vendor: "fonoster",
        encoding: "json",
        body: decisions
      },
      ...(notes.length
        ? [
            {
              type: "app_notes",
              vendor: "fonoster",
              encoding: "json",
              body: notes
            }
          ]
        : [])
    ],
    attachments: parts.map((p) => ({
      type: "session_messages",
      mimetype: p.mimetype,
      url: `parts/${p.name}`,
      content_hash: contentHash(p.data)
    })),
    fonoster: {
      callRef,
      region: options.region,
      startedAt: iso(startedAt),
      endedAt: endedAt ? iso(endedAt) : null,
      endReason: endReason ?? null,
      complete:
        missing.filter((m) => m !== "recording" && m !== "sip_trace").length ===
        0,
      missing,
      failures
    }
  };

  const vcon: Vcon = { ...base, uuid: randomUUID(), dialog };
  let redactions = 0;
  const redactedDialog = dialog.map((d) => {
    const r = redactText(String(d.body ?? ""));
    redactions += r.redactions;
    const { meta, ...rest } = d as Record<string, unknown> & {
      meta?: Record<string, unknown>;
    };
    const fullText = meta?.fullText
      ? redactText(String(meta.fullText)).text
      : undefined;
    return {
      ...rest,
      body: r.text,
      ...(meta ? { meta: { ...meta, ...(fullText ? { fullText } : {}) } } : {})
    };
  });
  const redacted: Vcon = {
    ...base,
    uuid: randomUUID(),
    dialog: redactedDialog,
    // The redacted copy does not carry the raw messages, which contain the unredacted text.
    attachments: [],
    redacted: {
      uuid: vcon.uuid,
      type: "pii",
      content_hash: contentHash(Buffer.from(JSON.stringify(vcon)))
    },
    fonoster: { ...base.fonoster, redactions }
  };
  return { vcon, redacted, parts, missing };
}
