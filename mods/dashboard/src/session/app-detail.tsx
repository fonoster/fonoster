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
import { ArrowLeft, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { Panel } from "~/agents/parts";
import { RefChip } from "~/agents/agent-detail";
import { TalkDrawer } from "~/agents/talk/talk-drawer";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { formatNumber } from "~/lib/format";
import { cn } from "~/lib/utils";
import { errorMessage, useSessionMutation, useSessionQuery } from "./api";
import { MissingKeysWarning } from "./missing-keys";
import {
  AppTile,
  CallHandlingFields,
  ConnectionFields,
  EMPTY_CATALOG,
  isApp,
  PROTOCOL_LABELS,
  SecretControls,
  SigningSecretDialog,
  SpeechFields,
  validateApp,
  type Draft,
  type SetDraft
} from "./apps";
import type {
  AppNumber,
  Catalog,
  CallRecordSummary,
  SessionApp
} from "./types";

/** How many calls the Recent calls card shows. */
const RECENT_CALLS = 3;

/** 125000 → "2:05". */
const clock = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** /w/:ws/apps/:ref: one app on one page, settings on the left and its numbers and calls on the right. */
export function AppDetail() {
  const { workspaceRef, ref = "" } = useParams();
  const base = `/w/${workspaceRef}/apps`;
  const loaded = useSessionQuery(["apps", ref, "detail"], async (api) => ({
    app: await api.getApp(ref),
    catalog: await api.getCatalog().catch(() => EMPTY_CATALOG),
    apps: await api.listApps(),
    numbers: await api.listNumbers().catch(() => [] as AppNumber[]),
    calls: await api
      .listCalls({ appRef: ref })
      .then((page) => page.items)
      .catch(() => [] as CallRecordSummary[])
  }));

  if (loaded.loading && !loaded.data) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-2 sm:px-8" aria-busy>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const app = loaded.data?.app;
  if (!app) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-2 sm:px-8">
        <Link
          to={base}
          className="flex items-center gap-1.5 font-display text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Apps
        </Link>
        <Alert variant="error">
          {loaded.error ?? "This app doesn't exist or was deleted."}
        </Alert>
      </div>
    );
  }

  // An agent opened as an app: it's edited under Agents.
  if (!isApp(app))
    return <Navigate to={`/w/${workspaceRef}/agents/${app.ref}`} replace />;

  return (
    <AppEditor
      key={app.ref}
      app={app}
      catalog={loaded.data!.catalog}
      otherApps={loaded.data!.apps.filter((a) => a.ref !== app.ref)}
      numbers={loaded.data!.numbers.filter((n) => n.appRef === app.ref)}
      calls={loaded
        .data!.calls.filter((c) => c.appRef === app.ref)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, RECENT_CALLS)}
    />
  );
}

/** The whole app is one form: every card saves together. */
function AppEditor({
  app: saved,
  catalog,
  otherApps,
  numbers,
  calls
}: {
  app: SessionApp;
  catalog: Catalog;
  otherApps: SessionApp[];
  numbers: AppNumber[];
  calls: CallRecordSummary[];
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceRef } = useParams();
  const base = `/w/${workspaceRef}/apps`;
  const [app, setApp] = useState<Draft>(saved);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);
  const [talking, setTalking] = useState(false);
  const saveApp = useSessionMutation(
    (api, draft: Omit<Draft, "signingSecretHint">) => api.saveApp(draft),
    { success: "App saved" }
  );
  const remove = useSessionMutation((api, ref: string) => api.deleteApp(ref), {
    success: "App deleted"
  });
  // A new app's secret arrives in the navigation state, shown once.
  const [secret, setSecret] = useState(
    (location.state as { secret?: string } | null)?.secret
  );
  // Browsers keep navigation state across reloads and Back/Forward: drop the secret from this
  // history entry as soon as it is read, so it can't be shown again or read from history.
  useEffect(() => {
    if ((location.state as { secret?: string } | null)?.secret)
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null
      });
  }, [location, navigate]);
  const set: SetDraft = (key, value) => {
    setApp((a) => ({ ...a, [key]: value }));
    setDirty(true);
  };

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () => {
    const found = validateApp(app);
    setErrors(found);
    if (Object.keys(found).length) return;
    const { signingSecretHint: _hint, ...rest } = app;
    saveApp.mutate(rest, { onSuccess: () => setDirty(false) });
  };

  const invalid = Object.keys(errors).length > 0;

  return (
    <div className="flex flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
      <nav aria-label="Breadcrumb" className="font-display text-[13px]">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li>
            <Link to={base} className="hover:text-foreground">
              Apps
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {saved.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <AppTile size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-[22px] font-semibold leading-tight">
              {app.name.trim() || saved.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 font-display text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    numbers.length > 0
                      ? "bg-(--fn-success)"
                      : "bg-muted-foreground"
                  )}
                />
                <span className="text-muted-foreground">
                  {numbers.length > 0
                    ? `Reachable at ${numbers.length} ${numbers.length === 1 ? "number" : "numbers"}`
                    : "No numbers yet"}{" "}
                  · {PROTOCOL_LABELS[saved.protocol]}
                </span>
              </span>
              <RefChip value={saved.ref} label="Copy app ref" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {dirty && (
            <span className="flex items-center gap-1.5 font-display text-xs text-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-(--fn-warning)"
              />
              Unsaved changes
            </span>
          )}
          <Button variant="outline" onClick={() => setTalking(true)}>
            Talk to app
          </Button>
          <Button onClick={save} loading={saveApp.isPending} disabled={!dirty}>
            Save
          </Button>
        </div>
      </div>

      <SigningSecretDialog
        secret={secret}
        onDone={() => setSecret(undefined)}
      />
      {saveApp.error && (
        <Alert variant="error">{errorMessage(saveApp.error)}</Alert>
      )}
      {invalid && (
        <Alert variant="error">Fix the highlighted fields before saving.</Alert>
      )}
      <MissingKeysWarning apps={[saved]} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Connection">
            <div className="flex flex-col gap-[22px]">
              <ConnectionFields app={app} set={set} errors={errors} columns />
            </div>
          </Panel>
          {/* Twilio apps run their own speech; only Fonoster-protocol apps use these. */}
          {app.protocol === "fonoster" && (
            <Panel
              title="Speech"
              description="Optional. Used when your server doesn't pick a voice or model for the call."
            >
              <SpeechFields app={app} set={set} catalog={catalog} />
            </Panel>
          )}
          <Panel
            title="Call handling"
            description="Runs on Fonoster before your app hears the call."
          >
            <div className="flex flex-col gap-[22px]">
              <CallHandlingFields
                app={app}
                set={set}
                errors={errors}
                otherApps={otherApps}
                columns
              />
            </div>
          </Panel>
          <Panel
            title="Signing secret"
            description="Fonoster signs every connection with this secret. Check the signature before accepting a call."
          >
            <div className="flex flex-col gap-3">
              <SecretControls
                appRef={saved.ref}
                hint={app.signingSecretHint}
                onRotated={(hint) =>
                  setApp((a) => ({ ...a, signingSecretHint: hint }))
                }
              />
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel
            title="Reachable at"
            action={
              <Link
                to={`/w/${workspaceRef}/numbers`}
                className="shrink-0 font-display text-xs text-muted-foreground hover:text-foreground"
              >
                Manage in Numbers →
              </Link>
            }
          >
            {numbers.length === 0 ? (
              <p className="font-display text-xs text-muted-foreground">
                No numbers point here yet. Route one from Numbers.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {numbers.map((n) => (
                  <li key={n.ref} className="flex items-center gap-2.5">
                    <Phone
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="font-mono text-[13px]">
                      {formatNumber(n.telUrl)}
                    </span>
                    {n.trunkName && (
                      <span className="ml-auto truncate font-display text-xs text-muted-foreground">
                        Trunk · {n.trunkName}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Recent calls"
            action={
              <Link
                to={`/w/${workspaceRef}/calls`}
                className="shrink-0 font-display text-xs text-muted-foreground hover:text-foreground"
              >
                View all →
              </Link>
            }
          >
            {calls.length === 0 ? (
              <p className="font-display text-xs text-muted-foreground">
                No calls yet.
              </p>
            ) : (
              <ul className="flex flex-col">
                {calls.map((c) => (
                  <li
                    key={c.callRef}
                    className="border-t border-border first:border-t-0"
                  >
                    <Link
                      to={`/w/${workspaceRef}/calls/${c.callRef}`}
                      className="flex items-center gap-2.5 py-2.5 hover:text-foreground"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          c.status === "completed"
                            ? "bg-(--fn-success)"
                            : "bg-destructive"
                        )}
                      />
                      <span className="font-mono text-[12px]">
                        {formatNumber(
                          c.direction === "outbound" ? c.to : c.from
                        )}
                      </span>
                      <span className="ml-auto font-mono text-[12px] text-muted-foreground">
                        {clock(c.durationMs)}
                      </span>
                      <span className="w-11 text-right font-display text-xs text-muted-foreground">
                        {new Date(c.startedAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <section
            aria-label="Danger zone"
            className="flex flex-col gap-3 rounded-xl border border-destructive p-5"
          >
            <h2 className="font-display text-sm font-medium">Delete app</h2>
            <p className="font-display text-xs text-muted-foreground">
              Numbers pointing here stop answering until you route them
              elsewhere.
            </p>
            <Button
              variant="destructive"
              className="self-start"
              onClick={() => setDeleting(true)}
            >
              Delete app
            </Button>
          </section>
        </div>
      </div>

      <TalkDrawer
        open={talking}
        onOpenChange={setTalking}
        appRef={saved.ref}
        name={saved.name}
        dirty={dirty}
        numbers={numbers.map((n) => ({
          ref: n.ref,
          label: n.trunkName || "Number",
          telUrl: n.telUrl
        }))}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open);
          if (!open) remove.reset();
        }}
        title={`Delete ${saved.name}?`}
        description="Numbers that point to this app stop answering until you point them elsewhere."
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          remove.mutate(saved.ref, {
            onSuccess: () => {
              setDeleting(false);
              navigate(base);
            }
          })
        }
      />
    </div>
  );
}
