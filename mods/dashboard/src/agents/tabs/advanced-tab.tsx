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
import { Plus, Trash2 } from "lucide-react";
import {
  useController,
  useFieldArray,
  useFormContext,
  useWatch
} from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { EVENTS, type AgentValues } from "../agent-form";
import { AUDIO_FILTERS } from "../catalog";
import {
  NumberInput,
  TextField,
  useFieldError,
  type AgentPath
} from "../fields";
import { Panel, SettingRow } from "../parts";

export function AdvancedTab({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-5">
        <Panel
          title="Turn-taking"
          description="How the agent decides the caller has finished speaking."
        >
          <div className="flex flex-col gap-3">
            <NumberRow
              name="conversation.maxSpeechWaitTimeout"
              label="Max wait for speech"
              hint="Give up waiting for the caller after this long (0 waits indefinitely)"
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
        <CallLimits />
        <Panel title="Language model">
          <div className="flex flex-col gap-3">
            <NumberRow
              name="model.temperature"
              label="Temperature"
              hint="0 is predictable, 2 is creative"
              step={0.1}
              min={0}
              max={2}
            />
            <NumberRow
              name="model.maxTokens"
              label="Max tokens"
              hint="Longest reply the model may write"
              step={10}
              min={1}
            />
          </div>
          <TextField
            name="model.baseUrl"
            label="Base URL"
            hint="Only for self-hosted models (e.g. Ollama)"
            placeholder="http://ollama:11434"
            inputMode="url"
          />
        </Panel>
      </div>
      <div className="flex flex-col gap-5">
        <AudioFilters />
        <EventsWebhook />
        <section
          aria-label="Danger zone"
          className="flex flex-col gap-3 rounded-xl border border-destructive/40 p-5"
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
            <Trash2 aria-hidden /> Delete agent
          </Button>
        </section>
      </div>
    </div>
  );
}

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
  step?: number;
  min?: number;
  max?: number;
}) {
  const error = useFieldError(name);
  const id = `agent-${name.replace(/\./g, "-")}`;
  return (
    <SettingRow label={label} hint={hint} htmlFor={id} error={error}>
      <NumberInput id={id} name={name} {...props} />
      {unit && (
        <span className="w-6 text-xs text-muted-foreground">{unit}</span>
      )}
    </SettingRow>
  );
}

function CallLimits() {
  const timeoutError = useFieldError("conversation.idleTimeoutSeconds");
  const repeatsError = useFieldError("conversation.idleMaxTimeoutCount");
  return (
    <Panel title="Call limits">
      <div className="flex flex-col gap-3">
        <NumberRow
          name="conversation.maxSessionMinutes"
          label="Max call length"
          hint="Hard stop for every call"
          unit="min"
          step={1}
          min={1}
        />
        <SettingRow
          label="Idle timeout · repeats"
          hint="Wait, then repeat this many times before hanging up"
          error={timeoutError ?? repeatsError}
        >
          <NumberInput
            name="conversation.idleTimeoutSeconds"
            aria-label="Idle timeout (seconds)"
            step={1}
            min={1}
            className="w-16"
          />
          <span className="text-xs text-muted-foreground">s ·</span>
          <NumberInput
            name="conversation.idleMaxTimeoutCount"
            aria-label="Idle repeats"
            step={1}
            min={1}
            className="w-14"
          />
          <span className="text-xs text-muted-foreground">×</span>
        </SettingRow>
      </div>
      <TextField
        name="conversation.idleMessage"
        label="Idle message"
        hint="Said when the caller goes quiet"
      />
      <TextField
        name="conversation.initialDtmf"
        label="Initial DTMF"
        hint="Digits sent when the call connects (IVR traversal)"
        placeholder="—"
        inputMode="tel"
        className="[&_input]:font-mono"
      />
    </Panel>
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
          <Button
            variant="link"
            size="sm"
            onClick={() =>
              filters.append({
                name: missing[0].name,
                options: { enhancementLevel: 1 }
              })
            }
          >
            <Plus className="size-3.5" aria-hidden /> Add {missing[0].label}
          </Button>
        )
      }
    >
      {filters.fields.length === 0 ? (
        <p className="font-display text-xs text-muted-foreground">
          No filters. The Media Server needs the filter's license to run it.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5" aria-label="Audio filters">
          {filters.fields.map((field, i) => {
            const known = AUDIO_FILTERS.find((f) => f.name === field.name);
            return (
              <li
                key={field.id}
                className="flex flex-col gap-2 rounded-control border border-border p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-[13px] font-medium">
                      {known?.label ?? field.name}
                    </span>
                    {known && (
                      <span className="font-display text-xs text-muted-foreground">
                        {known.description}
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Remove ${known?.label ?? field.name}`}
                    onClick={() => filters.remove(i)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
                {field.name === "aiCoustics" && (
                  <label className="flex items-center justify-between gap-3 font-display text-xs text-muted-foreground">
                    Enhancement level (0–1; higher also suppresses other voices)
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      className="h-8 w-20 px-2 text-right"
                      {...register(
                        `audioFilters.${i}.options.enhancementLevel` as `audioFilters.${number}.options`,
                        {
                          setValueAs: (v: string) =>
                            v === "" ? undefined : Number(v)
                        }
                      )}
                    />
                  </label>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function EventsWebhook() {
  const { control } = useFormContext<AgentValues>();
  const { field } = useController({ control, name: "eventsHook.events" });
  const eventsError = useFieldError("eventsHook.events");
  const events = (field.value ?? []) as string[];
  return (
    <Panel
      title="Events webhook"
      description="We POST to this URL when a conversation starts or ends. Leave empty to turn it off."
    >
      <TextField
        name="eventsHook.url"
        label="URL"
        placeholder="https://api.example.com/fonoster/events"
        inputMode="url"
        spellCheck={false}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-display text-[13px] font-medium">
          Events
        </legend>
        <div className="flex flex-wrap gap-4">
          {EVENTS.map((event) => (
            <label
              key={event}
              className="flex items-center gap-2 font-mono text-[12px]"
            >
              <Checkbox
                checked={events.includes(event)}
                onCheckedChange={(checked) =>
                  field.onChange(
                    checked
                      ? EVENTS.filter((e) => e === event || events.includes(e))
                      : events.filter((e) => e !== event)
                  )
                }
              />
              {event}
            </label>
          ))}
        </div>
        {eventsError && (
          <p role="alert" className="text-xs text-destructive">
            {eventsError}
          </p>
        )}
      </fieldset>
    </Panel>
  );
}
