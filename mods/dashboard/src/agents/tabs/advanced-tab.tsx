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
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { CallHandlingDrawer } from "~/session/apps";
import { type AgentValues } from "../agent-form";
import { useFieldError, type AgentPath } from "../fields";
import { Panel, PanelAction, SettingRow, ValueBox, ValueInput } from "../parts";

// Layout and copy from designs/dashboard.pen "Agent / Detail / Advanced".

export function AdvancedTab({
  appRef,
  onDelete
}: {
  appRef: string;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [callHandling, setCallHandling] = useState(false);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-5">
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
          </div>
        </Panel>
      </div>
      <div className="flex flex-col gap-5">
        <Panel
          title="Call handling"
          description="Fallback, listeners, recording, noise cancelling and answering-machine detection."
          action={
            <PanelAction accent onClick={() => setCallHandling(true)}>
              Edit
            </PanelAction>
          }
        >
          <CallHandlingDrawer
            open={callHandling}
            onOpenChange={setCallHandling}
            appRef={appRef}
            onSaved={() => {
              setCallHandling(false);
              void queryClient.invalidateQueries({
                queryKey: ["applications"]
              });
            }}
          />
        </Panel>
        <Panel title="Moved out of the agent">
          <p className="font-display text-[12px] text-muted-foreground">
            Turn detection runs in Fonoster, call events go to workspace
            Webhooks, and vendor keys and endpoints come from Vendor keys and
            the provider catalog.
          </p>
        </Panel>
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
