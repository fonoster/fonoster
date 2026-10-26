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
import type {
  Application,
  CatalogItem,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@fonoster/types";
import { mergeUpdate } from "~/lib/app-request";
import type { FonosterSdk } from "~/lib/client";
import type {
  AppNumber,
  AudioCodec,
  CallRecord,
  CallRecordSummary,
  Catalog,
  CatalogEntry,
  SessionApi,
  SessionApp,
  SessionMessage,
  Turn
} from "./types";

// The SessionApi over the SDK: Applications, Providers and Webhooks (gRPC-Web) and CallRecords
// (the HTTP records API). Maps the API's shapes to the pages' (./types.ts).

const AUDIO: AudioCodec[] = [
  "pcm16-8000",
  "pcm16-16000",
  "pcm16-24000",
  "pcmu-8000"
];
const MAX_PAGES = 10;

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

function audioOf(audio?: { codec?: string; rate?: number }): AudioCodec {
  const id = `${audio?.codec}-${audio?.rate}` as AudioCodec;
  return AUDIO.includes(id) ? id : "pcm16-16000";
}

export function toSessionApp(app: Application): SessionApp {
  const speech = (app.speech ?? {}) as Raw;
  const config = app.intelligence?.config;
  return {
    ref: app.ref,
    name: app.name,
    type: String(app.type) === "AUTOPILOT" ? "AUTOPILOT" : "STREAM",
    url: app.url ?? "",
    protocol: app.protocol === "twilio" ? "twilio" : "fonoster",
    signingSecretHint: app.signingSecretHint ?? "",
    speech: {
      voice: str(speech.voice),
      language: str(speech.language),
      sttModel: str(speech.sttModel) || undefined,
      patience: (str(speech.patience) || "") as SessionApp["speech"]["patience"]
    },
    audio: audioOf(app.audio),
    fallback: {
      appRef: app.fallbackAppRef || undefined,
      message: app.fallbackMessage || undefined
    },
    listeners: (app.listeners ?? []).map((l) => ({
      url: l.url,
      tracks: l.tracks ?? "both"
    })),
    recording: (app.recording ?? "") as SessionApp["recording"],
    amd: app.amd?.enabled === true,
    ...(app.amd?.enabled && app.amd.windowMs
      ? { amdWindowMs: app.amd.windowMs }
      : {}),
    filters: (app.filters ?? []).map((f) => ({
      name: f.name,
      ...(f.options && Object.keys(f.options).length
        ? { options: f.options }
        : {})
    })),
    ...(config ? { agent: config as Record<string, unknown> } : {})
  };
}

export function toRequest(
  app: Omit<SessionApp, "signingSecretHint" | "signingSecret">
): CreateApplicationRequest {
  const [codec, rate] = app.audio.split("-");
  const autopilot = app.type === "AUTOPILOT";
  return {
    name: app.name.trim(),
    // @fonoster/types is CommonJS: no runtime enum imports in the browser.
    type: app.type as CreateApplicationRequest["type"],
    url: app.url.trim() || undefined,
    protocol: autopilot ? "fonoster" : app.protocol,
    speech: {
      voice: app.speech.voice || undefined,
      language: app.speech.language || undefined,
      sttModel: app.speech.sttModel || undefined,
      patience: app.speech.patience || undefined
    },
    audio:
      app.protocol === "fonoster"
        ? { codec: codec as "pcm16" | "pcmu", rate: Number(rate) }
        : undefined,
    fallbackAppRef: app.fallback.appRef || undefined,
    fallbackMessage: app.fallback.message?.trim() || undefined,
    listeners: app.listeners
      .filter((l) => l.url.trim())
      .map((l) => ({ url: l.url.trim(), tracks: l.tracks })),
    recording: app.recording || undefined,
    filters: app.filters ?? [],
    amd: app.amd
      ? {
          enabled: true,
          ...(app.amdWindowMs ? { windowMs: app.amdWindowMs } : {})
        }
      : undefined,
    ...(autopilot && app.agent ? { intelligence: { config: app.agent } } : {})
  };
}

/**
 * The update for a drawer save. The API replaces every column, so it starts from the app as saved
 * now and overlays what the drawer edits. The drawer doesn't edit the agent (the agent page
 * does) or the TTS model and silence timeout, so those stay as saved; the audio format stays as
 * saved unless it was changed (the drawer shows a default when the app has none).
 */
export function toUpdateRequest(
  current: Application,
  request: CreateApplicationRequest,
  app: Pick<SessionApp, "audio">
): UpdateApplicationRequest {
  const { intelligence: _assistant, ...edits } = request;
  if (app.audio === audioOf(current.audio)) delete edits.audio;
  return mergeUpdate(current, edits);
}

const entry = (item: CatalogItem): CatalogEntry => ({
  id: item.id,
  label: item.label || item.id,
  state: item.state === "deprecated" ? "deprecated" : "active",
  ...(item.replacement ? { replacement: item.replacement } : {}),
  ...(item.languages?.length ? { languages: item.languages } : {}),
  ...(item.features?.length ? { features: item.features } : {}),
  ...(item.models?.length ? { models: item.models } : {}),
  ...(item.keyless ? { keyless: true } : {}),
  ...(item.capabilities?.length ? { capabilities: item.capabilities } : {})
});

/** The catalog as the pickers need it; languages come from models and voices. */
export function toCatalog(items: CatalogItem[]): Catalog {
  const languages = new Set<string>();
  for (const i of items) for (const l of i.languages ?? []) languages.add(l);
  return {
    voices: items.filter((i) => i.kind === "voice").map(entry),
    sttModels: items
      .filter((i) => i.kind === "model" && i.type === "stt")
      .map(entry),
    ttsModels: items
      .filter((i) => i.kind === "model" && i.type === "tts")
      .map(entry),
    llmModels: items
      .filter((i) => i.kind === "model" && i.type === "llm")
      .map(entry),
    providers: items
      .filter((i) => i.kind === "provider")
      // Every catalog entry carries its own label ("Deepgram", "Fakes").
      .map((i) => ({ ...entry(i), label: i.label || i.id })),
    languages: [...languages]
      .sort()
      .map((id) => ({ id, label: id, state: "active" as const }))
  };
}

type Summary = {
  callRef: string;
  appRef: string | null;
  from: string | null;
  to: string | null;
  direction: string | null;
  status: string;
  startedAt: string;
  durationSeconds: number;
  version: number;
  endReason?: string | null;
  failureReason?: string | null;
  sipStatus?: number | null;
  amdStatus?: string | null;
};

const toSummary = (r: Summary): CallRecordSummary => ({
  callRef: r.callRef,
  appRef: r.appRef ?? "",
  from: r.from ?? "",
  to: r.to ?? "",
  direction: r.direction ?? "",
  startedAt: r.startedAt,
  durationMs: (r.durationSeconds ?? 0) * 1000,
  status: r.status,
  version: r.version,
  ...(r.endReason ? { endReason: r.endReason } : {}),
  ...(r.failureReason ? { failureReason: r.failureReason } : {}),
  ...(typeof r.sipStatus === "number" ? { sipStatus: r.sipStatus } : {}),
  ...(r.amdStatus ? { amdStatus: r.amdStatus } : {})
});

/** Turns, decisions and warnings from a record's vCon (add-call-record "The record contains"). */
export function fromVcon(
  summary: CallRecordSummary,
  detail: {
    endedAt?: string | null;
    endReason?: string | null;
    redacted?: boolean;
    vcon: Raw;
  }
): CallRecord {
  const vcon = detail.vcon;
  const meta = (vcon.fonoster ?? {}) as Raw;
  const start = Date.parse(str(meta.startedAt) || summary.startedAt);
  const offset = (iso: unknown) => Math.max(0, Date.parse(str(iso)) - start);
  const dialog = (vcon.dialog ?? []) as Raw[];
  const analysis = (vcon.analysis ?? []) as Raw[];
  const decisions = (
    (analysis.find((a) => a.type === "turn_decisions")?.body ?? []) as Raw[]
  ).filter((d) => typeof d.type === "string");
  const notes = (analysis.find((a) => a.type === "app_notes")?.body ??
    []) as Raw[];

  const turns: Turn[] = dialog
    .filter((d) => d.type === "text")
    .map((d, index) => {
      const caller = d.originator === 0;
      const at = offset(d.start);
      // vCon dialog duration in seconds; records sealed before it was written have none.
      const end =
        typeof d.duration === "number"
          ? at + Math.round(d.duration * 1000)
          : at;
      const m = (d.meta ?? {}) as Raw;
      const heard = typeof m.heardMs === "number" ? m.heardMs : undefined;
      // The caller's turn ends where its turn.ended decision was made.
      const decision = caller
        ? decisions.find(
            (x) => x.type === "turn.ended" && Math.abs(offset(x.at) - end) < 5
          )
        : undefined;
      return {
        index,
        side: caller ? "caller" : "agent",
        text: str(d.body),
        startMs: at,
        endMs: end,
        outcome: caller
          ? decision?.abandoned
            ? "abandoned"
            : "ok"
          : m.interrupted
            ? "interrupted"
            : undefined,
        ...(heard !== undefined ? { heardMs: heard } : {})
      } as Turn;
    });
  // An agent turn that follows a caller turn answered it: the gap is the response time. Turns
  // that overlap (the caller still talking) are not an answer.
  turns.forEach((t, i) => {
    const before = turns[i - 1];
    if (
      t.side === "agent" &&
      before?.side === "caller" &&
      t.startMs >= before.endMs
    )
      t.firstAudioMs = t.startMs - before.endMs;
  });
  // Autopilot's turn note for an answer comes after the caller's turn.ended and before the next one;
  // when it has the stage timings, the answer's wait is split into them.
  const turnNotes = notes.filter(
    (n) =>
      n.kind === "autopilot.turn" &&
      typeof n.llmMs === "number" &&
      typeof n.ttsMs === "number"
  );
  turns.forEach((t, i) => {
    if (t.firstAudioMs === undefined) return;
    const asked = turns[i - 1].endMs;
    const next = turns.slice(i + 1).find((x) => x.side === "caller");
    const note = turnNotes.find((n) => {
      const at = offset(n.at);
      return at >= asked && (!next || at < next.endMs);
    });
    if (note)
      t.stages = { llmMs: note.llmMs as number, ttsMs: note.ttsMs as number };
  });
  // Autopilot writes one autopilot.turn note per turn, with the tools it called.
  const toolCalls = notes
    .filter((n) => n.kind === "autopilot.turn" && Array.isArray(n.toolCalls))
    .flatMap((n) =>
      (n.toolCalls as Raw[]).map((c) => ({
        at: offset(n.at),
        name: str(c.name),
        ok: c.ok !== false
      }))
    );
  const usage = (Array.isArray(meta.usage) ? (meta.usage as Raw[]) : [])
    .filter(
      (l) => typeof l.meter === "string" && typeof l.quantity === "number"
    )
    .map((l) => ({
      meter: str(l.meter),
      quantity: l.quantity as number,
      ...(l.provider ? { provider: str(l.provider) } : {}),
      ...(l.model ? { model: str(l.model) } : {})
    }));
  const messages: SessionMessage[] = [
    ...decisions.map((d) => {
      const { at, ...message } = d;
      return {
        at: offset(at),
        source: "appbridge" as const,
        message: message as SessionMessage["message"]
      };
    }),
    ...notes.map((n) => {
      const { at, ...data } = n;
      return {
        at: offset(at),
        source: "app" as const,
        message: { type: "record.note", ...data }
      };
    })
  ].sort((a, b) => a.at - b.at);
  // Failed audio filters get their own badge with the reason, not a bare "Problem" line.
  const unfiltered = ((meta.filters as Raw | undefined)?.failed ?? []) as {
    name?: string;
    reason: string;
  }[];
  const warnings = [
    ...((meta.missing ?? []) as string[]).map((m) => `Missing: ${m}`),
    ...((meta.failures ?? []) as string[])
      .filter((f) => !(unfiltered.length && f === "filter.failed"))
      .map((f) => `Problem: ${f}`)
  ];
  const recording = dialog.find((d) => d.type === "recording" && d.url);
  const amd = meta.amd as Raw | undefined;
  const failure = meta.failure as
    | { reason?: unknown; sipStatus?: unknown }
    | undefined;
  return {
    ...summary,
    endedAt: detail.endedAt ?? str(meta.endedAt),
    endReason: detail.endReason ?? str(meta.endReason),
    redacted: detail.redacted ?? true,
    turns,
    messages,
    warnings,
    ...(unfiltered.length ? { unfiltered } : {}),
    ...(failure?.reason
      ? {
          failure: {
            reason: str(failure.reason),
            ...(typeof failure.sipStatus === "number"
              ? { sipStatus: failure.sipStatus }
              : {})
          }
        }
      : {}),
    ...(recording
      ? { recording: { sha256: str(recording.content_hash) } }
      : {}),
    ...(amd && typeof amd.status === "string"
      ? {
          amd: {
            status: amd.status,
            at: offset(amd.at),
            ...(typeof amd.confidence === "number"
              ? { confidence: amd.confidence }
              : {}),
            ...(typeof amd.audioMs === "number" ? { audioMs: amd.audioMs } : {})
          }
        }
      : {}),
    toolCalls,
    usage,
    vcon
  };
}

const seconds = (d?: Date) => (d ? d.toISOString() : undefined);

export function createSdkSessionApi(sdk: FonosterSdk): SessionApi {
  const listAll = async () => {
    const items: Application[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await sdk.applications.listApplications({
        pageSize: 100,
        pageToken
      });
      items.push(...(res.items ?? []));
      pageToken = res.nextPageToken || undefined;
      if (!pageToken) break;
    }
    return items;
  };
  const getApp = async (ref: string) => {
    try {
      return toSessionApp(await sdk.applications.getApplication(ref));
    } catch (e) {
      if ((e as { code?: number }).code === 5) return undefined;
      throw e;
    }
  };

  return {
    listApps: async () => (await listAll()).map(toSessionApp),
    getApp,
    saveApp: async (app) => {
      const request = toRequest(app);
      if (app.ref) {
        const current = await sdk.applications.getApplication(app.ref);
        await sdk.applications.updateApplication(
          toUpdateRequest(current, request, app)
        );
        return (await getApp(app.ref))!;
      }
      const created = await sdk.applications.createApplication(request);
      const saved = (await getApp(created.ref))!;
      return { ...saved, signingSecret: created.signingSecret || undefined };
    },
    rotateSecret: async (ref) => {
      const rotated = await sdk.applications.rotateSigningSecret(ref);
      const app = (await getApp(ref))!;
      return { ...app, signingSecret: rotated.signingSecret };
    },
    deleteApp: async (ref) => {
      await sdk.applications.deleteApplication(ref);
    },
    getCatalog: async () =>
      toCatalog((await sdk.providers.listCatalog()).items),
    listCatalogWarnings: async () =>
      (await sdk.providers.listWarnings()).items.map((w) => ({
        ...w,
        usedBy: w.usedBy.map((u) => ({
          ...u,
          kind: u.kind as "app" | "agent"
        }))
      })),
    listNumbers: async () => {
      const items: AppNumber[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const res = await sdk.numbers.listNumbers({ pageSize: 100, pageToken });
        items.push(
          ...(res.items ?? []).map((n) => ({
            ref: n.ref,
            telUrl: n.telUrl,
            appRef: n.appRef,
            trunkName: n.trunk?.name
          }))
        );
        pageToken = res.nextPageToken || undefined;
        if (!pageToken) break;
      }
      return items;
    },
    listCalls: async (filter = {}) => {
      const page = await sdk.callRecords.listRecords({
        pageSize: 50,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.after ? { after: filter.after } : {}),
        ...(filter.appRef ? { appRef: filter.appRef } : {}),
        ...(filter.direction ? { direction: filter.direction } : {}),
        ...(filter.pageToken ? { pageToken: filter.pageToken } : {})
      });
      return {
        items: (page.items as unknown as Summary[]).map(toSummary),
        nextPageToken: page.nextPageToken || undefined
      };
    },
    getCall: async (callRef) => {
      try {
        const detail = await sdk.callRecords.getRecord(callRef);
        return fromVcon(toSummary(detail as unknown as Summary), detail);
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 404) return undefined;
        if (status === 410) return "erased";
        throw e;
      }
    },
    recordingUrl: async (callRef) => {
      const { data, contentType } = await sdk.callRecords.getRecording(callRef);
      return URL.createObjectURL(new Blob([data], { type: contentType }));
    },
    listWebhooks: async () =>
      (await sdk.webhooks.listWebhooks({ pageSize: 200 })).items.map((w) => ({
        ref: w.ref,
        url: w.url,
        events: w.events,
        secretHint: w.secretHint,
        previousSecretUntil: seconds(w.previousSecretUntil),
        createdAt: seconds(w.createdAt)
      })),
    createWebhook: (input) => sdk.webhooks.createWebhook(input),
    updateWebhook: async (input) => {
      await sdk.webhooks.updateWebhook(input);
    },
    deleteWebhook: async (ref) => {
      await sdk.webhooks.deleteWebhook(ref);
    },
    rotateWebhookSecret: async (ref) => ({
      secret: (await sdk.webhooks.rotateWebhookSecret(ref)).secret
    }),
    listDeliveries: async (webhookRef) =>
      (
        await sdk.webhooks.listWebhookDeliveries({ webhookRef, pageSize: 100 })
      ).items.map((d) => ({ ...d, createdAt: seconds(d.createdAt) })),
    resendDelivery: async (ref) => {
      const d = await sdk.webhooks.resendWebhookDelivery(ref);
      return { ...d, createdAt: seconds(d.createdAt) };
    },
    listVendorKeys: async () =>
      (await sdk.providers.listProviderKeys()).items.map((k) => ({
        providerId: k.providerId,
        updatedAt: seconds(k.updatedAt)
      })),
    setVendorKey: async (providerId, key) => {
      await sdk.providers.setProviderKey({ providerId, key });
    },
    deleteVendorKey: async (providerId) => {
      await sdk.providers.deleteProviderKey(providerId);
    }
  };
}
