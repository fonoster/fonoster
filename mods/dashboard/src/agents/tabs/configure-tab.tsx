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
import { useFormContext, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { useWorkspace } from "~/lib/workspace";
import { approximateTokens, type AgentValues } from "../agent-form";
import { formatNumber } from "../agents.service";
import {
  LANGUAGES,
  LLM_MODELS,
  LLM_PROVIDERS,
  STT_MODELS,
  TTS_PROVIDERS,
  voicesFor,
  type LlmProvider
} from "../catalog";
import {
  NumberInput,
  SelectField,
  SwitchControl,
  TextField,
  useFieldError
} from "../fields";
import { Panel, SettingRow } from "../parts";

export function ConfigureTab({ numbers }: { numbers: INumber[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Conversation />
      <div className="flex flex-col gap-5">
        <ModelAndVoice />
        <ReachableAt numbers={numbers} />
        <Behavior />
      </div>
    </div>
  );
}

function Conversation() {
  const prompt = useWatch<AgentValues, "conversation.systemPrompt">({
    name: "conversation.systemPrompt"
  });
  const tokens = approximateTokens(prompt ?? "");
  return (
    <Panel title="Conversation">
      <TextField
        name="conversation.firstMessage"
        label="First message"
        hint="Said when the call connects. Leave empty to let the caller speak first."
      />
      <TextField
        name="conversation.systemPrompt"
        label="System prompt"
        multiline
        rows={16}
        spellCheck={false}
        className="[&_textarea]:font-mono [&_textarea]:text-[13px] [&_textarea]:leading-relaxed"
        action={
          <span className="font-display text-xs text-muted-foreground">
            ~{tokens.toLocaleString("en-US")} tokens
          </span>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="conversation.goodbyeMessage" label="Goodbye message" />
        <TextField
          name="conversation.systemErrorMessage"
          label="Error message"
        />
      </div>
    </Panel>
  );
}

function ModelAndVoice() {
  const { setValue } = useFormContext<AgentValues>();
  const [provider, ttsProvider] = useWatch<
    AgentValues,
    ["model.provider", "tts.productRef"]
  >({ name: ["model.provider", "tts.productRef"] });

  return (
    <Panel title="Model & voice">
      <SelectField
        name="model.provider"
        label="Language model"
        options={[...LLM_PROVIDERS]}
        onChange={(next) =>
          setValue(
            "model.model",
            LLM_MODELS[next as LlmProvider]?.[0]?.value ?? "",
            { shouldDirty: true }
          )
        }
      />
      {provider === "ollama" ? (
        <TextField
          name="model.model"
          label="Model"
          placeholder="llama3.1"
          hint="Any model your Ollama server has pulled. Set its base URL in Advanced."
        />
      ) : (
        <SelectField
          name="model.model"
          label="Model"
          options={LLM_MODELS[provider as LlmProvider] ?? []}
        />
      )}
      <SelectField
        name="tts.productRef"
        label="Voice provider"
        options={[...TTS_PROVIDERS]}
        onChange={(next) =>
          setValue("tts.voice", voicesFor(next)[0]?.value ?? "", {
            shouldDirty: true
          })
        }
      />
      <SelectField
        name="tts.voice"
        label="Voice"
        options={voicesFor(ttsProvider)}
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          name="stt.model"
          label="Transcriber (Deepgram)"
          options={STT_MODELS}
        />
        <SelectField
          name="stt.languageCode"
          label="Language"
          options={LANGUAGES}
        />
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
          className="font-display text-xs text-brand-text hover:underline"
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
            <li
              key={number.ref}
              className="flex items-center justify-between gap-3 text-[13px]"
            >
              <span className="font-mono">{formatNumber(number.telUrl)}</span>
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

function Behavior() {
  const transfer = useWatch<AgentValues, "conversation.transferPhoneNumber">({
    name: "conversation.transferPhoneNumber"
  });
  const timeoutError = useFieldError("conversation.idleTimeoutSeconds");
  const repeatsError = useFieldError("conversation.idleMaxTimeoutCount");
  const lengthError = useFieldError("conversation.maxSessionMinutes");
  const idleError = timeoutError ?? repeatsError;
  return (
    <Panel title="Behavior">
      <div className="flex flex-col gap-3">
        <SettingRow label="Let callers interrupt">
          <SwitchControl
            name="conversation.allowUserBargeIn"
            label="Let callers interrupt"
          />
        </SettingRow>
        <SettingRow
          label="Hang up after silence"
          hint="Repeats × seconds of silence"
          error={idleError}
        >
          <NumberInput
            name="conversation.idleMaxTimeoutCount"
            aria-label="Silence repeats"
            step={1}
            min={1}
            className="w-16"
          />
          <span aria-hidden className="text-xs text-muted-foreground">
            ×
          </span>
          <NumberInput
            name="conversation.idleTimeoutSeconds"
            aria-label="Silence timeout (seconds)"
            step={1}
            min={1}
            className="w-16"
          />
          <span className="text-xs text-muted-foreground">s</span>
        </SettingRow>
        <SettingRow label="Max call length" error={lengthError}>
          <NumberInput
            name="conversation.maxSessionMinutes"
            aria-label="Max call length (minutes)"
            step={1}
            min={1}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </SettingRow>
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <TextField
            name="conversation.transferPhoneNumber"
            label="Transfer to a human"
            placeholder="+18095550100"
            inputMode="tel"
            hint="Leave empty to turn off transfers."
          />
          {transfer?.trim() && (
            <TextField
              name="conversation.transferMessage"
              label="Say before transferring"
            />
          )}
        </div>
      </div>
    </Panel>
  );
}
