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
import type { Application } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Braces, Phone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "~/components/ui/tooltip";
import { GrpcCode, errorMessage, grpcCode } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { CodeBlock } from "./code-block";
import { DeleteVoiceAppDialog } from "./delete-voice-app-dialog";
import { voiceAppSchema, type VoiceAppValues } from "./schema";
import { speechFromApp, speechPayload } from "./speech";
import { SpeechFields } from "./speech-fields";
import { SDK_DOCS_URL, handlerSnippet } from "./templates";
import {
  EXTERNAL,
  formatNumber,
  isVoiceApp,
  numbersFor,
  useAllNumbers,
  useUpdateVoiceApp,
  useVoiceApp
} from "./voice-apps.service";

function Panel({
  title,
  description,
  action,
  className,
  children
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-medium">{title}</h2>
          {action}
        </div>
        {description && (
          <p className="font-display text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** A control the API can't back yet. */
function ComingSoon({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-control">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 px-4 pt-2 font-display text-[13px] sm:px-8"
    >
      <Link
        to=".."
        relative="path"
        className="text-muted-foreground hover:text-foreground"
      >
        Voice apps
      </Link>
      <span className="text-muted-foreground" aria-hidden>
        /
      </span>
      <span aria-current="page" className="truncate text-foreground">
        {current}
      </span>
    </nav>
  );
}

export function VoiceAppDetail() {
  const { ref = "" } = useParams();
  const app = useVoiceApp(ref);

  if (app.isPending) {
    return (
      <>
        <Breadcrumb current="…" />
        <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (app.error || !app.data || !isVoiceApp(app.data)) {
    const missing = !app.error || grpcCode(app.error) === GrpcCode.NOT_FOUND;
    return (
      <>
        <Breadcrumb current={ref} />
        <div className="px-4 py-6 sm:px-8">
          <Alert variant="error">
            {missing
              ? app.data
                ? "This is an AI agent, not a voice app. Open it from Agents."
                : "This voice app doesn't exist or was deleted."
              : errorMessage(app.error)}{" "}
            {!missing && (
              <button
                type="button"
                className="cursor-pointer underline"
                onClick={() => void app.refetch()}
              >
                Try again
              </button>
            )}
          </Alert>
        </div>
      </>
    );
  }

  return <VoiceAppEditor key={app.data.ref} app={app.data} />;
}

function valuesOf(app: Application): VoiceAppValues {
  return {
    name: app.name,
    endpoint: app.endpoint ?? "",
    speech: speechFromApp(app)
  };
}

function VoiceAppEditor({ app }: { app: Application }) {
  const navigate = useNavigate();
  const update = useUpdateVoiceApp();
  const numbers = useAllNumbers();
  const routed = numbersFor(numbers.data, app.ref);
  const [deleting, setDeleting] = useState(false);
  const form = useForm<VoiceAppValues>({
    resolver: zodResolver(voiceAppSchema),
    defaultValues: valuesOf(app)
  });
  const { errors } = form.formState;
  const transcriber = form.watch("speech.transcriber");

  // Pick up a refetch (e.g. after saving) without losing unsaved edits.
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(valuesOf(app));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        ref: app.ref,
        name: values.name,
        type: EXTERNAL,
        endpoint: values.endpoint,
        ...speechPayload(values.speech)
      });
      form.reset(values);
    } catch {
      // Shown from update.error.
    }
  });

  return (
    <>
      <Breadcrumb current={app.name} />
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 pb-6 pt-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted">
            <Braces className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-2xl font-semibold">{app.name}</h1>
            <div>
              <Badge className="font-mono text-[11px]">{app.ref}</Badge>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ComingSoon>
            <Button variant="outline" disabled>
              <Phone aria-hidden className="size-4" /> Place test call
            </Button>
          </ComingSoon>
          <Button
            type="submit"
            form="voice-app-detail-form"
            loading={update.isPending}
          >
            Save
          </Button>
        </div>
      </div>
      <div className="grid gap-5 px-4 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          id="voice-app-detail-form"
          onSubmit={onSubmit}
          noValidate
          className="flex min-w-0 flex-col gap-5"
        >
          {update.error && (
            <Alert variant="error">{errorMessage(update.error)}</Alert>
          )}
          <Panel title="Connection">
            <Field label="Name" error={errors.name?.message}>
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("name")}
                  autoComplete="off"
                />
              )}
            </Field>
            <Field
              label="Endpoint"
              error={errors.endpoint?.message}
              action={
                <span className="text-[11px] text-muted-foreground">
                  host:port of your voice server
                </span>
              }
            >
              {(a11y) => (
                <div className="flex gap-2">
                  <Input
                    {...a11y}
                    {...form.register("endpoint")}
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                  />
                  <ComingSoon>
                    <Button variant="outline" disabled>
                      Check
                    </Button>
                  </ComingSoon>
                </div>
              )}
            </Field>
          </Panel>
          <Panel
            title="Speech"
            description="Used when your code calls say() or gather() with speech. Audio-stream apps can leave these empty."
          >
            <SpeechFields
              control={form.control}
              errors={errors}
              transcriber={transcriber}
            />
          </Panel>
          <Panel
            title="Every call runs your handler"
            action={
              <a
                href={SDK_DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="font-display text-xs text-brand-text hover:underline"
              >
                SDK docs →
              </a>
            }
          >
            <CodeBlock title="index.js" code={handlerSnippet(app.ref)} />
          </Panel>
        </form>
        <div className="flex min-w-0 flex-col gap-5">
          <Panel
            title="Reachable at"
            action={
              <Link
                to="../../numbers"
                relative="path"
                className="font-display text-xs text-brand-text hover:underline"
              >
                Manage in Numbers →
              </Link>
            }
          >
            {numbers.isPending ? (
              <Skeleton className="h-4 w-40" />
            ) : numbers.error ? (
              <p className="font-display text-xs text-destructive">
                {errorMessage(numbers.error)}
              </p>
            ) : routed.length === 0 ? (
              <p className="font-display text-xs text-muted-foreground">
                No numbers route here yet. Point one at this app from Numbers to
                receive calls.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5" aria-label="Numbers">
                {routed.map((number) => (
                  <li
                    key={number.ref}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-1.5 rounded-full bg-primary"
                        aria-hidden
                      />
                      {formatNumber(number.telUrl)}
                    </span>
                    {number.trunk?.name && (
                      <span className="truncate font-display text-xs text-muted-foreground">
                        Trunk · {number.trunk.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recent calls">
            <p className="font-display text-xs text-muted-foreground">
              Coming soon: calls handled by this app will show here.
            </p>
          </Panel>
          <Panel
            title="Delete voice app"
            description="Numbers pointing here stop answering until you route them elsewhere."
            className="border-destructive/40"
          >
            <div>
              <Button variant="destructive" onClick={() => setDeleting(true)}>
                Delete voice app
              </Button>
            </div>
          </Panel>
        </div>
      </div>
      <DeleteVoiceAppDialog
        app={deleting ? app : undefined}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate("..", { relative: "path" })}
      />
    </>
  );
}
