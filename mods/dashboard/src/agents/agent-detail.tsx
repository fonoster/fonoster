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
import type { Application, INumber } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Copy, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch
} from "react-hook-form";
import { SmartToy } from "~/components/icons/material";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { errorMessage, GrpcCode, grpcCode } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import {
  agentSchema,
  tabsWithErrors,
  toUpdateRequest,
  toValues,
  type AgentValues
} from "./agent-form";
import {
  numbersFor,
  useAgent,
  useAllNumbers,
  useDeleteAgent,
  useUpdateAgent
} from "./agents.service";
import { useFieldError } from "./fields";
import { TalkDrawer } from "./talk/talk-drawer";
import { AdvancedTab } from "./tabs/advanced-tab";
import { CallsTab } from "./tabs/calls-tab";
import { ConfigureTab } from "./tabs/configure-tab";
import { ToolsTab } from "./tabs/tools-tab";

export const TABS = [
  { path: "configure", label: "Configure" },
  { path: "tools", label: "Tools" },
  { path: "calls", label: "Calls" },
  { path: "advanced", label: "Advanced" }
] as const;

/** /w/:ws/agents — built from the workspace, not relative to the splat route. */
function useAgentsBase() {
  return `/w/${useWorkspace().ref}/agents`;
}

export function AgentDetail() {
  const { ref = "" } = useParams();
  const agent = useAgent(ref);
  const numbers = useAllNumbers();
  const base = useAgentsBase();

  if (agent.isPending) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-2 sm:px-8" aria-busy>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (agent.error || !agent.data) {
    const notFound = grpcCode(agent.error) === GrpcCode.NOT_FOUND;
    return (
      <div className="flex flex-col gap-4 px-4 pt-2 sm:px-8">
        <Link
          to={base}
          className="flex items-center gap-1.5 font-display text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Agents
        </Link>
        <Alert variant="error">
          {notFound
            ? "This agent doesn't exist or was deleted."
            : errorMessage(agent.error)}{" "}
          {!notFound && (
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => void agent.refetch()}
            >
              Try again
            </button>
          )}
        </Alert>
      </div>
    );
  }

  return (
    <AgentEditor
      app={agent.data}
      numbers={numbersFor(numbers.data, agent.data.ref)}
    />
  );
}

/** The whole agent is one form, so edits across tabs save together. */
function AgentEditor({
  app,
  numbers
}: {
  app: Application;
  numbers: INumber[];
}) {
  const base = useAgentsBase();
  const detailBase = `${base}/${app.ref}`;
  const navigate = useNavigate();
  const update = useUpdateAgent();
  const remove = useDeleteAgent();
  const [invalidTabs, setInvalidTabs] = useState<string[]>([]);
  // ?talk=1 (the Overview checklist) opens Talk to agent.
  const [search] = useSearchParams();
  const [talking, setTalking] = useState(search.get("talk") === "1");
  const [deleting, setDeleting] = useState(false);

  const form = useForm<AgentValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: toValues(app)
  });
  const { isDirty, errors } = form.formState;

  // Pick up changes saved elsewhere, unless the user is editing.
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(toValues(app));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = form.handleSubmit(
    async (values) => {
      setInvalidTabs([]);
      await update.mutateAsync(toUpdateRequest(app.ref, values, app));
      form.reset(values);
    },
    (errors) => setInvalidTabs(tabsWithErrors(errors))
  );

  const errorTabs =
    Object.keys(errors).length > 0 ? tabsWithErrors(errors) : [];
  const toolCount =
    useWatch({ control: form.control, name: "tools" })?.length ?? 0;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-5 px-4 pb-10 pt-6 sm:px-8">
        <nav aria-label="Breadcrumb" className="font-display text-[13px]">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li>
              <Link to={base} className="hover:text-foreground">
                Agents
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              {app.name}
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-secondary">
              <SmartToy className="size-6 text-foreground" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <AgentName saved={app.name} onCommit={() => void save()} />
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
                  <span className="text-muted-foreground">Reachable at</span>
                  <span>
                    {numbers.length}{" "}
                    {numbers.length === 1 ? "number" : "numbers"}
                  </span>
                </span>
                <span aria-hidden className="text-muted-foreground">
                  ·
                </span>
                <RefChip value={app.ref} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {isDirty && (
              <span className="flex items-center gap-1.5 font-display text-xs text-muted-foreground">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-(--fn-warning)"
                />
                Unsaved changes
              </span>
            )}
            <Button variant="outline" onClick={() => setTalking(true)}>
              Talk to agent
            </Button>
            <Button
              onClick={() => void save()}
              loading={update.isPending}
              disabled={!isDirty}
            >
              Save
            </Button>
          </div>
        </div>

        {update.error && (
          <Alert variant="error">{errorMessage(update.error)}</Alert>
        )}
        {invalidTabs.length > 0 && errorTabs.length > 0 && (
          <Alert variant="error">
            Fix the highlighted fields in{" "}
            {errorTabs
              .map((tab) => TABS.find((t) => t.path === tab)?.label ?? tab)
              .join(" and ")}{" "}
            before saving.
          </Alert>
        )}

        <nav
          aria-label="Agent sections"
          className="flex gap-6 overflow-x-auto border-b border-border"
        >
          {TABS.map((tab) => (
            <TabLink
              key={tab.path}
              to={`${detailBase}/${tab.path}`}
              label={tab.label}
              count={tab.path === "tools" ? toolCount : undefined}
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
            element={<ConfigureTab numbers={numbers} />}
          />
          <Route path="tools" element={<ToolsTab />} />
          <Route path="calls" element={<CallsTab numbers={numbers} />} />
          <Route
            path="advanced"
            element={
              <AdvancedTab
                appRef={app.ref}
                onDelete={() => setDeleting(true)}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to={`${detailBase}/configure`} replace />}
          />
        </Routes>
      </div>

      <TalkDrawer
        open={talking}
        onOpenChange={setTalking}
        appRef={app.ref}
        name={app.name}
        dirty={isDirty}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open);
          if (!open) remove.reset();
        }}
        title={`Delete ${app.name}?`}
        description="Numbers pointing to this agent stop answering until you route them elsewhere."
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          remove.mutate(app.ref, {
            onSuccess: () => {
              setDeleting(false);
              navigate(base);
            }
          })
        }
      />
    </FormProvider>
  );
}

export function TabLink({
  to,
  label,
  count,
  invalid
}: {
  to: string;
  label: string;
  count?: number;
  invalid?: boolean;
}) {
  const active = Boolean(useMatch({ path: to, end: true }));
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 pt-1 font-display text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="rounded-[4px] bg-muted px-1.5 font-mono text-[11px] font-normal text-muted-foreground">
          {count}
        </span>
      )}
      {invalid && (
        <span
          className="size-1.5 rounded-full bg-destructive"
          aria-label="Has errors"
        />
      )}
    </Link>
  );
}

/**
 * The agent's name as the page title. The pencil turns it into an inline
 * field (designs: "Agent / Detail / Rename"): Enter saves, Esc cancels.
 */
function AgentName({
  saved,
  onCommit
}: {
  saved: string;
  onCommit: () => void;
}) {
  const { register, setValue, getValues } = useFormContext<AgentValues>();
  const name = useWatch<AgentValues, "name">({ name: "name" });
  const [editing, setEditing] = useState(false);
  const before = useRef(saved);
  const nameError = useFieldError("name");

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <h1 className="truncate text-[22px] font-semibold leading-tight">
          {name?.trim() || saved}
        </h1>
        <button
          type="button"
          aria-label="Rename agent"
          onClick={() => {
            before.current = getValues("name");
            setEditing(true);
          }}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-[15px]" aria-hidden />
        </button>
      </div>
    );
  }

  const { ref, ...field } = register("name");
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <input
        {...field}
        ref={(el) => {
          ref(el);
          el?.focus();
        }}
        aria-label="Agent name"
        aria-invalid={Boolean(nameError)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setValue("name", before.current, { shouldDirty: true });
            setEditing(false);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (!getValues("name").trim()) return;
            setEditing(false);
            onCommit();
          }
        }}
        className={cn(
          "-ml-2 h-[34px] min-w-0 max-w-full rounded-control border-[1.5px] border-ring bg-background px-2 font-display text-[22px] font-semibold outline-none",
          nameError && "border-destructive"
        )}
        size={Math.max(12, (name ?? "").length + 1)}
      />
      <span className="shrink-0 font-display text-[11px] text-muted-foreground">
        {nameError ?? "Enter to save · Esc to cancel"}
      </span>
    </div>
  );
}

/** The agent's (or app's) ref in a muted chip with a copy button. */
export function RefChip({
  value,
  label = "Copy agent ref"
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex items-center gap-1.5 rounded-[6px] bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
      {value}
      <button
        type="button"
        aria-label={label}
        className="cursor-pointer outline-none hover:text-foreground focus-visible:text-foreground"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? (
          <Check className="size-[11px]" />
        ) : (
          <Copy className="size-[11px]" />
        )}
      </button>
    </span>
  );
}
