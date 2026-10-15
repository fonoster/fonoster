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
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { CopyField } from "~/components/data/copy-field";
import { useAsync, useSessionApi } from "./api";
import type { AudioCodec, Flavor, ListenerTrack, SessionApp } from "./types";

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
const RECORDING = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
  { value: "consent", label: "On after consent prompt" }
];

export function validateApp(
  app: Pick<SessionApp, "ref" | "url">
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(app.ref))
    errors.ref = "Use lowercase letters, numbers and dashes";
  if (!/^wss?:\/\/.+/.test(app.url))
    errors.url = "Must start with ws:// or wss://";
  return errors;
}

export function SessionAppsList() {
  const api = useSessionApi();
  const { data, loading } = useAsync(() => api.listApps(), [api]);
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-medium">
          Apps (session protocol preview)
        </h1>
        <Button asChild>
          <Link to="new">New app</Link>
        </Button>
      </div>
      {loading && <p>Loading…</p>}
      <ul className="flex flex-col gap-2">
        {data?.map((a) => (
          <li key={a.ref}>
            <Link
              to={a.ref}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <span>
                <strong>{a.name}</strong>
                <span className="block text-xs text-muted-foreground">
                  {a.url}
                </span>
              </span>
              <Badge variant={a.flavor === "native" ? "success" : "info"}>
                {a.flavor}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const blank: Omit<SessionApp, "signingSecretHint"> = {
  ref: "",
  name: "",
  url: "",
  flavor: "native",
  speech: { voice: "", language: "" },
  audio: "pcm16-16000",
  fallback: {},
  listeners: [],
  recording: "off"
};

export function SessionAppEditor() {
  const { ref } = useParams();
  const api = useSessionApi();
  const navigate = useNavigate();
  const isNew = !ref || ref === "new";
  const loaded = useAsync(
    async () => ({
      app: isNew ? undefined : await api.getApp(ref),
      catalog: await api.getCatalog(),
      apps: await api.listApps()
    }),
    [api, ref]
  );
  if (loaded.loading) return <p className="p-6">Loading…</p>;
  if (!isNew && !loaded.data?.app)
    return <Alert variant="error">App not found</Alert>;
  return (
    <Editor
      key={ref}
      initial={loaded.data?.app ?? { ...blank, signingSecretHint: "" }}
      isNew={isNew}
      catalog={loaded.data!.catalog}
      otherApps={(loaded.data!.apps ?? []).filter((a) => a.ref !== ref)}
      onSaved={(secret) => {
        if (!secret) navigate("..", { relative: "path" });
      }}
    />
  );
}

function Editor({
  initial,
  isNew,
  catalog,
  otherApps,
  onSaved
}: {
  initial: SessionApp;
  isNew: boolean;
  catalog: Awaited<ReturnType<ReturnType<typeof useSessionApi>["getCatalog"]>>;
  otherApps: SessionApp[];
  onSaved: (shownSecret?: string) => void;
}) {
  const api = useSessionApi();
  const [app, setApp] = useState<SessionApp>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState<string>();
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof SessionApp>(key: K, value: SessionApp[K]) =>
    setApp((a) => ({ ...a, [key]: value }));
  const deprecated = (id: string) =>
    [...catalog.voices, ...catalog.languages].find((e) => e.id === id)
      ?.state === "deprecated";

  const save = async () => {
    const found = validateApp(app);
    setErrors(found);
    if (Object.keys(found).length) return;
    const result = await api.saveApp(app);
    setSaved(true);
    if (result.signingSecret) setSecret(result.signingSecret);
    onSaved(result.signingSecret);
  };
  const rotate = async () => {
    const result = await api.rotateSecret(app.ref);
    setSecret(result.signingSecret);
    set("signingSecretHint", result.signingSecretHint);
    setConfirmRotate(false);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5 p-6">
      <h1 className="font-display text-lg font-medium">
        {isNew ? "New app" : app.name}
      </h1>
      <Field label="Ref" error={errors.ref}>
        {(p) => (
          <Input
            {...p}
            value={app.ref}
            disabled={!isNew}
            onChange={(e) => set("ref", e.target.value)}
          />
        )}
      </Field>
      <Field label="Name">
        {(p) => (
          <Input
            {...p}
            value={app.name}
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
            value={app.url}
            onChange={(e) => set("url", e.target.value)}
          />
        )}
      </Field>
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
      {app.flavor === "native" && (
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

      <section
        aria-label="Signing secret"
        className="flex flex-col gap-3 rounded-xl border border-border p-4"
      >
        <h2 className="text-sm font-medium">Signing secret</h2>
        {secret ? (
          <>
            <CopyField label="Signing secret (shown once)" value={secret} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Stored hint: {app.signingSecretHint || "created when you save"}
          </p>
        )}
        {!isNew &&
          (confirmRotate ? (
            <Alert variant="warning">
              Rotating takes effect immediately and there is no overlap window:
              deploy the new secret to your app at the same time.
              <Button
                size="sm"
                variant="destructive"
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
            </Alert>
          ) : (
            <Button variant="outline" onClick={() => setConfirmRotate(true)}>
              Rotate secret
            </Button>
          ))}
      </section>

      <section
        aria-label="Speech defaults"
        className="flex flex-col gap-3 rounded-xl border border-border p-4"
      >
        <h2 className="text-sm font-medium">Speech defaults</h2>
        <Field label="Voice (catalog id)">
          {(p) => (
            <Select
              {...p}
              value={app.speech.voice}
              options={catalog.voices.map((v) => ({
                value: v.id,
                label: v.label,
                description: v.id
              }))}
              onValueChange={(v) => set("speech", { ...app.speech, voice: v })}
            />
          )}
        </Field>
        <Field label="Language (catalog id)">
          {(p) => (
            <Select
              {...p}
              value={app.speech.language}
              options={catalog.languages.map((v) => ({
                value: v.id,
                label: v.label,
                description: v.id
              }))}
              onValueChange={(v) =>
                set("speech", { ...app.speech, language: v })
              }
            />
          )}
        </Field>
        {(deprecated(app.speech.voice) || deprecated(app.speech.language)) && (
          <Alert variant="warning">
            This catalog id is deprecated and will be retired.
          </Alert>
        )}
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
            value={app.recording}
            options={RECORDING}
            onValueChange={(v) =>
              set("recording", v as SessionApp["recording"])
            }
          />
        )}
      </Field>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked disabled aria-label="Verify signatures" /> The gateway
        always signs connection requests; verify them in your app.
      </label>
      <div className="flex gap-2">
        <Button onClick={() => void save()}>
          {isNew ? "Create app" : "Save changes"}
        </Button>
        {saved && <span role="status">Saved</span>}
      </div>
    </div>
  );
}
