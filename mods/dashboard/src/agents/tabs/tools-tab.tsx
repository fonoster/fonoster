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
import { Plus, Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import {
  useController,
  useFieldArray,
  useFormContext,
  useWatch
} from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { EMPTY_TOOL, type AgentValues } from "../agent-form";
import {
  SelectField,
  SwitchControl,
  TextField,
  useFieldError
} from "../fields";
import { formatNumber } from "../agents.service";
import { Panel, PanelAction } from "../parts";

const PARAMETER_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "array",
  "object"
].map((value) => ({ value, label: value }));
const FORMATS = [
  { value: "none", label: "—" },
  { value: "enum", label: "enum" },
  { value: "date-time", label: "date-time" }
];
const METHODS = [
  { value: "get", label: "GET" },
  { value: "post", label: "POST" }
];

export function ToolsTab() {
  const { control, formState } = useFormContext<AgentValues>();
  const tools = useFieldArray({ control, name: "tools" });
  const values = useWatch<AgentValues, "tools">({ name: "tools" }) ?? [];
  const transfer = useWatch<AgentValues, "conversation.transferPhoneNumber">({
    name: "conversation.transferPhoneNumber"
  });
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, tools.fields.length - 1);
  const toolErrors = formState.errors.tools;

  const add = () => {
    tools.append({ ...EMPTY_TOOL, parameters: [], headers: [] });
    setSelected(tools.fields.length);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Panel title="Built-in">
          <ul className="flex flex-col gap-3">
            <BuiltIn
              name="hangup"
              description="Ends the call when the conversation is over."
              status="Always on"
            />
            <BuiltIn
              name="transfer"
              description="Sends the caller to a human."
              status={
                transfer?.trim()
                  ? `On · ${formatNumber(transfer.trim())}`
                  : "Off · set a number in Configure"
              }
            />
          </ul>
        </Panel>
        <Panel
          title="Your tools"
          action={
            <PanelAction accent onClick={add}>
              + Add tool
            </PanelAction>
          }
        >
          {tools.fields.length === 0 ? (
            <p className="font-display text-[13px] text-muted-foreground">
              Tools let the agent call your APIs during a call, e.g. to look up
              an order or book an appointment.
            </p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Your tools">
              {tools.fields.map((field, i) => {
                const tool = values[i] ?? field;
                const invalid = Boolean(toolErrors?.[i]);
                return (
                  <li key={field.id}>
                    <button
                      type="button"
                      aria-current={i === index || undefined}
                      onClick={() => setSelected(i)}
                      className={cn(
                        "flex w-full cursor-pointer flex-col gap-1 rounded-control border px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        i === index
                          ? "border-foreground"
                          : "border-border hover:bg-accent",
                        invalid && "border-destructive"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[13px]">
                          {tool.name || "untitled_tool"}
                        </span>
                        <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {tool.method.toUpperCase()}
                        </span>
                      </span>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {tool.url || "No URL yet"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
      {index >= 0 ? (
        <ToolEditor
          key={tools.fields[index].id}
          index={index}
          onDelete={() => {
            tools.remove(index);
            setSelected(Math.max(0, index - 1));
          }}
        />
      ) : (
        <section
          aria-label="Tool editor"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center"
        >
          <Wrench className="size-5 text-muted-foreground" aria-hidden />
          <p className="max-w-sm font-display text-sm text-muted-foreground">
            Add a tool to describe an HTTP endpoint the agent can call. The
            model reads the description to decide when to use it.
          </p>
          <Button variant="outline" onClick={add}>
            <Plus aria-hidden /> Add tool
          </Button>
        </section>
      )}
    </div>
  );
}

function BuiltIn({
  name,
  description,
  status
}: {
  name: string;
  description: string;
  status: string;
}) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-mono text-[13px]">{name}</span>
        <span className="font-display text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="shrink-0 font-display text-xs text-muted-foreground">
        {status}
      </span>
    </li>
  );
}

function ToolEditor({
  index,
  onDelete
}: {
  index: number;
  onDelete: () => void;
}) {
  const { register } = useFormContext<AgentValues>();
  const nameError = useFieldError(`tools.${index}.name`);
  return (
    <Panel
      title={
        <input
          aria-label="Tool name"
          aria-invalid={Boolean(nameError)}
          placeholder="tool_name"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "-mx-1.5 w-full rounded-[6px] border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-[15px] font-medium outline-none hover:border-input focus-visible:border-ring",
            nameError && "border-destructive"
          )}
          {...register(`tools.${index}.name`)}
        />
      }
      action={
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 cursor-pointer font-display text-[13px] text-destructive outline-none hover:underline focus-visible:underline"
        >
          Delete
        </button>
      }
    >
      {nameError && (
        <p
          role="alert"
          className="-mt-2 font-display text-[11px] text-destructive"
        >
          {nameError}
        </p>
      )}
      <TextField
        name={`tools.${index}.description`}
        label="Description"
        action={
          <span className="font-display text-[11px] text-muted-foreground">
            The model reads this to decide when to call the tool
          </span>
        }
      />
      <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
        <SelectField
          name={`tools.${index}.method`}
          label="Method"
          options={METHODS}
        />
        <TextField
          name={`tools.${index}.url`}
          label="URL"
          placeholder="https://api.example.com/invoices"
          inputMode="url"
          spellCheck={false}
          className="[&_input]:font-mono"
        />
      </div>
      <Parameters toolIndex={index} />
      <Headers toolIndex={index} />
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <TextField
          name={`tools.${index}.requestStartMessage`}
          label="Say while it runs"
          placeholder="One moment while I check that…"
          action={
            <span className="font-display text-[11px] text-muted-foreground">
              optional
            </span>
          }
        />
        <label className="flex h-[38px] items-center gap-2.5 font-display text-[13px] text-muted-foreground">
          <SwitchControl
            name={`tools.${index}.waitForResponse`}
            label="Wait for response"
          />
          Wait for response
        </label>
      </div>
    </Panel>
  );
}

function Parameters({ toolIndex }: { toolIndex: number }) {
  const { control, register } = useFormContext<AgentValues>();
  const parameters = useFieldArray({
    control,
    name: `tools.${toolIndex}.parameters`
  });
  const errors =
    useFormContext<AgentValues>().formState.errors.tools?.[toolIndex]
      ?.parameters;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs text-muted-foreground">
          Parameters
        </span>
        <PanelAction
          className="text-xs"
          onClick={() =>
            parameters.append({
              name: "",
              type: "string",
              format: "",
              required: true,
              extra: {}
            })
          }
        >
          + Add parameter
        </PanelAction>
      </div>
      {parameters.fields.length === 0 ? (
        <p className="font-display text-xs text-muted-foreground">
          No parameters. The model calls the tool without arguments.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-control border border-border">
          <table
            className="w-full min-w-[480px] text-left font-mono text-xs"
            aria-label="Parameters"
          >
            <thead>
              <tr className="h-8 font-display text-[11px] uppercase text-muted-foreground">
                <th scope="col" className="px-3 font-normal">
                  Name
                </th>
                <th scope="col" className="w-28 px-3 font-normal">
                  Type
                </th>
                <th scope="col" className="w-28 px-3 font-normal">
                  Format
                </th>
                <th scope="col" className="w-20 px-3 font-normal">
                  Required
                </th>
                <th scope="col" className="w-10 px-3 font-normal">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {parameters.fields.map((field, i) => {
                const path = `tools.${toolIndex}.parameters.${i}` as const;
                const error = errors?.[i]?.name?.message;
                return (
                  <tr
                    key={field.id}
                    className="group h-10 border-t border-border align-middle"
                  >
                    <td className="px-1.5 py-1">
                      <Input
                        aria-label={`Parameter ${i + 1} name`}
                        aria-invalid={Boolean(error)}
                        className="h-7 border-transparent bg-transparent px-1.5 font-mono text-xs hover:border-input"
                        spellCheck={false}
                        {...register(`${path}.name`)}
                      />
                      {error && (
                        <p
                          role="alert"
                          className="pt-1 text-xs text-destructive"
                        >
                          {error}
                        </p>
                      )}
                    </td>
                    <td className="px-1.5 py-1">
                      <InlineSelect
                        name={`${path}.type`}
                        label={`Parameter ${i + 1} type`}
                        options={PARAMETER_TYPES}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <InlineSelect
                        name={`${path}.format`}
                        label={`Parameter ${i + 1} format`}
                        options={FORMATS}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <RequiredCheckbox path={`${path}.required`} index={i} />
                    </td>
                    <td className="px-1.5 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Remove parameter ${i + 1}`}
                        onClick={() => parameters.remove(i)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InlineSelect({
  name,
  label,
  options
}: {
  name: `tools.${number}.parameters.${number}.${"type" | "format"}`;
  label: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<AgentValues>();
  const { field } = useController({ control, name });
  // Radix Select can't hold an empty value: "" (no format) shows as "none".
  const value = String(field.value || "none");
  return (
    <Select
      aria-label={label}
      className="h-7 border-transparent bg-transparent px-1.5 font-mono text-xs hover:border-input"
      value={value}
      options={
        options.some((o) => o.value === value)
          ? options
          : [{ value, label: value }, ...options]
      }
      onValueChange={(next) => field.onChange(next === "none" ? "" : next)}
    />
  );
}

function RequiredCheckbox({
  path,
  index
}: {
  path: `tools.${number}.parameters.${number}.required`;
  index: number;
}) {
  const { control } = useFormContext<AgentValues>();
  const { field } = useController({ control, name: path });
  return (
    <Select
      aria-label={`Parameter ${index + 1} required`}
      className="h-7 border-transparent bg-transparent px-1.5 font-mono text-xs hover:border-input"
      value={field.value ? "yes" : "no"}
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]}
      onValueChange={(next) => field.onChange(next === "yes")}
    />
  );
}

function Headers({ toolIndex }: { toolIndex: number }) {
  const { control, register } = useFormContext<AgentValues>();
  const headers = useFieldArray({
    control,
    name: `tools.${toolIndex}.headers`
  });
  const errors =
    useFormContext<AgentValues>().formState.errors.tools?.[toolIndex]?.headers;
  const listError = useFieldError(`tools.${toolIndex}.headers`);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs text-muted-foreground">
          Headers
        </span>
        <PanelAction
          className="text-xs"
          onClick={() => headers.append({ key: "", value: "" })}
        >
          + Add header
        </PanelAction>
      </div>
      {headers.fields.length === 0 && (
        <p className="font-display text-xs text-muted-foreground">
          No headers. Accept and Content-Type are set for you.
        </p>
      )}
      {headers.fields.map((field, i) => {
        const error = errors?.[i]?.key?.message;
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <div
              className={cn(
                "group flex h-[38px] items-center rounded-control border border-input bg-background px-3 font-mono text-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
                error && "border-destructive"
              )}
            >
              <input
                aria-label={`Header ${i + 1} name`}
                aria-invalid={Boolean(error)}
                placeholder="x-api-key"
                className="min-w-[4ch] max-w-[40%] bg-transparent outline-none placeholder:text-text-muted [field-sizing:content]"
                spellCheck={false}
                {...register(`tools.${toolIndex}.headers.${i}.key`)}
              />
              <span aria-hidden className="mr-1.5">
                :
              </span>
              <input
                type="password"
                aria-label={`Header ${i + 1} value`}
                className="min-w-0 flex-1 bg-transparent outline-none"
                spellCheck={false}
                autoComplete="off"
                {...register(`tools.${toolIndex}.headers.${i}.value`)}
              />
              <button
                type="button"
                className="cursor-pointer rounded-[4px] p-1 text-muted-foreground opacity-0 outline-none group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                aria-label={`Remove header ${i + 1}`}
                onClick={() => headers.remove(i)}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        );
      })}
      {listError && (
        <p role="alert" className="text-xs text-destructive">
          {listError}
        </p>
      )}
    </div>
  );
}
