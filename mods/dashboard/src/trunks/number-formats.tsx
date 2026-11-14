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
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import {
  NUMBER_FORMAT_OPTIONS,
  takesPrefix,
  type TrunkValues
} from "./trunk-form";

const PARTIES = [
  {
    format: "calledNumberFormat",
    prefix: "calledNumberPrefix",
    label: "Called number",
    hint: "The number being dialed."
  },
  {
    format: "callerNumberFormat",
    prefix: "callerNumberPrefix",
    label: "Caller number",
    hint: "Your number, shown as caller ID."
  }
] as const;

/**
 * How numbers are written on calls to the carrier: a format for the called and the caller
 * number, each with a prefix right after it (in tab order) when its format takes one.
 */
export function NumberFormats({ form }: { form: UseFormReturn<TrunkValues> }) {
  const values = useWatch({
    control: form.control,
    name: ["calledNumberFormat", "callerNumberFormat"]
  });
  const { errors } = form.formState;

  return (
    <section
      aria-labelledby="number-format-title"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="number-format-title"
          className="font-display text-sm font-medium"
        >
          Number format on outbound calls
        </h2>
        <p className="text-[13px] text-text-secondary">
          How numbers are written on calls to your carrier. Change these only if
          your carrier asks.
        </p>
      </div>
      {PARTIES.map((party, i) => (
        <div key={party.format} className="grid gap-4 sm:grid-cols-2">
          <Field label={party.label} hint={party.hint}>
            {(a11y) => (
              <Controller
                control={form.control}
                name={party.format}
                render={({ field }) => (
                  <Select
                    {...a11y}
                    value={field.value}
                    onValueChange={(format) => {
                      field.onChange(format);
                      // A format without a prefix hides and clears it.
                      if (!takesPrefix(format))
                        form.setValue(party.prefix, "", { shouldDirty: true });
                    }}
                    options={NUMBER_FORMAT_OPTIONS}
                  />
                )}
              />
            )}
          </Field>
          {takesPrefix(values[i]) && (
            <Field
              label={`${party.label} prefix`}
              error={errors[party.prefix]?.message}
              hint="Digits, * or #, added in front."
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register(party.prefix)}
                  autoComplete="off"
                />
              )}
            </Field>
          )}
        </div>
      ))}
    </section>
  );
}
