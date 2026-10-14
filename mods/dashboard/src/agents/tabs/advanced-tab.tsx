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
import { MoreHorizontal } from "lucide-react";
import type { ComponentProps } from "react";
import {
  useController,
  useFieldArray,
  useFormContext,
  useWatch
} from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { EVENTS, type AgentValues } from "../agent-form";
import { AUDIO_FILTERS } from "../catalog";
import { useFieldError, type AgentPath } from "../fields";
import { Panel, PanelAction, SettingRow, ValueBox, ValueInput } from "../parts";

// Layout and copy from designs/dashboard.pen "Agent / Detail / Advanced".

export function AdvancedTab({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-5">
        <Panel
          title="Turn-taking"
          description="How the agent decides the caller has finished speaking."
        >
          <div>
            <NumberRow
              name="conversation.maxSpeechWaitTimeout"
              label="Max wait for speech"
              hint="Give up waiting for the caller after this long"
              unit="ms"
              step={100}
              min={0}
            />
            <NumberRow
              name="conversation.vad.activationThreshold"
              label="Voice activity · start"
              hint="Confidence needed to treat sound as speech"
              step={0.05}
              min={0}
              max={1}
            />
            <NumberRow
              name="conversation.vad.deactivationThreshold"
              label="Voice activity · stop"
              hint="Confidence below which speech has ended"
              step={0.05}
              min={0}
              max={1}
            />
            <NumberRow
              name="conversation.vad.debounceFrames"
              label="Debounce frames"
              hint="Frames to wait before switching state"
              step={1}
              min={1}
            />
          </div>
        </Panel>
        <Panel title="Call limits">
          <div>
            <NumberRow
              name="conversation.maxSessionMinutes"
              label="Max call length"
              hint="Hard stop for every call"
              unit="min"
              step={1}
              min={1}
            />
            <TextRow
              name="conversation.idleMessage"
              label="Idle message"
              hint="Said when the caller goes quiet"
            />
            <IdleRow />
            <TextRow
              name="conversation.initialDtmf"
              label="Initial DTMF"
              hint="Digits sent when the call connects (IVR traversal)"
              placeholder="—"
              inputMode="tel"
            />
          </div>
        </Panel>
        <Panel title="Language model">
          <div>
            <NumberRow
              name="model.temperature"
              label="Temperature"
              step={0.1}
              min={0}
              max={2}
            />
            <NumberRow
              name="model.maxTokens"
              label="Max tokens"
              step={10}
              min={1}
            />
            <TextRow
              name="model.baseUrl"
              label="Base URL"
              hint="Only for self-hosted models (e.g. Ollama)"
              placeholder="—"
              inputMode="url"
              spellCheck={false}
            />
          </div>
        </Panel>
      </div>
      <div className="flex flex-col gap-5">
        <AudioFilters />
        <EventsWebhook />
        <section
          aria-label="Danger zone"
          className="flex flex-col gap-3 rounded-xl border border-destructive p-5"
        >
          <h2 className="font-display text-sm font-medium">Delete agent</h2>
          <p className="font-display text-xs text-muted-foreground">
            Numbers pointing to this agent stop answering until you route them
            elsewhere.
          </p>
          <Button
            variant="destructive"
            className="self-start"
            onClick={onDelete}
          >
            Delete agent
          </Button>
        </section>
      </div>
    </div>
  );
}

const idFor = (name: string) => `agent-${name.replace(/\./g, "-")}`;

function NumberRow({
  name,
  label,
  hint,
  unit,
  ...props
}: {
  name: AgentPath;
  label: string;
  hint?: string;
  unit?: string;
} & Pick<ComponentProps<"input">, "step" | "min" | "max">) {
  const { register } = useFormContext<AgentValues>();
  const error = useFieldError(name);
  const id = idFor(name);
  return (
    <SettingRow label={label} hint={hint} htmlFor={id} error={error}>
      <ValueBox invalid={Boolean(error)}>
        <ValueInput
          id={id}
          type="number"
          inputMode="decimal"
          aria-invalid={Boolean(error)}
          {...register(name, { valueAsNumber: true })}
          {...props}
        />
        {unit && <span aria-hidden>{unit}</span>}
      </ValueBox>
    </SettingRow>
  );
}

function TextRow({
  name,
  label,
  hint,
  ...props
}: {
  name: AgentPath;
  label: string;
  hint?: string;
} & Omit<ComponentProps<"input">, "name">) {
  const { register } = useFormContext<AgentValues>();
  const error = useFieldError(name);
  const id = idFor(name);
  return (
    <SettingRow label={label} hint={hint} htmlFor={id} error={error}>
      <ValueBox invalid={Boolean(error)}>
        <ValueInput
          id={id}
          aria-invalid={Boolean(error)}
          {...register(name)}
          {...props}
        />
      </ValueBox>
    </SettingRow>
  );
}

/** "10 s · 3×": the idle timeout and how many times it repeats. */
function IdleRow() {
  const { register } = useFormContext<AgentValues>();
  const timeoutError = useFieldError("conversation.idleTimeoutSeconds");
  const repeatsError = useFieldError("conversation.idleMaxTimeoutCount");
  const error = timeoutError ?? repeatsError;
  return (
    <SettingRow
      label="Idle timeout · repeats"
      hint="Wait, then repeat this many times before hanging up"
      htmlFor="agent-idle-timeout"
      error={error}
    >
      <ValueBox invalid={Boolean(error)}>
        <ValueInput
          id="agent-idle-timeout"
          type="number"
          inputMode="decimal"
          aria-label="Idle timeout (seconds)"
          className="w-10 flex-none"
          min={1}
          {...register("conversation.idleTimeoutSeconds", {
            valueAsNumber: true
          })}
        />
        <span aria-hidden>s ·</span>
        <ValueInput
          type="number"
          inputMode="numeric"
          aria-label="Idle repeats"
          className="w-6 flex-none"
          min={1}
          {...register("conversation.idleMaxTimeoutCount", {
            valueAsNumber: true
          })}
        />
        <span aria-hidden>×</span>
      </ValueBox>
    </SettingRow>
  );
}

function AudioFilters() {
  const { control, register } = useFormContext<AgentValues>();
  const filters = useFieldArray({ control, name: "audioFilters" });
  const values =
    useWatch<AgentValues, "audioFilters">({ name: "audioFilters" }) ?? [];
  const missing = AUDIO_FILTERS.filter(
    (known) => !values.some((filter) => filter.name === known.name)
  );

  return (
    <Panel
      title="Audio filters"
      description="Clean up caller audio before speech recognition."
      action={
        missing.length > 0 && (
          <PanelAction
            aria-label={`Add ${missing[0].label}`}
            onClick={() =>
              filters.append({
                name: missing[0].name,
                options: { enhancementLevel: 1 }
              })
            }
          >
            + Add
          </PanelAction>
        )
      }
    >
      {filters.fields.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Audio filters">
          {filters.fields.map((field, i) => {
            const known = AUDIO_FILTERS.find((f) => f.name === field.name);
            const label = known?.label ?? field.name;
            return (
              <li
                key={field.id}
                className="flex items-center gap-3 rounded-control border border-border px-3 py-2.5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-mono text-[13px]">{label}</span>
                  {known && (
                    <span className="font-display text-xs text-muted-foreground">
                      {known.description}
                    </span>
                  )}
                  {field.name === "aiCoustics" && (
                    <label className="mt-1 flex items-center justify-between gap-3 font-display text-[11px] text-muted-foreground">
                      Enhancement level (0–1)
                      <ValueBox className="h-6 w-16">
                        <ValueInput
                          type="number"
                          step={0.1}
                          min={0}
                          max={1}
                          {...register(
                            `audioFilters.${i}.options.enhancementLevel` as `audioFilters.${number}.options`,
                            {
                              setValueAs: (v: string) =>
                                v === "" ? undefined : Number(v)
                            }
                          )}
                        />
                      </ValueBox>
                    </label>
                  )}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`Actions for ${label}`}
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => filters.remove(i)}
                    >
                      Remove {label}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function EventsWebhook() {
  const { control, register } = useFormContext<AgentValues>();
  const { field } = useController({ control, name: "eventsHook.events" });
  const urlError = useFieldError("eventsHook.url");
  const eventsError = useFieldError("eventsHook.events");
  const events = (field.value ?? []) as string[];
  return (
    <Panel
      title="Events webhook"
      action={
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex">
              <PanelAction disabled>Send test</PanelAction>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Coming soon: the API can't send a test event yet.
          </TooltipContent>
        </Tooltip>
      }
    >
      <input
        aria-label="Webhook URL"
        aria-invalid={Boolean(urlError)}
        placeholder="https://api.example.com/fonoster/events"
        inputMode="url"
        spellCheck={false}
        className={cn(
          "h-[38px] w-full rounded-control border border-input bg-background px-3 font-mono text-xs outline-none placeholder:text-text-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          urlError && "border-destructive"
        )}
        {...register("eventsHook.url")}
      />
      {urlError && (
        <p role="alert" className="font-display text-[11px] text-destructive">
          {urlError}
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Events">
        {EVENTS.map((event) => {
          const on = events.includes(event);
          return (
            <button
              key={event}
              type="button"
              aria-pressed={on}
              onClick={() =>
                field.onChange(
                  on
                    ? events.filter((e) => e !== event)
                    : EVENTS.filter((e) => e === event || events.includes(e))
                )
              }
              className={cn(
                "cursor-pointer rounded-[6px] border px-2 py-1 font-mono text-[11px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "border-transparent bg-muted text-muted-foreground"
                  : "border-dashed border-border text-muted-foreground/60 line-through"
              )}
            >
              {event}
            </button>
          );
        })}
      </div>
      {eventsError && (
        <p role="alert" className="font-display text-[11px] text-destructive">
          {eventsError}
        </p>
      )}
    </Panel>
  );
}
