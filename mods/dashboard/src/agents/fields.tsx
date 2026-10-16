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
 * Controls bound to the agent form (through FormProvider), so each tab can
 * render fields by path without threading `control` around.
 */
import type { ComponentProps } from "react";
import {
  get,
  useController,
  useFormContext,
  type FieldPath
} from "react-hook-form";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select, type SelectOption } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { AgentValues } from "./agent-form";

export type AgentPath = FieldPath<AgentValues>;

export function useFieldError(name: AgentPath): string | undefined {
  const { formState } = useFormContext<AgentValues>();
  return get(formState.errors, name)?.message as string | undefined;
}

export function TextField({
  name,
  label,
  hint,
  action,
  multiline,
  className,
  ...props
}: {
  name: AgentPath;
  label: string;
  hint?: string;
  action?: React.ReactNode;
  multiline?: boolean;
  className?: string;
} & Omit<ComponentProps<"input"> & ComponentProps<"textarea">, "name">) {
  const { register } = useFormContext<AgentValues>();
  const error = useFieldError(name);
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      action={action}
      className={className}
    >
      {(a11y) =>
        multiline ? (
          <Textarea
            {...a11y}
            {...register(name)}
            {...(props as ComponentProps<"textarea">)}
          />
        ) : (
          <Input
            {...a11y}
            {...register(name)}
            {...(props as ComponentProps<"input">)}
          />
        )
      }
    </Field>
  );
}

/** A compact number input; `aria-label` names it when there's no Field label. */
export function NumberInput({
  name,
  className,
  ...props
}: { name: AgentPath } & Omit<ComponentProps<"input">, "name">) {
  const { register } = useFormContext<AgentValues>();
  const error = useFieldError(name);
  return (
    <Input
      type="number"
      inputMode="decimal"
      aria-invalid={Boolean(error)}
      {...register(name, { valueAsNumber: true })}
      {...props}
      className={cn("h-9 w-24 px-3 text-right", className)}
    />
  );
}

export function SelectField({
  name,
  label,
  options,
  hint,
  onChange
}: {
  name: AgentPath;
  label: string;
  options: SelectOption[];
  hint?: string;
  /** Runs after the value changes, e.g. to reset a dependent field. */
  onChange?: (value: string) => void;
}) {
  const { control } = useFormContext<AgentValues>();
  const { field } = useController({ control, name });
  const error = useFieldError(name);
  const value = String(field.value ?? "");
  // Keep values saved outside the catalog selectable.
  const all =
    value && !options.some((o) => o.value === value)
      ? [{ value, label: value }, ...options]
      : options;
  return (
    <Field label={label} hint={hint} error={error}>
      {(a11y) => (
        <Select
          {...a11y}
          value={value}
          options={all}
          onValueChange={(next) => {
            field.onChange(next);
            onChange?.(next);
          }}
        />
      )}
    </Field>
  );
}

export function SwitchControl({
  name,
  label,
  ...props
}: { name: AgentPath; label: string } & Omit<
  ComponentProps<typeof Switch>,
  "name" | "checked" | "onCheckedChange"
>) {
  const { control } = useFormContext<AgentValues>();
  const { field } = useController({ control, name });
  return (
    <Switch
      aria-label={label}
      checked={Boolean(field.value)}
      onCheckedChange={field.onChange}
      {...props}
    />
  );
}
