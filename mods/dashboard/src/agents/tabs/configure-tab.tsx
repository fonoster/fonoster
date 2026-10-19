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
import { ChevronDown, Phone } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { Field } from "~/components/ui/field";
import { Select } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { approximateTokens, type AgentValues } from "../agent-form";
import { formatNumber, useCatalog } from "../agents.service";
import {
  EMPTY_CATALOG,
  LANGUAGES,
  labelOf,
  providerLabel,
  providerOf,
  providerOptions,
  speaks,
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
            options={
              provider && !providers.some((p) => p.value === provider)
                ? [
                    { value: provider, label: `${provider} (unavailable)` },
                    ...providers
                  ]
                : providers
            }
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

function ModelAndVoice() {
  const catalog = useCatalog().data ?? EMPTY_CATALOG;
  const [model, temperature, voice, sttModel, language] = useWatch<
    AgentValues,
    [
      "model.model",
      "model.temperature",
      "tts.voice",
      "stt.model",
      "stt.languageCode"
    ]
  >({
    name: [
      "model.model",
      "model.temperature",
      "tts.voice",
      "stt.model",
      "stt.languageCode"
    ]
  });
  const sttOptions = catalog.stt.filter((o) => speaks(o, language));
  const voiceLocale = catalog.voices.find((o) => o.id === voice)?.languages[0];

  return (
    <Panel title="Model & voice">
      <div className="flex flex-col gap-3">
        <PickerRow
          label="Language model"
          value={`${providerLabel(catalog, model)} · ${model ? labelOf(catalog.llm, model) : "—"}`}
          meta={
            Number.isFinite(temperature) ? `temp ${temperature}` : undefined
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
          value={`${providerLabel(catalog, voice)} · ${voice ? labelOf(catalog.voices, voice) : "—"}`}
          meta={voiceLocale || undefined}
        >
          <CatalogPicker
            name="tts.voice"
            label="Voice"
            catalog={catalog}
            options={catalog.voices}
          />
        </PickerRow>
        <PickerRow
          label="Transcriber"
          value={`${providerLabel(catalog, sttModel)} · ${sttModel ? labelOf(catalog.stt, sttModel) : "—"}`}
          meta={language || undefined}
        >
          <SelectField
            name="stt.languageCode"
            label="Language"
            options={LANGUAGES}
          />
          <CatalogPicker
            name="stt.model"
            label="Model"
            catalog={catalog}
            options={sttOptions}
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

const quietBox =
  "w-auto border-transparent bg-transparent px-1.5 hover:border-input";

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
          <ValueBox
            className={quietBox}
            invalid={Boolean(timeoutError ?? repeatsError)}
          >
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
          <ValueBox className={quietBox} invalid={Boolean(lengthError)}>
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
          <ValueBox
            className={cn(quietBox, "w-40")}
            invalid={Boolean(transferError)}
          >
            <ValueInput
              id="behavior-transfer"
              placeholder="Off"
              inputMode="tel"
              {...register("conversation.transferPhoneNumber")}
            />
          </ValueBox>
        </BehaviorRow>
        {transfer?.trim() && (
          <BehaviorRow
            label="Transfer message"
            htmlFor="behavior-transfer-message"
          >
            <ValueBox className={cn(quietBox, "w-40")}>
              <ValueInput
                id="behavior-transfer-message"
                {...register("conversation.transferMessage")}
              />
            </ValueBox>
          </BehaviorRow>
        )}
      </div>
    </Panel>
  );
}
