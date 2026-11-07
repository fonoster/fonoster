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
import type { INumber } from "@fonoster/types";
import { Check, ChevronDown, Phone, Search } from "lucide-react";
import { Fragment, useId, useState, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, type SelectOption } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { approximateTokens, SPEED, type AgentValues } from "../agent-form";
import { formatNumber, useCatalog } from "../agents.service";
import {
  EMPTY_CATALOG,
  firstModelOf,
  ignoresTemperature,
  labelOf,
  languageName,
  providerOf,
  providerOptions,
  summaryOf,
  voicesOf,
  type AgentCatalog,
  type CatalogOption
} from "../catalog";
import {
  SelectField,
  SwitchControl,
  TextField,
  useFieldError,
  type AgentPath
} from "../fields";
import { Panel, ValueBox, ValueInput } from "../parts";

// Layout and copy from designs/dashboard.pen "Agent / Detail / Configure".

export function ConfigureTab({ numbers }: { numbers: INumber[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Conversation />
      <div className="flex flex-col gap-5 self-start">
        <ModelAndVoice />
        <ReachableAt numbers={numbers} />
        <Behavior />
      </div>
    </div>
  );
}

/** Fills the height of the right column; the prompt takes the free space. */
function Conversation() {
  const prompt = useWatch<AgentValues, "conversation.systemPrompt">({
    name: "conversation.systemPrompt"
  });
  const tokens = approximateTokens(prompt ?? "");
  return (
    <Panel title="Conversation" className="lg:h-full">
      <TextField name="conversation.firstMessage" label="First message" />
      <TextField
        name="conversation.systemPrompt"
        label="System prompt"
        multiline
        spellCheck={false}
        className="flex-1 [&_textarea]:min-h-64 [&_textarea]:flex-1 [&_textarea]:resize-none [&_textarea]:font-mono [&_textarea]:leading-relaxed"
        action={
          <span className="font-display text-[11px] text-muted-foreground">
            {tokens.toLocaleString("en-US")} tokens
          </span>
        }
      />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <TextField name="conversation.goodbyeMessage" label="Goodbye message" />
        <TextField
          name="conversation.systemErrorMessage"
          label="Error message"
        />
      </div>
    </Panel>
  );
}

/** A summary box ("OpenAI · gpt-4o-mini   temp 0.4 ⌄") that expands to its fields. */
function PickerRow({
  label,
  value,
  meta,
  children
}: {
  label: string;
  value: string;
  meta?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded-control border border-input bg-background">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-display text-[11px] text-muted-foreground">
            {label}
          </span>
          <span className="truncate font-display text-[13px]">{value}</span>
        </span>
        {meta && (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {meta}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={id} className="flex flex-col gap-3 border-t border-border p-3">
          {children}
        </div>
      )}
    </div>
  );
}

/** Keeps a saved value the workspace can no longer pick, marked as such. */
function withUnavailable(options: SelectOption[], value: string) {
  return value && !options.some((o) => o.value === value)
    ? [{ value, label: `${value} (unavailable)` }, ...options]
    : options;
}

/**
 * A provider and one of its catalog items (a voice, a model). Switching the provider picks its
 * first item; a saved item the workspace can no longer use stays, marked unavailable.
 */
function CatalogPicker({
  name,
  label,
  catalog,
  options
}: {
  name: AgentPath;
  label: string;
  catalog: AgentCatalog;
  options: CatalogOption[];
}) {
  const { setValue } = useFormContext<AgentValues>();
  const value = String(useWatch<AgentValues>({ name }) ?? "");
  const [provider, setProvider] = useState(providerOf(value));
  const providers = providerOptions(catalog, options);
  return (
    <>
      <Field label="Provider">
        {(a11y) => (
          <Select
            {...a11y}
            value={provider}
            options={withUnavailable(providers, provider)}
            onValueChange={(next) => {
              setProvider(next);
              setValue(
                name,
                options.find((o) => o.provider === next)?.id ?? "",
                { shouldDirty: true }
              );
            }}
          />
        )}
      </Field>
      <SelectField
        name={name}
        label={label}
        options={options
          .filter((o) => o.provider === provider)
          .map((o) => ({ value: o.id, label: o.label }))}
      />
    </>
  );
}

const formatSpeed = (speed: number) => `${speed.toFixed(1)}×`;

const voiceCount = (n: number) => `${n} ${n === 1 ? "voice" : "voices"}`;

/** "Deepgram · Flux · Fernanda", or the typed voice ID in place of the voice. */
function voiceSummary(catalog: AgentCatalog, tts: AgentValues["tts"]) {
  const parts = [
    catalog.providers[tts.provider] ?? tts.provider,
    tts.model && labelOf(catalog.tts, tts.model),
    tts.voiceId.trim() || (tts.voice && labelOf(catalog.voices, tts.voice))
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

/** One voice of the list: its name, chips (language, gender, accent) and a check when picked. */
function VoiceOption({
  option,
  group,
  checked,
  onPick
}: {
  option: CatalogOption;
  group: string;
  checked: boolean;
  onPick: () => void;
}) {
  const chipsId = useId();
  const chips = [option.languages[0], option.gender, option.accent]
    .filter((chip): chip is string => Boolean(chip))
    .map((chip) => chip.toLowerCase());
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 hover:bg-accent/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        checked && "bg-accent hover:bg-accent"
      )}
    >
      <input
        type="radio"
        name={group}
        value={option.id}
        checked={checked}
        onChange={onPick}
        aria-label={option.label}
        aria-describedby={chips.length ? chipsId : undefined}
        className="sr-only"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span
          className={cn(
            "truncate font-display text-[13px]",
            checked && "font-medium"
          )}
        >
          {option.label}
        </span>
        {chips.length > 0 && (
          <span id={chipsId} className="flex flex-wrap gap-1">
            {chips.map((chip, index) => (
              <Fragment key={index}>
                {index > 0 && " "}
                <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {chip}
                </span>
              </Fragment>
            ))}
          </span>
        )}
      </span>
      {checked && <Check className="size-3.5 shrink-0" aria-hidden />}
    </label>
  );
}

/**
 * Vendor, model, one of the model's voices or a typed voice ID, and the speed (#1323). The list
 * and the ID exclude each other: picking one clears the other.
 */
function VoicePicker({
  catalog,
  loading
}: {
  catalog: AgentCatalog;
  loading: boolean;
}) {
  const { setValue, formState } = useFormContext<AgentValues>();
  const tts = useWatch<AgentValues, "tts">({ name: "tts" });
  const error = useFieldError("tts.voice");
  const [filter, setFilter] = useState("");
  const group = useId();
  const errorId = useId();
  const speedId = useId();

  const set = <K extends keyof AgentValues["tts"]>(
    key: K,
    value: AgentValues["tts"][K]
  ) =>
    setValue(`tts.${key}`, value as never, {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted
    });
  // The new model's voice: the current one if the model has it, else its first.
  const voiceFor = (model: string) => {
    const offered = voicesOf(catalog, model);
    return offered.some((o) => o.id === tts.voice)
      ? tts.voice
      : (offered[0]?.id ?? "");
  };
  const changeModel = (model: string, typed = tts.voiceId) => {
    set("model", model);
    if (!typed.trim()) set("voice", voiceFor(model));
  };
  const changeVendor = (provider: string) => {
    set("provider", provider);
    set("voiceId", "");
    changeModel(catalog.tts.find((o) => o.provider === provider)?.id ?? "", "");
  };
  const pickVoice = (voice: string) => {
    set("voice", voice);
    set("voiceId", "");
    if (!tts.model) set("model", firstModelOf(catalog, voice));
  };
  const typeVoiceId = (voiceId: string) => {
    set("voiceId", voiceId);
    if (voiceId.trim()) set("voice", "");
  };
  const step = (by: number) =>
    set(
      "speed",
      Math.min(
        SPEED.max,
        Math.max(SPEED.min, Math.round((tts.speed + by) * 10) / 10)
      )
    );

  const voices = tts.model
    ? voicesOf(catalog, tts.model)
    : catalog.voices.filter((o) => o.provider === tts.provider);
  const query = filter.trim().toLowerCase();
  const shown = query
    ? voices.filter((o) => o.label.toLowerCase().includes(query))
    : voices;

  return (
    <>
      <Field label="Vendor">
        {(a11y) => (
          <Select
            {...a11y}
            value={tts.provider}
            options={withUnavailable(
              providerOptions(catalog, catalog.tts),
              tts.provider
            )}
            onValueChange={changeVendor}
          />
        )}
      </Field>
      <Field label="Model">
        {(a11y) => (
          <Select
            {...a11y}
            value={tts.model}
            options={withUnavailable(
              catalog.tts
                .filter((o) => o.provider === tts.provider)
                .map((o) => ({ value: o.id, label: o.label })),
              tts.model
            )}
            onValueChange={(model) => changeModel(model)}
          />
        )}
      </Field>
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-[13px] -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            compact
            aria-label="Filter voices by name"
            placeholder="Filter by name"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="pl-8 font-display"
          />
        </div>
        {loading ? (
          <p
            role="status"
            className="px-2.5 py-2 font-display text-[13px] text-muted-foreground"
          >
            Loading voices…
          </p>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="Voices"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="flex max-h-72 flex-col gap-0.5 overflow-y-auto"
            >
              {shown.map((option) => (
                <VoiceOption
                  key={option.id}
                  option={option}
                  group={group}
                  checked={!tts.voiceId.trim() && option.id === tts.voice}
                  onPick={() => pickVoice(option.id)}
                />
              ))}
            </div>
            {query && shown.length === 0 && (
              <p className="px-2.5 py-2 font-display text-[13px] text-muted-foreground">
                No voices match "{filter.trim()}". Check the spelling or enter a
                voice ID below.
              </p>
            )}
            {error && (
              <p
                id={errorId}
                role="alert"
                className="font-display text-[11px] text-destructive"
              >
                {error}
              </p>
            )}
            <p className="font-display text-[11px] text-muted-foreground">
              {query
                ? `${shown.length} of ${voiceCount(voices.length)}`
                : voiceCount(voices.length)}
            </p>
          </>
        )}
      </div>
      <Field label="Or enter a voice ID">
        {(a11y) => (
          <Input
            {...a11y}
            placeholder="Voice ID"
            spellCheck={false}
            value={tts.voiceId}
            onChange={(event) => typeVoiceId(event.target.value)}
          />
        )}
      </Field>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={speedId}>Speed</Label>
          <span className="font-mono text-[11px]" aria-hidden>
            {formatSpeed(tts.speed)}
          </span>
        </div>
        <input
          id={speedId}
          type="range"
          min={SPEED.min}
          max={SPEED.max}
          step={0.1}
          value={tts.speed}
          aria-valuetext={formatSpeed(tts.speed)}
          onChange={(event) => set("speed", Number(event.target.value))}
          onKeyDown={(event) => {
            const by = {
              ArrowRight: 0.1,
              ArrowUp: 0.1,
              ArrowLeft: -0.1,
              ArrowDown: -0.1,
              Home: -1,
              End: 1
            }[event.key];
            if (by === undefined) return;
            event.preventDefault();
            step(by);
          }}
          className="h-4 w-full cursor-pointer accent-primary"
        />
        <div
          className="flex justify-between font-mono text-[10px] text-muted-foreground"
          aria-hidden
        >
          <span>{formatSpeed(SPEED.min)}</span>
          <span>{formatSpeed(SPEED.max)}</span>
        </div>
      </div>
    </>
  );
}

function ModelAndVoice() {
  const query = useCatalog();
  const catalog = query.data ?? EMPTY_CATALOG;
  const [model, temperature, tts, sttModel, language] = useWatch<
    AgentValues,
    ["model.model", "model.temperature", "tts", "stt.model", "stt.languageCode"]
  >({
    name: [
      "model.model",
      "model.temperature",
      "tts",
      "stt.model",
      "stt.languageCode"
    ]
  });
  const languages = (
    catalog.stt.find((o) => o.id === sttModel)?.languages ?? []
  ).map((code) => ({ value: code, label: languageName(code) }));

  return (
    <Panel title="Model & voice">
      <div className="flex flex-col gap-3">
        <PickerRow
          label="Language model"
          value={summaryOf(catalog, catalog.llm, model)}
          meta={
            Number.isFinite(temperature) && !ignoresTemperature(catalog, model)
              ? `temp ${temperature}`
              : undefined
          }
        >
          <CatalogPicker
            name="model.model"
            label="Model"
            catalog={catalog}
            options={catalog.llm}
          />
          <p className="font-display text-[11px] text-muted-foreground">
            Temperature and max tokens are in Advanced.
          </p>
        </PickerRow>
        <PickerRow
          label="Voice"
          value={voiceSummary(catalog, tts)}
          meta={formatSpeed(tts.speed)}
        >
          <VoicePicker catalog={catalog} loading={query.isPending} />
        </PickerRow>
        <PickerRow
          label="Transcriber"
          value={summaryOf(catalog, catalog.stt, sttModel)}
          meta={language || undefined}
        >
          <CatalogPicker
            name="stt.model"
            label="Model"
            catalog={catalog}
            options={catalog.stt}
          />
          <SelectField
            name="stt.languageCode"
            label="Language"
            options={languages}
          />
        </PickerRow>
      </div>
    </Panel>
  );
}

function ReachableAt({ numbers }: { numbers: INumber[] }) {
  const workspace = useWorkspace();
  return (
    <Panel
      title="Reachable at"
      action={
        <Link
          to={`/w/${workspace.ref}/numbers`}
          className="font-display text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Manage in Numbers →
        </Link>
      }
    >
      {numbers.length === 0 ? (
        <p className="font-display text-[13px] text-muted-foreground">
          No numbers route here yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5" aria-label="Numbers">
          {numbers.map((number) => (
            <li key={number.ref} className="flex items-center gap-3">
              <Phone
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="flex-1 font-mono text-[13px]">
                {formatNumber(number.telUrl)}
              </span>
              <span className="truncate font-display text-xs text-muted-foreground">
                {number.trunk?.name
                  ? `Trunk · ${number.trunk.name}`
                  : number.name}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="font-display text-xs text-muted-foreground">
        Numbers point to agents. To route another number here, edit it in
        Numbers.
      </p>
    </Panel>
  );
}

/** A sentence the agent says: a field sized to its text, wrapping instead of scrolling. */
const SENTENCE_FIELD =
  "[&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:[field-sizing:content]";

/** A Behavior line: muted label, value on the right that reads as text until edited. */
function BehaviorRow({
  label,
  htmlFor,
  error,
  children
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex min-h-[30px] items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="whitespace-nowrap font-display text-[13px] text-muted-foreground"
        >
          {label}
        </label>
        {children}
      </div>
      {error && (
        <p
          role="alert"
          className="text-right font-display text-[11px] text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Behavior() {
  const { register } = useFormContext<AgentValues>();
  const transfer = useWatch<AgentValues, "conversation.transferPhoneNumber">({
    name: "conversation.transferPhoneNumber"
  });
  const timeoutError = useFieldError("conversation.idleTimeoutSeconds");
  const repeatsError = useFieldError("conversation.idleMaxTimeoutCount");
  const lengthError = useFieldError("conversation.maxSessionMinutes");
  const transferError = useFieldError("conversation.transferPhoneNumber");
  return (
    <Panel title="Behavior">
      <div className="flex flex-col gap-1">
        <BehaviorRow label="Let callers interrupt">
          <SwitchControl
            name="conversation.allowUserBargeIn"
            label="Let callers interrupt"
          />
        </BehaviorRow>
        <BehaviorRow
          label="Hang up after silence"
          htmlFor="behavior-repeats"
          error={timeoutError ?? repeatsError}
        >
          <ValueBox invalid={Boolean(timeoutError ?? repeatsError)}>
            <ValueInput
              id="behavior-repeats"
              type="number"
              min={1}
              aria-label="Silence repeats"
              className="w-auto flex-none [field-sizing:content]"
              {...register("conversation.idleMaxTimeoutCount", {
                valueAsNumber: true
              })}
            />
            <span aria-hidden>×</span>
            <ValueInput
              type="number"
              min={1}
              aria-label="Silence timeout (seconds)"
              className="w-auto flex-none [field-sizing:content]"
              {...register("conversation.idleTimeoutSeconds", {
                valueAsNumber: true
              })}
            />
            <span aria-hidden>s</span>
          </ValueBox>
        </BehaviorRow>
        <BehaviorRow
          label="Max call length"
          htmlFor="behavior-length"
          error={lengthError}
        >
          <ValueBox invalid={Boolean(lengthError)}>
            <ValueInput
              id="behavior-length"
              type="number"
              min={1}
              className="w-auto flex-none [field-sizing:content]"
              {...register("conversation.maxSessionMinutes", {
                valueAsNumber: true
              })}
            />
            <span aria-hidden>min</span>
          </ValueBox>
        </BehaviorRow>
        <BehaviorRow
          label="Transfer to an operator"
          htmlFor="behavior-transfer"
          error={transferError}
        >
          <ValueBox invalid={Boolean(transferError)}>
            <ValueInput
              id="behavior-transfer"
              placeholder="Off"
              inputMode="tel"
              {...register("conversation.transferPhoneNumber")}
            />
          </ValueBox>
        </BehaviorRow>
        {transfer?.trim() && (
          <>
            <TextField
              name="conversation.transferMessage"
              label="Says before transferring"
              multiline
              rows={1}
              className={SENTENCE_FIELD}
            />
            <TextField
              name="conversation.transferFailedMessage"
              label="Says if the transfer fails"
              placeholder="Sorry, I couldn't connect you. How else can I help?"
              multiline
              rows={1}
              className={SENTENCE_FIELD}
            />
          </>
        )}
      </div>
    </Panel>
  );
}
