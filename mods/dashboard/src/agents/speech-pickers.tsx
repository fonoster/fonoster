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
/**
 * The voice and transcriber pickers an agent's page and an app's page share. They are
 * controlled (a value and onChange), so each page keeps its own form state; `allowNone` adds the
 * None choice an app has, since an app may do its own speech.
 */
import { Check, ChevronDown, Search } from "lucide-react";
import { Fragment, useId, useState, type ReactNode } from "react";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, type SelectOption } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { SPEED } from "./agent-form";
import {
  firstModelOf,
  labelOf,
  providerOf,
  providerOptions,
  voicesOf,
  type AgentCatalog,
  type CatalogOption
} from "./catalog";

/** The voice row's values: vendor, TTS model, the list's voice or a typed ID, and the speed. */
export type VoiceValue = {
  /** The vendor (provider id); "" is None (apps only). */
  provider: string;
  /** The TTS model; "" when unknown (a saved voice the catalog doesn't offer). */
  model: string;
  /** The voice picked in the list; "" when a voice ID is typed. */
  voice: string;
  /** A typed voice ID, without the provider; it wins over the list. */
  voiceId: string;
  speed: number;
};

/** Select values can't be empty: this stands for None. */
const NONE = "none";
const NONE_OPTION: SelectOption = { value: NONE, label: "None" };

/** A voice row set to None. */
export const NO_VOICE: VoiceValue = {
  provider: "",
  model: "",
  voice: "",
  voiceId: "",
  speed: SPEED.normal
};

export const formatSpeed = (speed: number) => `${speed.toFixed(1)}×`;

const voiceCount = (n: number) => `${n} ${n === 1 ? "voice" : "voices"}`;

/** Keeps a saved value the workspace can no longer pick, marked as such. */
export function withUnavailable(options: SelectOption[], value: string) {
  return value && !options.some((o) => o.value === value)
    ? [{ value, label: `${value} (unavailable)` }, ...options]
    : options;
}

/** "Deepgram · Flux · Fernanda", or the typed voice ID in place of the voice. */
export function voiceSummary(catalog: AgentCatalog, tts: VoiceValue) {
  const parts = [
    catalog.providers[tts.provider] ?? tts.provider,
    tts.model && labelOf(catalog.tts, tts.model),
    tts.voiceId.trim() || (tts.voice && labelOf(catalog.voices, tts.voice))
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

/** A summary box ("OpenAI · gpt-4o-mini   temp 0.4 ⌄") that expands to its fields. */
export function PickerRow({
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

/**
 * A provider and one of its catalog items (a voice, a model). Switching the provider picks its
 * first item; a saved item the workspace can no longer use stays, marked unavailable. With
 * `allowNone`, None comes first and clears the value.
 */
export function ProviderModelPicker({
  label,
  catalog,
  options,
  value,
  error,
  allowNone,
  onChange
}: {
  label: string;
  catalog: AgentCatalog;
  options: CatalogOption[];
  value: string;
  error?: string;
  allowNone?: boolean;
  onChange: (value: string) => void;
}) {
  const [provider, setProvider] = useState(providerOf(value));
  const providers = withUnavailable(
    providerOptions(catalog, options),
    provider
  );
  return (
    <>
      <Field label="Provider">
        {(a11y) => (
          <Select
            {...a11y}
            value={provider || (allowNone ? NONE : "")}
            options={allowNone ? [NONE_OPTION, ...providers] : providers}
            onValueChange={(next) => {
              const chosen = next === NONE ? "" : next;
              setProvider(chosen);
              onChange(
                chosen
                  ? (options.find((o) => o.provider === chosen)?.id ?? "")
                  : ""
              );
            }}
          />
        )}
      </Field>
      {(provider || !allowNone) && (
        <Field label={label} error={error}>
          {(a11y) => (
            <Select
              {...a11y}
              value={value}
              options={withUnavailable(
                options
                  .filter((o) => o.provider === provider)
                  .map((o) => ({ value: o.id, label: o.label })),
                value
              )}
              onValueChange={onChange}
            />
          )}
        </Field>
      )}
    </>
  );
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
 * and the ID exclude each other: picking one clears the other. With `allowNone`, Vendor offers
 * None first, which hides the rest.
 */
export function VoicePicker({
  catalog,
  loading,
  value: tts,
  error,
  allowNone,
  onChange
}: {
  catalog: AgentCatalog;
  loading: boolean;
  value: VoiceValue;
  error?: string;
  allowNone?: boolean;
  onChange: (next: VoiceValue) => void;
}) {
  const [filter, setFilter] = useState("");
  const group = useId();
  const errorId = useId();
  const speedId = useId();

  // The new model's voice: the current one if the model has it, else its first.
  const voiceFor = (model: string) => {
    const offered = voicesOf(catalog, model);
    return offered.some((o) => o.id === tts.voice)
      ? tts.voice
      : (offered[0]?.id ?? "");
  };
  const withModel = (
    base: VoiceValue,
    model: string,
    typed: string
  ): VoiceValue => ({
    ...base,
    model,
    ...(typed.trim() ? {} : { voice: voiceFor(model) })
  });
  const changeVendor = (provider: string) =>
    onChange(
      provider
        ? withModel(
            { ...tts, provider, voiceId: "" },
            catalog.tts.find((o) => o.provider === provider)?.id ?? "",
            ""
          )
        : NO_VOICE
    );
  const pickVoice = (voice: string) =>
    onChange({
      ...tts,
      voice,
      voiceId: "",
      ...(tts.model ? {} : { model: firstModelOf(catalog, voice) })
    });
  const typeVoiceId = (voiceId: string) =>
    onChange({ ...tts, voiceId, ...(voiceId.trim() ? { voice: "" } : {}) });
  const setSpeed = (speed: number) => onChange({ ...tts, speed });
  const step = (by: number) =>
    setSpeed(
      Math.min(
        SPEED.max,
        Math.max(SPEED.min, Math.round((tts.speed + by) * 10) / 10)
      )
    );

  const vendors = withUnavailable(
    providerOptions(catalog, catalog.tts),
    tts.provider
  );
  const vendor = (
    <Field label="Vendor">
      {(a11y) => (
        <Select
          {...a11y}
          value={tts.provider || (allowNone ? NONE : "")}
          options={allowNone ? [NONE_OPTION, ...vendors] : vendors}
          onValueChange={(next) => changeVendor(next === NONE ? "" : next)}
        />
      )}
    </Field>
  );
  if (allowNone && !tts.provider) return vendor;

  const voices = tts.model
    ? voicesOf(catalog, tts.model)
    : catalog.voices.filter((o) => o.provider === tts.provider);
  const query = filter.trim().toLowerCase();
  const shown = query
    ? voices.filter((o) => o.label.toLowerCase().includes(query))
    : voices;

  return (
    <>
      {vendor}
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
            onValueChange={(model) =>
              onChange(withModel(tts, model, tts.voiceId))
            }
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
          onChange={(event) => setSpeed(Number(event.target.value))}
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
