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
import { AudioWaveform, Plus, Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { RowActions } from "~/components/data/row-actions";
import { SecretDialog } from "~/components/data/secret-dialog";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { errorMessage, useSessionMutation, useSessionQuery } from "./api";
import { compatibleSttModels, compatibleVoices } from "./compat";
import { CreateAppDialog } from "./create-app-dialog";
import { MissingKeysWarning } from "./missing-keys";
import {
  filtersFor,
  noiseCancellingOf,
  noiseCancellingOptions
} from "./noise-cancelling";
import type {
  AudioCodec,
  Catalog,
  CatalogEntry,
  CatalogWarning,
  ListenerTrack,
  Patience,
  Protocol,
  RecordingPolicy,
  SessionApp
} from "./types";

// "Apps" are the workspace's own WebSocket servers: SDK Applications that aren't
// Autopilot. The list and detail page mirror Autopilot's (agents-list.tsx, agent-detail.tsx).
// Agents (AUTOPILOT) live under Agents; their call handling (fallback, listeners,
// recording, AMD) opens CallHandlingDrawer from the agent page.

/** Readable names for the app protocols. */
export const PROTOCOL_LABELS: Record<Protocol, string> = {
  fonoster: "Fonoster",
  twilio: "Twilio-compatible"
};
export const PROTOCOLS = [
  { value: "fonoster", label: "Fonoster (session protocol)" },
  {
    value: "twilio",
    label: "Twilio-compatible (Media Streams: Pipecat and others)"
  }
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
const NONE = "none";

export const EMPTY_CATALOG: Catalog = {
  voices: [],
  languages: [],
  sttModels: [],
  ttsModels: [],
  llmModels: [],
  providers: []
};

/** An app is any application that isn't an Autopilot agent. */
export const isApp = (app: Pick<SessionApp, "type">) =>
  app.type !== "AUTOPILOT";

export type Draft = Omit<SessionApp, "signingSecret">;
export type SetDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

export const WS_URL = /^wss?:\/\/.+/;

/** A new app before it's saved. */
export const blankApp: Draft = {
  ref: "",
  name: "",
  type: "STREAM",
  url: "",
  protocol: "fonoster",
  signingSecretHint: "",
  speech: { voice: "", language: "", sttModel: "", patience: "" },
  audio: "pcm16-16000",
  fallback: {},
  listeners: [],
  recording: "",
  amd: false
};

/** Field errors; agent mode only checks what it shows (the listeners). */
export function validateApp(
  app: Pick<Draft, "name" | "url" | "listeners">,
  mode: "app" | "agent" = "app"
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (mode === "app") {
    if (!app.name.trim()) errors.name = "Enter a name";
    if (!WS_URL.test(app.url.trim()))
      errors.url = "Must start with ws:// or wss://";
  }
  if (app.listeners.some((l) => !WS_URL.test(l.url.trim())))
    errors.listeners = "Listener URLs must start with ws:// or wss://";
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

/** /w/:ws/apps: the list, laid out like Autopilot's. /apps/new opens the create dialog. */
export function AppsList({ creating: startCreating = false }) {
  const navigate = useNavigate();
  const { workspaceRef } = useParams();
  const base = `/w/${workspaceRef}/apps`;
  const list = useSessionQuery(["apps"], (api) => api.listApps());
  const warnings = useSessionQuery(["catalog-warnings"], (api) =>
    api.listCatalogWarnings().catch(() => [])
  );
  const remove = useSessionMutation((api, ref: string) => api.deleteApp(ref), {
    success: "App deleted"
  });
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(startCreating);
  const [deleting, setDeleting] = useState<SessionApp>();

  const items = useMemo(() => (list.data ?? []).filter(isApp), [list.data]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.ref.toLowerCase().includes(q) ||
            a.url.toLowerCase().includes(q)
        )
      : items;
  }, [items, query]);

  const add = (
    <Button onClick={() => setCreating(true)}>
      <Plus aria-hidden /> Create app
    </Button>
  );

  const columns: Column<SessionApp>[] = [
    { header: "App", cell: (a) => <NameCell name={a.name} sub={a.ref} /> },
    {
      header: "URL",
      className: "w-64",
      cell: (a) => (
        <span className="block truncate font-mono text-[12px]">{a.url}</span>
      )
    },
    {
      header: "Protocol",
      className: "w-40",
      cell: (a) => (
        <Badge variant={a.protocol === "fonoster" ? "success" : "neutral"}>
          {PROTOCOL_LABELS[a.protocol]}
        </Badge>
      )
    },
    {
      header: "Voice · Language",
      className: "w-52",
      cell: (a) => (
        <MutedCell>
          {[a.speech.voice, a.speech.language].filter(Boolean).join(" · ") ||
            "—"}
        </MutedCell>
      )
    },
    {
      header: "",
      className: "w-12",
      cell: (a) => <RowActions label={a.name} onDelete={() => setDeleting(a)} />
    }
  ];

  const empty = !list.loading && !list.error && items.length === 0;

  return (
    <>
      <PageHeader
        title="Apps"
        description="Voice apps you run yourself, connected over a stream. Pipecat, your own code, or any stream client."
        actions={!list.loading && !empty && add}
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <CatalogWarnings warnings={warnings.data ?? []} />
        <MissingKeysWarning apps={items} />
        {empty ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-xl bg-brand-subtle">
              <AudioWaveform className="size-6 text-brand-text" aria-hidden />
            </span>
            <h2 className="font-display text-lg font-medium">
              Connect your first app
            </h2>
            <p className="max-w-md font-display text-sm text-muted-foreground">
              Add the WebSocket URL of your own voice server, then point a
              number at it.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {add}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search apps"
                  placeholder="Search apps"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              {!list.loading && (
                <span className="font-display text-[13px] text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "app" : "apps"}
                </span>
              )}
            </div>
            <DataTable
              label="Apps"
              columns={columns}
              rows={rows}
              rowKey={(a) => a.ref}
              onRowClick={(a) => navigate(`${base}/${a.ref}`)}
              loading={list.loading}
              error={list.error}
              onRetry={list.reload}
              empty={
                <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center font-display text-sm text-muted-foreground">
                  No apps match “{query}”.
                </p>
              }
            />
          </>
        )}
      </div>
      <CreateAppDialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open);
          if (!open && startCreating) navigate(base, { replace: true });
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined);
            remove.reset();
          }
        }}
        title={`Delete ${deleting?.name ?? "app"}?`}
        description="Numbers that point to this app stop answering until you point them elsewhere."
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.ref, {
            onSuccess: () => setDeleting(undefined)
          })
        }
      />
    </>
  );
}

/** A catalog picker, or a text box while the catalog has nothing of that kind. */
function CatalogField({
  label,
  hint,
  value,
  entries,
  placeholder,
  incompatibleHint,
  onChange
}: {
  label: string;
  hint?: string;
  value: string;
  entries: CatalogEntry[];
  placeholder: string;
  incompatibleHint?: string;
  onChange: (value: string) => void;
}) {
  const known = entries.find((e) => e.id === value);
  return (
    <Field
      label={label}
      hint={
        known?.state === "deprecated"
          ? `Deprecated${known.replacement ? `: use ${known.replacement}` : ""}. It will be retired.`
          : known?.incompatible
            ? (incompatibleHint ?? "Doesn't fit the other settings.")
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
                  e.state === "deprecated"
                    ? `${e.label} (deprecated)`
                    : e.incompatible
                      ? `${e.label} (doesn't fit)`
                      : e.label
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

/** A titled group of fields, styled like the other drawers' fieldsets. */
function Group({
  title,
  hint,
  children
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 font-display text-[13px] font-medium text-foreground">
        {title}
      </legend>
      {hint && (
        <p className="font-display text-xs text-text-secondary">{hint}</p>
      )}
      {children}
    </fieldset>
  );
}

type FieldsProps = {
  app: Draft;
  set: SetDraft;
  errors: Record<string, string>;
};

/** Name, URL, protocol and audio format. */
export function ConnectionFields({ app, set, errors }: FieldsProps) {
  return (
    <>
      <Field label="Name" error={errors.name}>
        {(p) => (
          <Input
            {...p}
            value={app.name}
            placeholder="Support bot"
            autoComplete="off"
            onChange={(e) => set("name", e.target.value)}
          />
        )}
      </Field>
      <Field
        label="URL"
        error={errors.url}
        hint="Fonoster dials this address for every call."
      >
        {(p) => (
          <Input
            {...p}
            placeholder="wss://bot.example.com/agent"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            value={app.url}
            onChange={(e) => set("url", e.target.value)}
          />
        )}
      </Field>
      <Field label="Protocol">
        {(p) => (
          <Select
            {...p}
            value={app.protocol}
            options={PROTOCOLS}
            onValueChange={(v) => set("protocol", v as Protocol)}
          />
        )}
      </Field>
      {app.protocol === "fonoster" && (
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
    </>
  );
}

/** Voice, language, speech-to-text model and patience. */
export function SpeechFields({
  app,
  set,
  catalog
}: Omit<FieldsProps, "errors"> & { catalog: Catalog }) {
  return (
    <>
      <CatalogField
        label="Voice"
        value={app.speech.voice}
        entries={compatibleVoices(
          catalog,
          app.speech.language,
          app.speech.voice
        )}
        placeholder="deepgram/aura-2-thalia-en"
        hint="A catalog id: provider/voice."
        incompatibleHint="This voice doesn't speak the selected language."
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
        entries={compatibleSttModels(
          catalog,
          app.speech.language,
          app.speech.sttModel
        )}
        incompatibleHint="This model doesn't understand the selected language."
        placeholder="deepgram/nova-3"
        onChange={(v) => set("speech", { ...app.speech, sttModel: v })}
      />
      <Field
        label="Patience"
        hint="How long Fonoster waits before deciding the caller finished."
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
    </>
  );
}

/**
 * Fallback, listeners, recording, noise cancelling and answering-machine detection. Agents set
 * noise cancelling on their Advanced tab instead, so the drawer passes `noiseCancelling: false`.
 */
export function CallHandlingFields({
  app,
  set,
  errors,
  otherApps,
  noiseCancelling = true
}: FieldsProps & { otherApps: SessionApp[]; noiseCancelling?: boolean }) {
  const listenerError = errors.listeners;
  // Noise cancelling: None or an nc provider the catalog offers (the app's filters).
  const catalog = useSessionQuery(
    ["catalog"],
    (api) => api.getCatalog(),
    noiseCancelling
  );
  const noiseCancellingChoices = noiseCancellingOptions(
    (catalog.data?.providers ?? []).filter((p) =>
      p.capabilities?.includes("nc")
    ),
    app.filters
  );
  return (
    <>
      <Group
        title="Fallback"
        hint="Used when the URL can't be reached (after about 2.5 seconds of ringing)."
      >
        <Field label="Fallback">
          {(p) => (
            <Select
              {...p}
              value={app.fallback.appRef ?? NONE}
              options={[
                { value: NONE, label: "None" },
                ...otherApps.map((a) => ({ value: a.ref, label: a.name }))
              ]}
              onValueChange={(v) =>
                set("fallback", {
                  ...app.fallback,
                  appRef: v === NONE ? undefined : v
                })
              }
            />
          )}
        </Field>
        <Field
          label="Fallback message"
          hint="Spoken before hanging up when no fallback is set."
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
      </Group>

      <Group
        title="Listeners"
        hint="Listen-only WebSocket copies of the call audio, up to 4."
      >
        {app.listeners.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              aria-label={`Listener ${i + 1} URL`}
              aria-invalid={Boolean(listenerError) && !WS_URL.test(l.url)}
              placeholder="wss://monitor.example.com"
              spellCheck={false}
              className="flex-1 font-mono"
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
            <Select
              aria-label={`Listener ${i + 1} tracks`}
              className="w-28"
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove listener ${i + 1}`}
              onClick={() =>
                set(
                  "listeners",
                  app.listeners.filter((_, j) => j !== i)
                )
              }
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {listenerError && (
          <p role="alert" className="text-xs text-destructive">
            {listenerError}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={app.listeners.length >= 4}
          onClick={() =>
            set("listeners", [...app.listeners, { url: "", tracks: "both" }])
          }
        >
          <Plus className="size-3.5" aria-hidden /> Add listener
        </Button>
      </Group>

      <Field label="Recording">
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

      {noiseCancelling && (
        <Field
          label="Noise cancelling"
          hint="Removes background noise and other voices before your app listens. Keeps one speaker: not for speakerphone or IVR."
        >
          {(p) => (
            <Select
              {...p}
              value={noiseCancellingOf(app.filters)}
              options={noiseCancellingChoices}
              onValueChange={(v) => set("filters", filtersFor(v, app.filters))}
            />
          )}
        </Field>
      )}

      <label className="flex items-center gap-3 font-display text-[13px]">
        <Switch
          checked={Boolean(app.amd)}
          onCheckedChange={(on) => set("amd", on)}
        />
        Detect answering machines
      </label>
    </>
  );
}

/** An app's signing secret, the only time it can be read (created or rotated). */
export function SigningSecretDialog({
  secret,
  onDone
}: {
  secret?: string;
  onDone: () => void;
}) {
  return (
    <SecretDialog
      title="Save your signing secret"
      description="This is the only time we'll show it. Fonoster signs every connection with it; check the signature before accepting a call."
      fields={secret ? [{ label: "Signing secret", value: secret }] : undefined}
      onDone={onDone}
    />
  );
}

/**
 * An agent's call handling (fallback, listeners, recording, AMD, and the signing secret when
 * it has its own URL) in the right-side drawer, opened from the agent's Advanced tab.
 */
export function CallHandlingDrawer({
  open,
  onOpenChange,
  appRef,
  onSaved
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appRef: string;
  onSaved?: (app: SessionApp) => void;
}) {
  const loaded = useSessionQuery(
    ["apps", appRef, "call-handling"],
    async (api) => ({
      app: await api.getApp(appRef),
      apps: await api.listApps()
    }),
    open
  );
  const app = loaded.data?.app;
  const formId = "call-handling-form";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Call handling"
        description={app?.name}
        footer={
          <>
            <span />
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={loaded.loading || !app}
              >
                Save
              </Button>
            </div>
          </>
        }
      >
        {loaded.loading || !loaded.data ? (
          loaded.error ? (
            <Alert variant="error">{loaded.error}</Alert>
          ) : (
            <div className="flex flex-col gap-4" aria-busy>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )
        ) : !app ? (
          <Alert variant="error">
            This agent doesn&apos;t exist or was deleted.
          </Alert>
        ) : (
          <CallHandlingForm
            key={appRef}
            formId={formId}
            initial={app}
            otherApps={loaded.data.apps.filter((a) => a.ref !== appRef)}
            noiseCancelling={false}
            onSaved={(saved) => onSaved?.(saved)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CallHandlingForm({
  formId,
  initial,
  otherApps,
  noiseCancelling = true,
  onSaved
}: {
  formId: string;
  initial: SessionApp;
  otherApps: SessionApp[];
  noiseCancelling?: boolean;
  onSaved: (app: SessionApp) => void;
}) {
  const [app, setApp] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSessionMutation(
    (api, draft: Omit<Draft, "signingSecretHint">) => api.saveApp(draft),
    { success: "Call handling saved" }
  );
  const set: SetDraft = (key, value) => setApp((a) => ({ ...a, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateApp(app, "agent");
    setErrors(found);
    if (Object.keys(found).length) return;
    const { signingSecretHint: _hint, ...rest } = app;
    save.mutate(rest, { onSuccess: onSaved });
  };

  return (
    <form
      id={formId}
      onSubmit={submit}
      className="flex flex-col gap-[22px]"
      noValidate
    >
      {save.error && <Alert variant="error">{errorMessage(save.error)}</Alert>}
      {app.url && (
        <Group
          title="Signing secret"
          hint="Fonoster signs every connection with this secret. Check the signature before accepting a call."
        >
          <SecretControls
            appRef={app.ref}
            hint={app.signingSecretHint}
            onRotated={(hint) => set("signingSecretHint", hint)}
          />
        </Group>
      )}
      <CallHandlingFields
        app={app}
        set={set}
        errors={errors}
        otherApps={otherApps}
        noiseCancelling={noiseCancelling}
      />
    </form>
  );
}

/** The secret's hint and Rotate: a confirmation, then the new secret in a popup, once. */
export function SecretControls({
  appRef,
  hint,
  onRotated
}: {
  appRef: string;
  hint: string;
  onRotated: (hint: string) => void;
}) {
  const rotate = useSessionMutation(
    (api, ref: string) => api.rotateSecret(ref),
    { success: "Signing secret rotated" }
  );
  const [confirming, setConfirming] = useState(false);
  const [secret, setSecret] = useState<string>();
  return (
    <>
      <p className="font-display text-xs text-muted-foreground">
        {hint ? `Current secret ends in ${hint}` : "Managed by the platform."}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setConfirming(true)}
      >
        Rotate secret
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open);
          if (!open) rotate.reset();
        }}
        title="Rotate the signing secret?"
        description="It takes effect immediately, with no overlap window: deploy the new secret to your server at the same time."
        confirmLabel="Rotate"
        pending={rotate.isPending}
        error={rotate.error}
        onConfirm={() =>
          rotate.mutate(appRef, {
            onSuccess: (result) => {
              setConfirming(false);
              setSecret(result.signingSecret);
              onRotated(result.signingSecretHint);
            }
          })
        }
      />
      <SigningSecretDialog
        secret={secret}
        onDone={() => setSecret(undefined)}
      />
    </>
  );
}
