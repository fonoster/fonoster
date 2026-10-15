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
import { Braces, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { CopyField } from "~/components/data/copy-field";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { errorMessage, useAsync, useSessionApi } from "./api";
import type {
  AppType,
  AudioCodec,
  Catalog,
  CatalogEntry,
  CatalogWarning,
  Flavor,
  ListenerTrack,
  Patience,
  RecordingPolicy,
  SessionApp
} from "./types";

const TYPES = [
  { value: "EXTERNAL", label: "Your app (WebSocket URL)" },
  { value: "AUTOPILOT", label: "Autopilot (hosted AI agent)" }
];
const FLAVORS = [
  { value: "native", label: "Native (fonoster.session.v1)" },
  { value: "twilio", label: "Twilio Media Streams (Pipecat and others)" }
];
const AUDIO = [
  { value: "pcm16-8000", label: "PCM16 8 kHz" },
  { value: "pcm16-16000", label: "PCM16 16 kHz (default)" },
  { value: "pcm16-24000", label: "PCM16 24 kHz" },
  { value: "pcmu-8000", label: "PCMU 8 kHz" }
];
const TRACKS = [
  { value: "inbound", label: "Caller" },
  { value: "outbound", label: "Agent" },
  { value: "both", label: "Both" }
];
/** Select values can't be empty: "inherit" and "default" stand for "". */
const RECORDING = [
  { value: "inherit", label: "Workspace default" },
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
  { value: "consent", label: "On after consent prompt" }
];
const PATIENCE = [
  { value: "default", label: "Normal (default)" },
  { value: "low", label: "Low: answer quickly" },
  { value: "high", label: "High: wait for pauses" }
];

const ASSISTANT_EXAMPLE = {
  conversationSettings: {
    firstMessage: "Hi, thanks for calling. How can I help?",
    systemPrompt: "You are a friendly receptionist.",
    goodbyeMessage: "Thanks for calling. Goodbye!",
    systemErrorMessage: "Sorry, something went wrong. Please call again."
  },
  languageModel: { model: "openai/gpt-4o-mini" }
};

type Draft = Omit<SessionApp, "signingSecretHint" | "signingSecret"> & {
  signingSecretHint: string;
  /** The assistant as edited (JSON text). */
  assistantText: string;
};

export function validateApp(
  app: Pick<Draft, "name" | "type" | "url" | "listeners" | "assistantText">
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!app.name.trim()) errors.name = "Give the app a name";
  const autopilot = app.type === "AUTOPILOT";
  if (!(autopilot && !app.url.trim()) && !/^wss?:\/\/.+/.test(app.url.trim()))
    errors.url = "Must start with ws:// or wss://";
  if (app.listeners.some((l) => !/^wss?:\/\/.+/.test(l.url.trim())))
    errors.listeners = "Listener URLs must start with ws:// or wss://";
  if (autopilot) {
    try {
      const parsed = JSON.parse(app.assistantText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        errors.assistant = "The assistant must be a JSON object";
    } catch {
      errors.assistant = "Not valid JSON";
    }
  }
  return errors;
}

/** One warning: what changed, what to use instead, and where this workspace uses it. */
function warningText(w: CatalogWarning) {
  const what = `${w.kind} ${w.id}`;
  const instead = w.replacement ? ` Use ${w.replacement} instead.` : "";
  const status =
    w.state === "retired"
      ? `The ${what} is retired and no replacement fits these settings; pick a new ${w.kind === "voice" ? "voice" : "model or voice"}.`
      : `The ${what} is deprecated${w.retireOn ? ` and will be retired on ${w.retireOn}` : ""}.${instead}`;
  const saved = w.usedBy.map(
    (u) =>
      `${u.name}${u.voice && u.voice !== w.id ? ` (voice ${u.voice})` : ""}`
  );
  const runtime = w.runtimeApps.filter(
    (a) => !w.usedBy.some((u) => u.ref === a)
  );
  return { status, saved, runtime };
}

/** Deprecated or retired catalog items this workspace uses (add-provider-registry 4.2). */
export function CatalogWarnings({ warnings }: { warnings: CatalogWarning[] }) {
  if (!warnings.length) return null;
  return (
    <div className="flex flex-col gap-2" aria-label="Catalog warnings">
      {warnings.map((w) => {
        const t = warningText(w);
        return (
          <Alert
            key={w.id}
            variant={w.state === "retired" ? "error" : "warning"}
          >
            <p>{t.status}</p>
            {t.saved.length > 0 && <p>Used by: {t.saved.join(", ")}.</p>}
            {t.runtime.length > 0 && (
              <p>
                Calls of {t.runtime.join(", ")} used it in the last days (
                {w.runtimeSessions} sessions).
              </p>
            )}
          </Alert>
        );
      })}
    </div>
  );
}

export function AppsList() {
  const api = useSessionApi();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(
    () => api.listApps(),
    [api]
  );
  const warnings = useAsync(
    () => api.listCatalogWarnings().catch(() => []),
    [api]
  );
  const add = (
    <Button asChild>
      <Link to="new">
        <Plus aria-hidden /> New app
      </Link>
    </Button>
  );
  const columns: Column<SessionApp>[] = [
    { header: "Name", cell: (a) => <NameCell name={a.name} sub={a.url} /> },
    {
      header: "Type",
      className: "w-32",
      cell: (a) =>
        a.type === "AUTOPILOT" ? (
          <Badge variant="info">Autopilot</Badge>
        ) : (
          <Badge variant={a.flavor === "native" ? "success" : "neutral"}>
            {a.flavor}
          </Badge>
        )
    },
    {
      header: "Voice",
      className: "w-56",
      cell: (a) => <MutedCell>{a.speech.voice || "default"}</MutedCell>
    },
    {
      header: "Secret",
      className: "w-24",
      cell: (a) => <MutedCell>{a.signingSecretHint}</MutedCell>
    }
  ];
  return (
    <>
      <PageHeader
        title="Apps"
        description="An app is a WebSocket URL, a flavor and speech defaults. Numbers point to apps; Autopilot apps run on the hosted Autopilot."
        actions={(data?.length ?? 0) > 0 && add}
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <CatalogWarnings warnings={warnings.data ?? []} />
        <DataTable
          label="Apps"
          columns={columns}
          rows={data ?? []}
          rowKey={(a) => a.ref}
          onRowClick={(a) => navigate(a.ref)}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={
            <EmptyState
              icon={Braces}
              title="No apps yet"
              description="Create an app for your own WebSocket server (native or Twilio flavor) or an Autopilot agent."
              action={add}
            />
          }
        />
      </div>
    </>
  );
}

const blank: Draft = {
  ref: "",
  name: "",
  type: "EXTERNAL",
  url: "",
  flavor: "native",
  signingSecretHint: "",
  speech: { voice: "", language: "", sttModel: "", patience: "" },
  audio: "pcm16-16000",
  fallback: {},
  listeners: [],
  recording: "",
  assistantText: JSON.stringify(ASSISTANT_EXAMPLE, null, 2)
};

const toDraft = (app: SessionApp): Draft => ({
  ...app,
  assistantText: app.assistant
    ? JSON.stringify(app.assistant, null, 2)
    : blank.assistantText
});

export function AppEditor() {
  const { ref } = useParams();
  const api = useSessionApi();
  const isNew = !ref || ref === "new";
  const loaded = useAsync(
    async () => ({
      app: isNew ? undefined : await api.getApp(ref),
      catalog: await api.getCatalog().catch(
        (): Catalog => ({
          voices: [],
          languages: [],
          sttModels: [],
          providers: []
        })
      ),
      apps: await api.listApps()
    }),
    [api, ref]
  );
  if (loaded.loading) return <p className="p-8">Loading…</p>;
  if (loaded.error)
    return (
      <Alert variant="error" className="m-8">
        {loaded.error}
      </Alert>
    );
  if (!isNew && !loaded.data?.app)
    return (
      <Alert variant="error" className="m-8">
        App not found
      </Alert>
    );
  return (
    <Editor
      key={ref}
      initial={loaded.data?.app ? toDraft(loaded.data.app) : blank}
      isNew={isNew}
      catalog={loaded.data!.catalog}
      otherApps={(loaded.data!.apps ?? []).filter((a) => a.ref !== ref)}
    />
  );
}

/** A catalog picker, or a text box while the catalog has nothing of that kind. */
function CatalogField({
  label,
  hint,
  value,
  entries,
  placeholder,
  onChange
}: {
  label: string;
  hint?: string;
  value: string;
  entries: CatalogEntry[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const known = entries.find((e) => e.id === value);
  return (
    <Field
      label={label}
      hint={
        known?.state === "deprecated"
          ? `Deprecated${known.replacement ? `: use ${known.replacement}` : ""}. It will be retired.`
          : hint
      }
    >
      {(p) =>
        entries.length ? (
          <Select
            {...p}
            value={value || "default"}
            options={[
              { value: "default", label: "Platform default" },
              ...entries.map((e) => ({
                value: e.id,
                label:
                  e.state === "deprecated" ? `${e.label} (deprecated)` : e.label
              }))
            ]}
            onValueChange={(v) => onChange(v === "default" ? "" : v)}
          />
        ) : (
          <Input
            {...p}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  );
}

function Editor({
  initial,
  isNew,
  catalog,
  otherApps
}: {
  initial: Draft;
  isNew: boolean;
  catalog: Catalog;
  otherApps: SessionApp[];
}) {
  const api = useSessionApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [app, setApp] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState<string | undefined>(
    (location.state as { secret?: string } | null)?.secret
  );
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setSaved(false);
    setApp((a) => ({ ...a, [key]: value }));
  };
  const autopilot = app.type === "AUTOPILOT";

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setFailure(undefined);
    try {
      await work();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const found = validateApp(app);
    setErrors(found);
    if (Object.keys(found).length) return;
    const { assistantText, signingSecretHint: _hint, ...rest } = app;
    void run(async () => {
      const result = await api.saveApp({
        ...rest,
        assistant: autopilot ? JSON.parse(assistantText) : undefined
      });
      if (isNew) {
        navigate(`../${result.ref}`, {
          relative: "path",
          replace: true,
          state: { secret: result.signingSecret }
        });
        return;
      }
      setApp(toDraft(result));
      setSaved(true);
    });
  };
  const rotate = () =>
    run(async () => {
      const result = await api.rotateSecret(app.ref);
      setSecret(result.signingSecret);
      set("signingSecretHint", result.signingSecretHint);
      setConfirmRotate(false);
    });

  return (
    <>
      <PageHeader
        title={isNew ? "New app" : app.name}
        description={
          isNew ? "The gateway dials your app's URL for every call." : app.ref
        }
        actions={
          <Button asChild variant="ghost">
            <Link to=".." relative="path">
              All apps
            </Link>
          </Button>
        }
      />
      <div className="flex max-w-2xl flex-col gap-5 px-4 pb-10 sm:px-8">
        <Field label="Name" error={errors.name}>
          {(p) => (
            <Input
              {...p}
              value={app.name}
              onChange={(e) => set("name", e.target.value)}
            />
          )}
        </Field>
        <Field label="Type">
          {(p) => (
            <Select
              {...p}
              value={app.type}
              options={TYPES}
              disabled={!isNew}
              onValueChange={(v) => set("type", v as AppType)}
            />
          )}
        </Field>
        <Field
          label={autopilot ? "URL (optional)" : "URL"}
          error={errors.url}
          hint={
            autopilot
              ? "Leave empty to use the hosted Autopilot."
              : "The gateway dials this address for every call."
          }
        >
          {(p) => (
            <Input
              {...p}
              placeholder={
                autopilot ? "Hosted Autopilot" : "wss://bot.example.com/agent"
              }
              value={app.url}
              onChange={(e) => set("url", e.target.value)}
            />
          )}
        </Field>
        {!autopilot && (
          <Field label="Flavor">
            {(p) => (
              <Select
                {...p}
                value={app.flavor}
                options={FLAVORS}
                onValueChange={(v) => set("flavor", v as Flavor)}
              />
            )}
          </Field>
        )}
        {app.flavor === "native" && !autopilot && (
          <Field label="Audio format">
            {(p) => (
              <Select
                {...p}
                value={app.audio}
                options={AUDIO}
                onValueChange={(v) => set("audio", v as AudioCodec)}
              />
            )}
          </Field>
        )}

        {autopilot && (
          <Field
            label="Assistant (JSON)"
            error={errors.assistant}
            hint="Conversation settings and a language model catalog id (provider/model). Vendor keys come from Vendor keys, not from here."
          >
            {(p) => (
              <Textarea
                {...p}
                rows={14}
                className="font-mono text-xs"
                value={app.assistantText}
                onChange={(e) => set("assistantText", e.target.value)}
              />
            )}
          </Field>
        )}

        <section
          aria-label="Signing secret"
          className="flex flex-col gap-3 rounded-xl border border-border p-4"
        >
          <h2 className="text-sm font-medium">Signing secret</h2>
          <p className="text-xs text-muted-foreground">
            The gateway signs every connection to your app with this secret;
            verify the signature before accepting a session.
          </p>
          {secret ? (
            <>
              <CopyField label="Signing secret (shown once)" value={secret} />
              <Alert variant="warning">
                Copy it now. It is not shown again.
              </Alert>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {app.signingSecretHint
                ? `Current secret ends in ${app.signingSecretHint}`
                : isNew
                  ? "Created when you save."
                  : "Managed by the platform."}
            </p>
          )}
          {!isNew &&
            (confirmRotate ? (
              <Alert variant="warning">
                Rotating takes effect immediately and there is no overlap
                window: deploy the new secret to your app at the same time.
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void rotate()}
                  >
                    Rotate now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRotate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Alert>
            ) : (
              <Button
                variant="outline"
                className="self-start"
                onClick={() => setConfirmRotate(true)}
              >
                Rotate secret
              </Button>
            ))}
        </section>

        <section
          aria-label="Speech defaults"
          className="flex flex-col gap-3 rounded-xl border border-border p-4"
        >
          <h2 className="text-sm font-medium">Speech defaults</h2>
          <CatalogField
            label="Voice"
            value={app.speech.voice}
            entries={catalog.voices}
            placeholder="deepgram/aura-2-thalia-en"
            hint="A catalog id: provider/voice."
            onChange={(v) => set("speech", { ...app.speech, voice: v })}
          />
          <CatalogField
            label="Language"
            value={app.speech.language}
            entries={catalog.languages}
            placeholder="en-US"
            onChange={(v) => set("speech", { ...app.speech, language: v })}
          />
          <CatalogField
            label="Speech-to-text model"
            value={app.speech.sttModel ?? ""}
            entries={catalog.sttModels}
            placeholder="deepgram/nova-3"
            onChange={(v) => set("speech", { ...app.speech, sttModel: v })}
          />
          <Field
            label="Patience"
            hint="How long the gateway waits before deciding the caller finished."
          >
            {(p) => (
              <Select
                {...p}
                value={app.speech.patience || "default"}
                options={PATIENCE}
                onValueChange={(v) =>
                  set("speech", {
                    ...app.speech,
                    patience: (v === "default" ? "" : v) as Patience
                  })
                }
              />
            )}
          </Field>
        </section>

        <section
          aria-label="Fallback"
          className="flex flex-col gap-3 rounded-xl border border-border p-4"
        >
          <h2 className="text-sm font-medium">Fallback</h2>
          <p className="text-xs text-muted-foreground">
            Used when the URL cannot be reached (after about 2.5 seconds of
            ringing).
          </p>
          <Field label="Fallback app">
            {(p) => (
              <Select
                {...p}
                value={app.fallback.appRef ?? "none"}
                options={[
                  { value: "none", label: "None" },
                  ...otherApps.map((a) => ({ value: a.ref, label: a.name }))
                ]}
                onValueChange={(v) =>
                  set("fallback", {
                    ...app.fallback,
                    appRef: v === "none" ? undefined : v
                  })
                }
              />
            )}
          </Field>
          <Field
            label="Fallback message"
            hint="Spoken before hanging up when no fallback app is set."
          >
            {(p) => (
              <Input
                {...p}
                value={app.fallback.message ?? ""}
                onChange={(e) =>
                  set("fallback", {
                    ...app.fallback,
                    message: e.target.value || undefined
                  })
                }
              />
            )}
          </Field>
        </section>

        <section
          aria-label="Listeners"
          className="flex flex-col gap-3 rounded-xl border border-border p-4"
        >
          <h2 className="text-sm font-medium">
            Listeners (listen-only, up to 4)
          </h2>
          {errors.listeners && (
            <p role="alert" className="text-xs text-destructive">
              {errors.listeners}
            </p>
          )}
          {app.listeners.map((l, i) => (
            <div key={i} className="flex items-end gap-2">
              <Field label={`Listener ${i + 1} URL`} className="flex-1">
                {(p) => (
                  <Input
                    {...p}
                    value={l.url}
                    onChange={(e) =>
                      set(
                        "listeners",
                        app.listeners.map((x, j) =>
                          j === i ? { ...x, url: e.target.value } : x
                        )
                      )
                    }
                  />
                )}
              </Field>
              <Field label="Tracks" className="w-32">
                {(p) => (
                  <Select
                    {...p}
                    value={l.tracks}
                    options={TRACKS}
                    onValueChange={(v) =>
                      set(
                        "listeners",
                        app.listeners.map((x, j) =>
                          j === i ? { ...x, tracks: v as ListenerTrack } : x
                        )
                      )
                    }
                  />
                )}
              </Field>
              <Button
                variant="ghost"
                aria-label={`Remove listener ${i + 1}`}
                onClick={() =>
                  set(
                    "listeners",
                    app.listeners.filter((_, j) => j !== i)
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="self-start"
            disabled={app.listeners.length >= 4}
            onClick={() =>
              set("listeners", [...app.listeners, { url: "", tracks: "both" }])
            }
          >
            Add listener
          </Button>
        </section>

        <Field label="Recording policy">
          {(p) => (
            <Select
              {...p}
              value={app.recording || "inherit"}
              options={RECORDING}
              onValueChange={(v) =>
                set("recording", (v === "inherit" ? "" : v) as RecordingPolicy)
              }
            />
          )}
        </Field>

        {failure && <Alert variant="error">{failure}</Alert>}
        <div className="flex items-center gap-2">
          <Button disabled={busy} onClick={save}>
            {isNew ? "Create app" : "Save changes"}
          </Button>
          {saved && <span role="status">Saved</span>}
          {!isNew && (
            <Button
              variant="ghost"
              className="ml-auto text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete app
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${app.name}?`}
        description="Numbers that point to this app stop answering until you point them elsewhere."
        pending={busy}
        error={failure}
        onConfirm={() =>
          void run(async () => {
            await api.deleteApp(app.ref);
            navigate("..", { relative: "path" });
          })
        }
      />
    </>
  );
}
