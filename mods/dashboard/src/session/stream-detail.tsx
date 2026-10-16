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
import { ArrowLeft, AudioWaveform } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { Panel } from "~/agents/parts";
import { RefChip, TabLink } from "~/agents/agent-detail";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "~/components/ui/sonner";
import { errorMessage, useAsync, useSessionApi } from "./api";
import { MissingKeysWarning } from "./missing-keys";
import {
  CallHandlingFields,
  ConnectionFields,
  EMPTY_CATALOG,
  FreshSecret,
  isStream,
  PROTOCOL_LABELS,
  SecretControls,
  SpeechFields,
  validateStream,
  type Draft,
  type SetDraft
} from "./streams";
import type { Catalog, SessionApp } from "./types";

export const STREAM_TABS = [
  { path: "configure", label: "Configure" },
  { path: "call-handling", label: "Call handling" },
  { path: "advanced", label: "Advanced" }
] as const;

/** Which tab shows each validated field. */
const TAB_OF: Record<string, string> = {
  name: "configure",
  url: "configure",
  listeners: "call-handling"
};

/** /w/:ws/streams/:ref/<tab>: one stream, laid out like an Autopilot agent's page. */
export function StreamDetail() {
  const api = useSessionApi();
  const { workspaceRef, ref = "" } = useParams();
  const base = `/w/${workspaceRef}/streams`;
  const loaded = useAsync(
    async () => ({
      app: await api.getApp(ref),
      catalog: await api.getCatalog().catch(() => EMPTY_CATALOG),
      apps: await api.listApps()
    }),
    [api, ref]
  );

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
          <ArrowLeft className="size-3.5" aria-hidden /> Streams
        </Link>
        <Alert variant="error">
          {loaded.error ?? "This stream doesn't exist or was deleted."}
        </Alert>
      </div>
    );
  }

  // An agent opened as a stream (e.g. an old /apps/:ref link): it's edited under Autopilot.
  if (!isStream(app))
    return <Navigate to={`/w/${workspaceRef}/autopilot/${app.ref}`} replace />;

  return (
    <StreamEditor
      key={app.ref}
      app={app}
      catalog={loaded.data!.catalog}
      otherApps={loaded.data!.apps.filter((a) => a.ref !== app.ref)}
      onSaved={loaded.reload}
    />
  );
}

/** The whole stream is one form, so edits across tabs save together. */
function StreamEditor({
  app: saved,
  catalog,
  otherApps,
  onSaved
}: {
  app: SessionApp;
  catalog: Catalog;
  otherApps: SessionApp[];
  onSaved: () => void;
}) {
  const api = useSessionApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceRef } = useParams();
  const base = `/w/${workspaceRef}/streams`;
  const detailBase = `${base}/${saved.ref}`;
  const [app, setApp] = useState<Draft>(saved);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  // A new stream's secret arrives in the navigation state, shown once.
  const [secret, setSecret] = useState(
    (location.state as { secret?: string } | null)?.secret
  );
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
    const found = validateStream(app);
    setErrors(found);
    if (Object.keys(found).length) return;
    const { signingSecretHint: _hint, ...rest } = app;
    setBusy(true);
    setFailure(undefined);
    api.saveApp(rest).then(
      () => {
        setBusy(false);
        setDirty(false);
        toast.success("Stream saved");
        onSaved();
      },
      (e: unknown) => {
        setBusy(false);
        setFailure(errorMessage(e));
      }
    );
  };

  const errorTabs = [...new Set(Object.keys(errors).map((k) => TAB_OF[k]))];

  return (
    <div className="flex flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
      <nav aria-label="Breadcrumb" className="font-display text-[13px]">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li>
            <Link to={base} className="hover:text-foreground">
              Streams
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
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-secondary">
            <AudioWaveform className="size-6 text-foreground" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-[22px] font-semibold leading-tight">
              {app.name.trim() || saved.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 font-display text-xs">
              <Badge
                variant={saved.protocol === "fonoster" ? "success" : "neutral"}
              >
                {PROTOCOL_LABELS[saved.protocol]}
              </Badge>
              <RefChip value={saved.ref} label="Copy stream ref" />
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
          <Button onClick={save} loading={busy} disabled={!dirty}>
            Save
          </Button>
        </div>
      </div>

      {secret && (
        <div className="flex flex-col gap-2">
          <FreshSecret secret={secret} />
        </div>
      )}
      {failure && <Alert variant="error">{failure}</Alert>}
      {errorTabs.length > 0 && (
        <Alert variant="error">
          Fix the highlighted fields in{" "}
          {errorTabs
            .map((tab) => STREAM_TABS.find((t) => t.path === tab)?.label)
            .join(" and ")}{" "}
          before saving.
        </Alert>
      )}
      <MissingKeysWarning apps={[saved]} />

      <nav
        aria-label="Stream sections"
        className="flex gap-6 overflow-x-auto border-b border-border"
      >
        {STREAM_TABS.map((tab) => (
          <TabLink
            key={tab.path}
            to={`${detailBase}/${tab.path}`}
            label={tab.label}
            invalid={errorTabs.includes(tab.path)}
          />
        ))}
      </nav>

      <Routes>
        <Route
          index
          element={<Navigate to={`${detailBase}/configure`} replace />}
        />
        <Route
          path="configure"
          element={
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <Panel title="Connection">
                <div className="flex flex-col gap-[22px]">
                  <ConnectionFields app={app} set={set} errors={errors} />
                </div>
              </Panel>
              <Panel
                title="Speech defaults"
                description="Used when your server doesn't pick a voice or model for the call."
              >
                <div className="flex flex-col gap-[22px]">
                  <SpeechFields app={app} set={set} catalog={catalog} />
                </div>
              </Panel>
            </div>
          }
        />
        <Route
          path="call-handling"
          element={
            <Panel title="Call handling">
              <div className="flex flex-col gap-[22px]">
                <CallHandlingFields
                  app={app}
                  set={set}
                  errors={errors}
                  otherApps={otherApps}
                />
              </div>
            </Panel>
          }
        />
        <Route
          path="advanced"
          element={
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
              <Panel
                title="Signing secret"
                description="The gateway signs every connection with this secret. Check the signature before accepting a call."
              >
                <div className="flex flex-col gap-3">
                  <SecretControls
                    appRef={saved.ref}
                    hint={app.signingSecretHint}
                    onRotated={(r) => {
                      setSecret(r.signingSecret);
                      setApp((a) => ({
                        ...a,
                        signingSecretHint: r.signingSecretHint
                      }));
                    }}
                  />
                </div>
              </Panel>
              <section
                aria-label="Danger zone"
                className="flex flex-col gap-3 rounded-xl border border-destructive p-5"
              >
                <h2 className="font-display text-sm font-medium">
                  Delete stream
                </h2>
                <p className="font-display text-xs text-muted-foreground">
                  Numbers that point to this stream stop answering until you
                  point them elsewhere.
                </p>
                <Button
                  variant="destructive"
                  className="self-start"
                  onClick={() => setDeleting(true)}
                >
                  Delete stream
                </Button>
              </section>
            </div>
          }
        />
        <Route
          path="*"
          element={<Navigate to={`${detailBase}/configure`} replace />}
        />
      </Routes>

      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open);
          if (!open) setDeleteError(undefined);
        }}
        title={`Delete ${saved.name}?`}
        description="Numbers that point to this stream stop answering until you point them elsewhere."
        pending={deletePending}
        error={deleteError}
        onConfirm={() => {
          setDeletePending(true);
          setDeleteError(undefined);
          api.deleteApp(saved.ref).then(
            () => {
              setDeletePending(false);
              setDeleting(false);
              toast.success("Stream deleted");
              navigate(base);
            },
            (e: unknown) => {
              setDeletePending(false);
              setDeleteError(errorMessage(e));
            }
          );
        }}
      />
    </div>
  );
}
