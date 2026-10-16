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
import { Braces, Plus, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
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
import { RowActions } from "~/components/data/row-actions";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "~/components/ui/sonner";
import { Switch } from "~/components/ui/switch";
import { errorMessage, useAsync, useSessionApi } from "./api";
import { compatibleSttModels, compatibleVoices } from "./compat";
import { MissingKeysWarning } from "./missing-keys";
import type {
  AudioCodec,
  Catalog,
  CatalogEntry,
  CatalogWarning,
  Protocol,
  ListenerTrack,
  Patience,
  RecordingPolicy,
  SessionApp
} from "./types";

// "Streams" are the workspace's own WebSocket servers: SDK Applications that aren't
// Autopilot. Agents (AUTOPILOT) live under Agents; their call handling (fallback,
// listeners, recording, AMD) opens this drawer in "agent" mode from the agent page.

/** Readable names for the stream protocols. */
export const PROTOCOL_LABELS: Record<Protocol, string> = {
  fonoster: "Fonoster",
  twilio: "Twilio-compatible"
};
const PROTOCOLS = [
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

const EMPTY_CATALOG: Catalog = {
  voices: [],
  languages: [],
  sttModels: [],
  ttsModels: [],
  llmModels: [],
  providers: []
};

/** A stream is any application that isn't an Autopilot agent. */
export const isStream = (app: Pick<SessionApp, "type">) =>
  app.type !== "AUTOPILOT";

type Draft = Omit<SessionApp, "signingSecret">;

const WS_URL = /^wss?:\/\/.+/;

/** Field errors; agent mode only checks what it shows (the listeners). */
export function validateStream(
  app: Pick<Draft, "name" | "url" | "listeners">,
  mode: "stream" | "agent" = "stream"
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (mode === "stream") {
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

/** /w/:ws/streams and /w/:ws/streams/:ref (the drawer open on a stream; "new" adds one). */
export function StreamsList() {
  const api = useSessionApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceRef, ref: openRef } = useParams();
  const base = `/w/${workspaceRef}/streams`;
  const { data, loading, error, reload } = useAsync(
    async () => (await api.listApps()).filter(isStream),
    [api]
  );
  const warnings = useAsync(
    () => api.listCatalogWarnings().catch(() => []),
    [api]
  );
  const [deleting, setDeleting] = useState<SessionApp | undefined>();
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const open = (ref: string) => navigate(`${base}/${ref}`);
  const close = () => navigate(base);
  const secret = (location.state as { secret?: string } | null)?.secret;

  const add = (
    <Button onClick={() => open("new")}>
      <Plus aria-hidden /> Add stream
    </Button>
  );
  const columns: Column<SessionApp>[] = [
    { header: "Name", cell: (a) => <NameCell name={a.name} sub={a.url} /> },
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
      header: "Voice",
      className: "w-56",
      cell: (a) => <MutedCell>{a.speech.voice || "default"}</MutedCell>
    },
    {
      header: "Secret",
      className: "w-24",
      cell: (a) => <MutedCell>{a.signingSecretHint}</MutedCell>
    },
    {
      header: "",
      className: "w-14",
      cell: (a) => (
        <RowActions
          label={a.name}
          onEdit={() => open(a.ref)}
          onDelete={() => setDeleting(a)}
        />
      )
    }
  ];
  return (
    <>
      <PageHeader
        title="Streams"
        description="Your own WebSocket servers that numbers can stream calls to."
        actions={(data?.length ?? 0) > 0 && add}
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <CatalogWarnings warnings={warnings.data ?? []} />
        <MissingKeysWarning apps={data ?? []} />
        <DataTable
          label="Streams"
          columns={columns}
          rows={data ?? []}
          rowKey={(a) => a.ref}
          onRowClick={(a) => open(a.ref)}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={
            <EmptyState
              icon={Braces}
              title="No streams yet"
              description="Add the WebSocket URL of your own voice server, then point a number at it."
              action={add}
            />
          }
        />
      </div>
      <StreamDrawer
        open={Boolean(openRef)}
        onOpenChange={(next) => !next && close()}
        streamRef={openRef === "new" ? undefined : openRef}
        secret={secret}
        onSaved={(saved, created) => {
          reload();
          if (created)
            navigate(`${base}/${saved.ref}`, {
              replace: true,
              state: { secret: saved.signingSecret }
            });
          else close();
        }}
        onDelete={(app) => {
          close();
          setDeleting(app);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) {
            setDeleting(undefined);
            setDeleteError(undefined);
          }
        }}
        title={`Delete ${deleting?.name ?? "stream"}?`}
        description="Numbers that point to this stream stop answering until you point them elsewhere."
        pending={deletePending}
        error={deleteError}
        onConfirm={() => {
          if (!deleting) return;
          setDeletePending(true);
          setDeleteError(undefined);
          api.deleteApp(deleting.ref).then(
            () => {
              setDeletePending(false);
              setDeleting(undefined);
              toast.success("Stream deleted");
              reload();
            },
            (e: unknown) => {
              setDeletePending(false);
              setDeleteError(errorMessage(e));
            }
          );
        }}
      />
    </>
  );
}

const blank: Draft = {
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

/**
 * Add or edit a stream in the right-side drawer. In "agent" mode it edits only an agent's
 * call handling (signing secret when it has its own URL, fallback, listeners, recording,
 * AMD); everything else about an agent is on the agent page.
 */
export function StreamDrawer({
  open,
  onOpenChange,
  streamRef,
  mode = "stream",
  secret,
  onSaved,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The application to edit; adds a new stream when absent. */
  streamRef?: string;
  mode?: "stream" | "agent";
  /** A new stream's signing secret, shown once. */
  secret?: string;
  onSaved?: (app: SessionApp, created: boolean) => void;
  onDelete?: (app: SessionApp) => void;
}) {
  const api = useSessionApi();
  const { workspaceRef } = useParams();
  const isNew = !streamRef;
  const loaded = useAsync(
    async () =>
      open
        ? {
            app: streamRef ? await api.getApp(streamRef) : undefined,
            catalog: await api.getCatalog().catch(() => EMPTY_CATALOG),
            apps: await api.listApps()
          }
        : undefined,
    [api, open, streamRef]
  );
  const agent = mode === "agent";
  const app = loaded.data?.app;
  const title = agent
    ? "Call handling"
    : isNew
      ? "Add stream"
      : (app?.name ?? "Stream");
  const description = agent
    ? app?.name
    : isNew
      ? "The gateway dials this WebSocket URL for every call."
      : streamRef;
  const formId = "stream-form";
  const ready = !loaded.loading && loaded.data && (isNew || app);

  // An agent opened as a stream (e.g. an old /apps/:ref link): it's edited under Agents.
  if (!agent && app && !isStream(app))
    return <Navigate to={`/w/${workspaceRef}/agents/${app.ref}`} replace />;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={title}
        description={description}
        footer={
          <>
            {!isNew && !agent && app && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(app)}
              >
                Delete stream
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form={formId} disabled={!ready}>
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
        ) : !isNew && !app ? (
          <Alert variant="error">
            This {agent ? "agent" : "stream"} doesn&apos;t exist or was deleted.
          </Alert>
        ) : (
          <StreamForm
            key={streamRef ?? "new"}
            formId={formId}
            initial={app ?? blank}
            savedApp={app}
            isNew={isNew}
            mode={mode}
            catalog={loaded.data.catalog}
            otherApps={loaded.data.apps.filter((a) => a.ref !== streamRef)}
            secret={secret}
            onSaved={(saved) => onSaved?.(saved, isNew)}
          />
        )}
      </SheetContent>
    </Sheet>
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

function StreamForm({
  formId,
  initial,
  savedApp,
  isNew,
  mode,
  catalog,
  otherApps,
  secret: initialSecret,
  onSaved
}: {
  formId: string;
  initial: Draft;
  /** The app as saved (missing-key warnings are about saved settings). */
  savedApp?: SessionApp;
  isNew: boolean;
  mode: "stream" | "agent";
  catalog: Catalog;
  otherApps: SessionApp[];
  secret?: string;
  onSaved: (app: SessionApp) => void;
}) {
  const api = useSessionApi();
  const agent = mode === "agent";
  const [app, setApp] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState(initialSecret);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setApp((a) => ({ ...a, [key]: value }));

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

  const save = (event: FormEvent) => {
    event.preventDefault();
    const found = validateStream(app, mode);
    setErrors(found);
    if (Object.keys(found).length) return;
    const { signingSecretHint: _hint, ...rest } = app;
    void run(async () => {
      const result = await api.saveApp(rest);
      toast.success(
        agent ? "Call handling saved" : isNew ? "Stream added" : "Stream saved"
      );
      onSaved(result);
    });
  };
  const rotate = () =>
    run(async () => {
      const result = await api.rotateSecret(app.ref);
      setSecret(result.signingSecret);
      set("signingSecretHint", result.signingSecretHint);
      setConfirmRotate(false);
    });

  const listenerError = errors.listeners;

  return (
    <form
      id={formId}
      onSubmit={save}
      className="flex flex-col gap-[22px]"
      noValidate
    >
      {failure && <Alert variant="error">{failure}</Alert>}
      {savedApp && !agent && <MissingKeysWarning apps={[savedApp]} />}

      {!agent && (
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
            hint="The gateway dials this address for every call."
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
      )}

      {(!agent || app.url) && (
        <Group
          title="Signing secret"
          hint="The gateway signs every connection with this secret. Check the signature before accepting a call."
        >
          {secret ? (
            <>
              <CopyField label="Signing secret (shown once)" value={secret} />
              <Alert variant="warning">
                Copy it now. It is not shown again.
              </Alert>
            </>
          ) : (
            <p className="font-display text-xs text-muted-foreground">
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
                window: deploy the new secret to your server at the same time.
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void rotate()}
                  >
                    Rotate now
                  </Button>
                  <Button
                    type="button"
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
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setConfirmRotate(true)}
              >
                Rotate secret
              </Button>
            ))}
        </Group>
      )}

      {!agent && (
        <Group title="Speech defaults">
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
        </Group>
      )}

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

      <label className="flex items-center gap-3 font-display text-[13px]">
        <Switch
          checked={Boolean(app.amd)}
          onCheckedChange={(on) => set("amd", on)}
        />
        Detect answering machines
      </label>
    </form>
  );
}
