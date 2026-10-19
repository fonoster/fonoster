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
import { partHash } from "./parts";
import { BeepSpan } from "./recording";
import { redactText } from "./redact";
import { contentHash } from "./sign";
import { RecordEntry, SealingPart, Vcon } from "./types";

/**
 * Pinned to draft-ietf-vcon-vcon-core-04 (September 2026), which requires "0.4.0" (call-record
 * open question O4).
 */
export const VCON_VERSION = "0.4.0";

type Built = {
  vcon: Vcon;
  redacted: Vcon;
  parts: SealingPart[];
  missing: string[];
};

/** The recording the recorder left for this call, as assembled at seal. */
export type BuiltRecording = {
  part: SealingPart;
  startedAt: number;
  durationMs: number;
  /**
   * Builds the recording with these spans beeped, for the redacted copy (LO-B9). Without it, or
   * when it returns nothing, the redacted copy withholds the recording.
   */
  beep?: (spans: BeepSpan[]) => SealingPart | undefined;
};

/** How the call ended, for the index and search (call-record "fetch and search ... status"). */
export type RecordStatus = "completed" | "failed" | "incomplete";

const iso = (ms: number) => new Date(ms).toISOString();

/**
 * Assembles a call's vCon from its working record: parties, the spoken dialog (caller turns and
 * what the caller heard of the agent), turn decisions, app notes, and every session message as an
 * attached part with a content hash. Lists what is missing (recording, SIP trace, hangup).
 */
export function buildVcon(
  callRef: string,
  entries: RecordEntry[],
  options: { region: string; recording?: BuiltRecording }
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
  let started: Record<string, unknown> | undefined;
  let failure: { reason: string; sipStatus?: number } | undefined;
  let recordingPolicy: string | undefined;
  let recordingFailed: string | undefined;
  let consentRequested = false;
  // When each spoken dialog entry was heard, for redaction beeps (by dialog entry).
  const heard = new Map<
    Record<string, unknown>,
    Omit<BeepSpan, "fromMs" | "toMs"> & { from: number; to: number }
  >();
  let userStartedAt: number | undefined;

  for (const e of entries) {
    const m = e.message;
    const type = m.type as string | undefined;
    if (e.source === "appbridge" && type === "session.start") {
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
    } else if (e.source === "appbridge" && type === "turn.ended") {
      const turn = {
        type: "text",
        start: iso(e.at),
        parties: [0],
        originator: 0,
        mimetype: "text/plain",
        mediatype: "text/plain",
        encoding: "none",
        body: m.text
      };
      dialog.push(turn);
      // The caller spoke from turn.user_started (or durationMs plus the end-of-turn wait before
      // turn.ended) until turn.ended.
      const spoke =
        typeof m.durationMs === "number" ? m.durationMs + 1500 : 10_000;
      heard.set(turn, {
        side: "caller",
        from: userStartedAt ?? e.at - spoke,
        to: e.at
      });
      userStartedAt = undefined;
      decisions.push({ at: iso(e.at), ...m });
    } else if (e.source === "appbridge" && type === "turn.user_started") {
      userStartedAt ??= e.at;
      decisions.push({ at: iso(e.at), ...m });
    } else if (
      e.source === "appbridge" &&
      type?.startsWith("turn.") &&
      type !== "turn.estimate"
    ) {
      decisions.push({ at: iso(e.at), ...m });
    } else if (e.source === "app" && type === "speak") {
      const id = String(m.id ?? "");
      const s = speech.get(id) ?? { text: "", party: currentApp };
      s.text += String(m.text ?? "");
      speech.set(id, s);
    } else if (e.source === "appbridge" && type === "output.started") {
      const s = speech.get(String(m.id));
      if (s) s.startedAt = e.at;
    } else if (
      e.source === "appbridge" &&
      (type === "output.done" || type === "output.interrupted")
    ) {
      const s = speech.get(String(m.id));
      if (s && s.text) {
        const interrupted = type === "output.interrupted";
        const said: Record<string, unknown> = {
          type: "text",
          start: iso(s.startedAt ?? e.at),
          parties: [s.party],
          originator: s.party,
          mimetype: "text/plain",
          mediatype: "text/plain",
          encoding: "none",
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
        };
        dialog.push(said);
        heard.set(said, { side: "agent", from: s.startedAt ?? e.at, to: e.at });
      }
    } else if (e.source === "app" && type === "record.note") {
      notes.push({ at: iso(e.at), ...(m.data as Record<string, unknown>) });
    } else if (e.source === "event" && type === "call.started") {
      started ??= m;
      startedAt = e.at;
    } else if (e.source === "event" && type === "call.failed") {
      failure ??= {
        reason: String(m.reason),
        ...(typeof m.sipStatus === "number" ? { sipStatus: m.sipStatus } : {})
      };
    } else if (e.source === "event" && type === "recording.started") {
      recordingPolicy = String(m.policy ?? "on");
    } else if (e.source === "event" && type === "recording.failed") {
      recordingFailed = String(m.reason ?? "error");
    } else if (e.source === "event" && type === "recording.consent_requested") {
      consentRequested = true;
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

  // A call that never reached an app has no session.start: its parties come from call.started
  // (minimal record, call-record "Calls that never reach an app get a minimal record").
  if (!parties.length && started) {
    parties.push(
      { tel: started.from, role: "caller" },
      { tel: started.to, role: "callee" }
    );
    if (started.appRef)
      parties.push({
        name: started.appRef,
        role: "agent",
        meta: { appRef: started.appRef }
      });
  }
  const appRefs = [...appParty.keys()];
  if (!appRefs.length && started?.appRef) appRefs.push(String(started.appRef));

  const messages = Buffer.from(
    entries.map((e) => JSON.stringify(e)).join("\n") + "\n"
  );
  const parts: SealingPart[] = [
    {
      name: "messages.ndjson",
      mimetype: "application/x-ndjson",
      data: messages
    }
  ];
  // SIP traces are not part of the first release (CR5), so they are never listed as missing.
  const missing: string[] = [];
  if (endedAt === undefined) missing.push("hangup");
  const recording = options.recording;
  if ((recordingPolicy || recordingFailed) && !recording)
    missing.push("recording");
  if (recording) {
    parts.push(recording.part);
    dialog.unshift({
      type: "recording",
      start: iso(recording.startedAt),
      duration: recording.durationMs / 1000,
      parties: [0, appParty.size ? [...appParty.values()][0] : 1],
      originator: 0,
      mimetype: recording.part.mimetype,
      mediatype: recording.part.mimetype,
      filename: recording.part.name,
      url: `parts/${recording.part.name}`,
      content_hash: partHash(recording.part),
      meta: { channels: ["caller", "agent"] }
    });
  }
  const status: RecordStatus = failure
    ? "failed"
    : endedAt === undefined
      ? "incomplete"
      : "completed";

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
    attachments: parts
      .filter((p) => p !== recording?.part)
      .map((p) => ({
        type: "session_messages",
        purpose: "session_messages",
        // draft-04 4.4: who distributed it (the first app, or the caller for a minimal record)
        // and the dialog it relates to.
        start: iso(startedAt),
        party: appParty.size ? [...appParty.values()][0] : 0,
        dialog: 0,
        mimetype: p.mimetype,
        mediatype: p.mimetype,
        url: `parts/${p.name}`,
        content_hash: partHash(p)
      })),
    fonoster: {
      callRef,
      region: options.region,
      startedAt: iso(startedAt),
      endedAt: endedAt ? iso(endedAt) : null,
      endReason: endReason ?? null,
      status,
      direction: (started?.direction as string) ?? null,
      workspaceRef: (started?.workspaceRef as string) ?? null,
      appRefs,
      ...(failure ? { failure } : {}),
      ...(recordingPolicy || recordingFailed || consentRequested
        ? {
            recording: {
              policy: recordingPolicy ?? null,
              consentRequested,
              ...(recordingFailed ? { failed: recordingFailed } : {})
            }
          }
        : {}),
      complete: !missing.includes("hangup"),
      missing,
      failures
    }
  };

  const vcon: Vcon = { ...base, uuid: randomUUID(), dialog };
  let redactions = 0;
  const spans: BeepSpan[] = [];
  let unlocatable = false;
  const redactedDialog = dialog.map((d) => {
    if (d.type === "recording") return d;
    const r = redactText(String(d.body ?? ""));
    redactions += r.redactions;
    const full = (d.meta as { fullText?: string } | undefined)?.fullText;
    const span = heard.get(d);
    if (recording && (r.redactions || (full && redactText(full).redactions))) {
      const fromMs = span ? span.from - recording.startedAt : NaN;
      const toMs = span ? span.to - recording.startedAt : NaN;
      // A span that is not inside the recording cannot be beeped: withhold instead.
      if (!(toMs > 0 && fromMs < recording.durationMs && toMs > fromMs))
        unlocatable = true;
      else spans.push({ side: span!.side, fromMs: Math.max(0, fromMs), toMs });
    }
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
  // Redacted words are beeped in the recording the redacted copy references (LO-B9): the whole
  // turn that carried them, since there are no word timings yet (O3). Without a beeped copy the
  // redacted copy does not reference the recording at all.
  const beeped =
    redactions && recording && spans.length && !unlocatable
      ? recording.beep?.(spans)
      : undefined;
  if (beeped) parts.push(beeped);
  const redacted: Vcon = {
    ...base,
    uuid: randomUUID(),
    dialog: !redactions
      ? redactedDialog
      : beeped
        ? redactedDialog.map((d) =>
            d.type === "recording"
              ? {
                  ...d,
                  filename: beeped.name,
                  url: `parts/${beeped.name}`,
                  content_hash: partHash(beeped),
                  meta: {
                    ...(d.meta as object),
                    redacted: { method: "beep", spans: spans.length }
                  }
                }
              : d
          )
        : redactedDialog.filter((d) => d.type !== "recording"),
    // Turn decisions carry the caller's words and app notes are free-form: every string in the
    // analysis is redacted too.
    analysis: base.analysis.map(
      (a) => redactStrings(a) as Record<string, unknown>
    ),
    // The redacted copy does not carry the raw messages, which contain the unredacted text.
    attachments: [],
    redacted: {
      uuid: vcon.uuid,
      type: "pii",
      content_hash: contentHash(Buffer.from(JSON.stringify(vcon)))
    },
    fonoster: {
      ...base.fonoster,
      redactions,
      ...(redactions && recording && !beeped
        ? { recordingWithheld: "redaction" }
        : {})
    }
  };
  return { vcon, redacted, parts, missing };
}

/** Redacts every string inside a JSON value (for the redacted copy's analysis). */
export function redactStrings(value: unknown): unknown {
  if (typeof value === "string") return redactText(value).text;
  if (Array.isArray(value)) return value.map(redactStrings);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, redactStrings(v)])
    );
  return value;
}
