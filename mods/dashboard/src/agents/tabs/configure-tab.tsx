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
import { Phone } from "lucide-react";
import { type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { useWorkspace } from "~/lib/workspace";
import { approximateTokens, type AgentValues } from "../agent-form";
import { formatNumber, useCatalog } from "../agents.service";
import {
  EMPTY_CATALOG,
  ignoresTemperature,
  languageName,
  summaryOf,
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
import {
  formatSpeed,
  PickerRow,
  ProviderModelPicker,
  VoicePicker as SharedVoicePicker,
  voiceSummary,
  type VoiceValue
} from "../speech-pickers";

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

/** The shared provider and model picker, bound to a form path. */
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
  const { setValue, formState } = useFormContext<AgentValues>();
  const value = String(useWatch<AgentValues>({ name }) ?? "");
  const error = useFieldError(name);
  return (
    <ProviderModelPicker
      label={label}
      catalog={catalog}
      options={options}
      value={value}
      error={error}
      onChange={(next) =>
        setValue(name, next, {
          shouldDirty: true,
          shouldValidate: formState.isSubmitted
        })
      }
    />
  );
}

/** The shared voice picker, bound to the form's `tts` fields. */
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
  return (
    <SharedVoicePicker
      catalog={catalog}
      loading={loading}
      value={tts}
      error={error}
      onChange={(next) => {
        for (const key of Object.keys(next) as (keyof VoiceValue)[])
          if (next[key] !== tts[key])
            setValue(`tts.${key}`, next[key] as never, {
              shouldDirty: true,
              shouldValidate: formState.isSubmitted
            });
      }}
    />
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
